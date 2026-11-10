import { convertToModelMessages, isStepCount, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { model } from "../lib/gemini.js";
import { findPings, getPingStats } from "../repositories/ping.repository.js";
import { HTTPBIN_URL } from "./httpbin.service.js";
import { recordCall } from "./llmBudget.service.js";

// fixed text first so Gemini can reuse it between calls (implicit caching); changing parts go at the end
const SYSTEM_PROMPT = `You answer questions about an HTTP monitor.
The monitor sends a POST with a small random JSON body to ${HTTPBIN_URL} every 5 minutes and stores:
time, success (ok), HTTP status code, response time in ms, and an error message for failures.
A ping fails on a timeout (10 s), a network error or a non-2xx status.

Rules:
- Use the tools to get data. Never guess numbers.
- Pick the smallest time range that answers the question.
- Each tool call round costs money, so call the tools you need together in one round, not one by one.
- For "why" or "spike" questions, make these calls together, then answer:
  getStats for the period asked, getStats for the 24 hours before now as the baseline,
  and findPings sorted by slowest for the period asked.
- Show times in the user's timezone, e.g. "2:15 PM".
- When asked "why", give likely causes based on the data (time of day, failures nearby, how far from normal),
  and say clearly that it's a likely cause, not a certainty. You cannot see httpbin's servers.
- If the question is not about this monitoring data, say you can only answer questions about it.
- Keep answers short: a few sentences or a short list. Plain text only, no markdown tables or headings.`;

const MAX_STEPS = 7;

const FINAL_STEP_INSTRUCTION =
	"You have no tool calls left. Do not call any tool. Answer now using only the tool results above; if they are not enough, say what you found and what is missing.";

const timeRange = {
	from: z.string().describe("Start time, ISO 8601 with timezone offset"),
	to: z.string().describe("End time, ISO 8601 with timezone offset"),
};

const tools = {
	getStats: tool({
		description:
			"Totals for a time range: number of pings, failures, and average / min / max / p95 response time of successful pings.",
		inputSchema: z.object(timeRange),
		execute: ({ from, to }) => getPingStats(from, to),
	}),
	findPings: tool({
		description: "List individual pings in a time range, e.g. the slowest ones or only the failures.",
		inputSchema: z.object({
			...timeRange,
			onlyFailures: z.boolean().describe("true to return failed pings only"),
			sortBy: z.enum(["newest", "slowest", "fastest"]),
			limit: z.number().int().min(1).max(20).describe("How many pings to return, at most 20"),
		}),
		execute: (filter) => findPings(filter),
	}),
};

interface ChatInput {
	messages: UIMessage[];
	timezone: string;
	stepsAllowed: number; // calls left in this hour's budget
	onAnswer: (text: string) => void;
}

export async function streamChatAnswer({ messages, timezone, stepsAllowed, onAnswer }: ChatInput) {
	const maxSteps = Math.min(MAX_STEPS, stepsAllowed);

	return streamText({
		model,
		instructions: `${SYSTEM_PROMPT}\n\nCurrent time: ${new Date().toISOString()}. User's timezone: ${timezone}.`,
		messages: await convertToModelMessages(messages),
		tools,
		stopWhen: isStepCount(maxSteps),
		// last allowed step: no more tools, so the model has to write its answer.
		// Gemini ignores toolChoice "none" alone after a few tool calls (the SDK then throws
		// ToolChoiceViolationError), so it also gets an explicit instruction.
		prepareStep: ({ stepNumber, messages }) =>
			stepNumber === maxSteps - 1
				? {
						activeTools: [],
						toolChoice: "none",
						messages: [...messages, { role: "user", content: FINAL_STEP_INSTRUCTION }],
					}
				: undefined,
		// every step is one Gemini call, so every step counts towards the hourly limit
		onStepEnd: ({ usage }) => recordCall("chat", usage),
		onEnd: ({ text }) => {
			if (text) onAnswer(text);
		},
	});
}
