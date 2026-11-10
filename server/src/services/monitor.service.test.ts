import { beforeEach, describe, expect, it, vi } from "vitest";
import { countPings, listPings, savePing } from "../repositories/ping.repository.js";
import { callHttpbin } from "./httpbin.service.js";
import { getHistory, runCheck } from "./monitor.service.js";
import { broadcast } from "./sse.service.js";

// replace these modules with fakes, so we test only monitor.service
// (no real httpbin call, no real database, no real browsers)
vi.mock("./httpbin.service.js");
vi.mock("./sse.service.js");
vi.mock("../repositories/ping.repository.js");

const goodPing = {
	ok: true,
	statusCode: 200,
	responseTimeMs: 120,
	requestPayload: { id: "abc" },
	responseBody: {},
	error: null,
};

const failedPing = {
	ok: false,
	statusCode: null,
	responseTimeMs: 10000,
	requestPayload: { id: "def" },
	responseBody: null,
	error: "timeout",
};

const savedRow = { ...goodPing, id: 1, createdAt: "2026-11-10T12:00:00.000Z" };

beforeEach(() => {
	vi.resetAllMocks();
});

describe("runCheck", () => {
	it("saves the ping and sends it to the browsers", async () => {
		vi.mocked(callHttpbin).mockResolvedValue(goodPing);
		vi.mocked(savePing).mockResolvedValue(savedRow);

		await runCheck();

		expect(savePing).toHaveBeenCalledWith(goodPing);
		expect(broadcast).toHaveBeenCalledWith(savedRow);
	});

	it("saves failed pings too", async () => {
		vi.mocked(callHttpbin).mockResolvedValue(failedPing);
		vi.mocked(savePing).mockResolvedValue({ ...failedPing, id: 2, createdAt: "" });

		await runCheck();

		expect(savePing).toHaveBeenCalledWith(failedPing);
		expect(broadcast).toHaveBeenCalled();
	});

	it("doesn't crash or broadcast if the database is down", async () => {
		vi.mocked(callHttpbin).mockResolvedValue(goodPing);
		vi.mocked(savePing).mockRejectedValue(new Error("connection refused"));

		await runCheck(); // would throw here if the error wasn't caught

		expect(broadcast).not.toHaveBeenCalled();
	});
});

describe("getHistory", () => {
	it("works out the offset and the number of pages", async () => {
		vi.mocked(listPings).mockResolvedValue([]);
		vi.mocked(countPings).mockResolvedValue(25);

		const result = await getHistory(3, 10);

		expect(listPings).toHaveBeenCalledWith(10, 20); // page 3 skips the first 20
		expect(result.total).toBe(25);
		expect(result.totalPages).toBe(3);
	});

	it("says 1 page when there are no pings yet", async () => {
		vi.mocked(listPings).mockResolvedValue([]);
		vi.mocked(countPings).mockResolvedValue(0);

		const result = await getHistory(1, 10);

		expect(result.totalPages).toBe(1);
	});
});
