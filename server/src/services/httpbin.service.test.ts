// Every test has 3 steps:
//   1. set up   - decide what the fake fetch will return
//   2. run      - call the real function we're testing
//   3. check    - expect(...) says what the answer should be. If it's wrong, the test fails.

import { expect, test, vi } from "vitest";
import { callHttpbin } from "./httpbin.service.js";

// a fake fetch, so the tests never touch the internet
const fakeFetch = vi.fn();
vi.stubGlobal("fetch", fakeFetch);

test("httpbin answers 200 -> ok is true", async () => {
	fakeFetch.mockResolvedValue(new Response('{"hello":"world"}', { status: 200 }));

	const result = await callHttpbin();

	expect(result.ok).toBe(true);
	expect(result.statusCode).toBe(200);
	expect(result.error).toBe(null);
});

test("httpbin answers 500 -> ok is false", async () => {
	fakeFetch.mockResolvedValue(new Response("{}", { status: 500 }));

	const result = await callHttpbin();

	expect(result.ok).toBe(false);
	expect(result.error).toBe("httpbin returned 500");
});

test("no internet or timeout -> ok is false, and it doesn't crash", async () => {
	fakeFetch.mockRejectedValue(new Error("fetch failed"));

	const result = await callHttpbin();

	expect(result.ok).toBe(false);
	expect(result.statusCode).toBe(null);
	expect(result.error).toBe("fetch failed");
});
