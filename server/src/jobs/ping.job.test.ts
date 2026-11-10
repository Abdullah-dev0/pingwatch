import { describe, expect, it } from "vitest";
import { msUntilFirstPing } from "./ping.job.js";

const FIVE_MIN = 5 * 60 * 1000;
const now = Date.parse("2026-11-10T17:00:00Z");

describe("msUntilFirstPing", () => {
	it("pings right away when there are no pings yet", () => {
		expect(msUntilFirstPing(null, now, FIVE_MIN)).toBe(0);
	});

	it("waits for the next slot when the last ping was recent", () => {
		const lastAt = new Date(now - 60_000); // 1 min ago
		expect(msUntilFirstPing(lastAt, now, FIVE_MIN)).toBe(4 * 60_000);
	});

	it("pings right away when the last ping is older than one interval", () => {
		const lastAt = new Date(now - 10 * 60_000);
		expect(msUntilFirstPing(lastAt, now, FIVE_MIN)).toBe(0);
	});
});
