import { beforeEach, describe, expect, it, vi } from "vitest";
import { callHttpbin } from "./httpbin.service.js";

// replace the real fetch with a fake one, so tests never hit the internet
const fakeFetch = vi.fn();
vi.stubGlobal("fetch", fakeFetch);

beforeEach(() => {
	fakeFetch.mockReset();
});

describe("callHttpbin", () => {
	it("sends a POST with a JSON payload to httpbin", async () => {
		fakeFetch.mockResolvedValue(new Response("{}"));

		const result = await callHttpbin();

		const [url, options] = fakeFetch.mock.calls[0]!;
		expect(url).toBe("https://httpbin.org/anything");
		expect(options.method).toBe("POST");
		expect(JSON.parse(options.body)).toEqual(result.requestPayload);
	});

	it("returns ok: true on a 200 response", async () => {
		fakeFetch.mockResolvedValue(new Response('{"hello":"world"}', { status: 200 }));

		const result = await callHttpbin();

		expect(result.ok).toBe(true);
		expect(result.statusCode).toBe(200);
		expect(result.responseBody).toEqual({ hello: "world" });
		expect(result.error).toBe(null);
	});

	it("returns ok: false on a 500 response", async () => {
		fakeFetch.mockResolvedValue(new Response("{}", { status: 500 }));

		const result = await callHttpbin();

		expect(result.ok).toBe(false);
		expect(result.statusCode).toBe(500);
		expect(result.error).toBe("httpbin returned 500");
	});

	it("returns ok: false (and doesn't throw) on a timeout", async () => {
		fakeFetch.mockRejectedValue(new Error("The operation was aborted due to timeout"));

		const result = await callHttpbin();

		expect(result.ok).toBe(false);
		expect(result.statusCode).toBe(null);
		expect(result.error).toBe("The operation was aborted due to timeout");
	});

	it("returns ok: false (and doesn't throw) on a network error", async () => {
		fakeFetch.mockRejectedValue(new Error("fetch failed"));

		const result = await callHttpbin();

		expect(result.ok).toBe(false);
		expect(result.statusCode).toBe(null);
		expect(result.error).toBe("fetch failed");
	});
});
