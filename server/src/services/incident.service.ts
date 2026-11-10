import { generateText, Output } from "ai";
import { z } from "zod";
import { aiEnabled, countTokens, geminiOptions, model } from "../lib/gemini.js";
import { logger } from "../lib/logger.js";
import { type Incident, type NewIncident, type Severity, saveIncident } from "../repositories/incident.repository.js";
import { getBaseline, getPingStats, type SavedPing } from "../repositories/ping.repository.js";
import { HTTPBIN_URL, INCIDENT_MIN_SAMPLES, SEVERITY_THRESHOLDS } from "../config/constants.js";
import { recordCall, takeSlot } from "./llmBudget.service.js";

// the rule from the brief: slower than 2x the average is an incident.
// "average" here is the 24h median (see getBaseline), so past slow pings don't raise the bar.
// Pure function (no database, no LLM) so it's easy to test.
export function classify(responseTimeMs: number, avgMs: number | null, samples: number): Severity | null {
	// too few samples and the average means little (e.g. right after the first deploy)
	if (avgMs === null || avgMs <= 0 || samples < INCIDENT_MIN_SAMPLES) return null;
	const ratio = responseTimeMs / avgMs;
	if (ratio > SEVERITY_THRESHOLDS.high) return "high";
	if (ratio > SEVERITY_THRESHOLDS.medium) return "medium";
	if (ratio > SEVERITY_THRESHOLDS.low) return "low";
	return null;
}

const reportSchema = z.object({
	summary: z.string().describe("One or two sentences: what happened"),
	rootCauses: z.array(z.string()).max(3).describe("Likely causes, most likely first"),
	recommendations: z.array(z.string()).max(3).describe("Concrete next steps"),
});
type Report = z.infer<typeof reportSchema>;

// used when we're out of LLM calls or Gemini fails: the incident is still recorded
function templateReport(ping: SavedPing, avgMs: number): Report {
	const ratio = (ping.responseTimeMs / avgMs).toFixed(1);
	return {
		summary: `Response took ${ping.responseTimeMs} ms, ${ratio}x the 24h median of ${avgMs} ms.`,
		rootCauses: ["Slow response from httpbin.org or the network path to it (not analysed: AI quota used up or unavailable)"],
		recommendations: ["Check whether the next pings recover", "Look for failures around the same time"],
	};
}

async function llmReport(ping: SavedPing, avgMs: number, severity: Severity): Promise<Report> {
	const now = new Date();
	const lastHour = await getPingStats(new Date(now.getTime() - 3600_000).toISOString(), now.toISOString());

	const prompt = `Write a short incident report for an HTTP monitor.
Endpoint: POST ${HTTPBIN_URL} (a public echo service, we don't control it)
Time: ${ping.createdAt}
Response time: ${ping.responseTimeMs} ms (24h median of successful pings: ${avgMs} ms), severity: ${severity}
Status: ${ping.statusCode ?? "no response"}${ping.error ? `, error: ${ping.error}` : ""}
Last hour: ${lastHour.total} pings, ${lastHour.failures} failed, avg ${lastHour.avgMs} ms, max ${lastHour.maxMs} ms.
Root causes must be plausible for a public echo service called over the internet. Recommendations must be actionable for us, the monitoring side.`;

	// the prompt has a fixed shape, so this is for the log, not a limit check
	logger.info({ inputTokens: await countTokens(prompt) }, "Generating incident report");

	const { output, usage } = await generateText({
		model,
		prompt,
		output: Output.object({ schema: reportSchema }),
		providerOptions: geminiOptions,
	});
	await recordCall("incident", usage);
	return output;
}

// called after every saved ping
export async function checkForIncident(ping: SavedPing): Promise<Incident | null> {
	if (!ping.ok) return null; // failures are already visible in the table; the brief's rule is about slowness

	const { avgMs, samples } = await getBaseline(ping.id);
	const severity = classify(ping.responseTimeMs, avgMs, samples);
	if (!severity || avgMs === null) return null;

	let report = templateReport(ping, avgMs);
	let generatedBy: NewIncident["generatedBy"] = "template";

	if (aiEnabled && takeSlot()) {
		try {
			report = await llmReport(ping, avgMs, severity);
			generatedBy = "llm";
		} catch (err) {
			logger.error({ err }, "LLM incident report failed, using template");
		}
	}

	const incident = await saveIncident({
		pingId: ping.id,
		endpoint: HTTPBIN_URL,
		severity,
		responseTimeMs: ping.responseTimeMs,
		averageMs: avgMs,
		...report,
		generatedBy,
	});
	logger.warn({ id: incident.id, severity, responseTimeMs: ping.responseTimeMs, avgMs }, "Incident recorded");
	return incident;
}
