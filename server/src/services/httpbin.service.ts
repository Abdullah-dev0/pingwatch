const HTTPBIN_URL = "https://httpbin.org/anything";
const TIMEOUT_MS = 10_000;

export interface PingResult {
	ok: boolean;
	statusCode: number | null; // null if we got no response at all
	responseTimeMs: number;
	requestPayload: Record<string, unknown>;
	responseBody: unknown;
	error: string | null;
}

export function randomPayload(): Record<string, unknown> {
	return {
		id: crypto.randomUUID(),
		value: Math.floor(Math.random() * 1000),
		active: Math.random() < 0.5,
		sentAt: new Date().toISOString(),
	};
}

// doesn't throw - failures come back as ok: false so the job keeps running
export async function callHttpbin(): Promise<PingResult> {
	const requestPayload = randomPayload();
	const start = performance.now();

	try {
		const response = await fetch(HTTPBIN_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(requestPayload),
			signal: AbortSignal.timeout(TIMEOUT_MS),
		});

		const responseBody = await response.json().catch(() => null);

		return {
			ok: response.ok,
			statusCode: response.status,
			responseTimeMs: Math.round(performance.now() - start),
			requestPayload,
			responseBody,
			error: response.ok ? null : `httpbin returned ${response.status}`,
		};
	} catch (err) {
		return {
			ok: false,
			statusCode: null,
			responseTimeMs: Math.round(performance.now() - start),
			requestPayload,
			responseBody: null,
			error: err instanceof Error ? err.message : String(err),
		};
	}
}
