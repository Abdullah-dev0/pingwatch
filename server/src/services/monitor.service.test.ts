import { expect, test, vi } from "vitest";
import { countPings, listPings, savePing } from "../repositories/ping.repository.js";
import { callHttpbin } from "./httpbin.service.js";
import { getHistory, runCheck } from "./monitor.service.js";
import { broadcast } from "./sse.service.js";

// vi.mock swaps these files for fakes: no real httpbin, no real database.
// We then tell each fake what to return with mockResolvedValue (or mockRejectedValue to make it fail).
vi.mock("./httpbin.service.js");
vi.mock("./sse.service.js");
vi.mock("../repositories/ping.repository.js");

const ping = {
	ok: true,
	statusCode: 200,
	responseTimeMs: 120,
	requestPayload: {},
	responseBody: {},
	error: null,
};

test("runCheck saves the ping and sends it to the browser", async () => {
	const saved = { ...ping, id: 1, createdAt: "2026-11-10T12:00:00.000Z" };
	vi.mocked(callHttpbin).mockResolvedValue(ping);
	vi.mocked(savePing).mockResolvedValue(saved);

	await runCheck();

	expect(savePing).toHaveBeenCalledWith(ping);
	expect(broadcast).toHaveBeenCalledWith(saved);
});

test("runCheck saves failed pings too", async () => {
	const failed = { ...ping, ok: false, statusCode: null, error: "timeout" };
	vi.mocked(callHttpbin).mockResolvedValue(failed);
	vi.mocked(savePing).mockResolvedValue({ ...failed, id: 2, createdAt: "" });

	await runCheck();

	expect(savePing).toHaveBeenCalledWith(failed);
});

test("runCheck doesn't crash when the database is down", async () => {
	vi.mocked(broadcast).mockClear(); // forget calls from the test above
	vi.mocked(callHttpbin).mockResolvedValue(ping);
	vi.mocked(savePing).mockRejectedValue(new Error("connection refused"));

	await runCheck(); // if the error wasn't caught, the test would fail right here

	expect(broadcast).not.toHaveBeenCalled();
});

test("getHistory: page 3 skips the first 20 pings", async () => {
	vi.mocked(listPings).mockResolvedValue([]);
	vi.mocked(countPings).mockResolvedValue(25);

	const result = await getHistory(3, 10);

	expect(listPings).toHaveBeenCalledWith(10, 20);
	expect(result.totalPages).toBe(3); // 25 pings, 10 per page
});

test("getHistory: no pings yet still means 1 page", async () => {
	vi.mocked(listPings).mockResolvedValue([]);
	vi.mocked(countPings).mockResolvedValue(0);

	const result = await getHistory(1, 10);

	expect(result.totalPages).toBe(1);
});
