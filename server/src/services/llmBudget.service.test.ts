import { expect, test, vi } from "vitest";
import { HOURLY_LLM_CALL_LIMIT } from "../config/constants.js";
import { callsLeft, takeSlot } from "./llmBudget.service.js";

// the counter is plain memory, but its file imports the config, Gemini and the database; fake them
vi.mock("../config/env.js", () => ({ env: {} }));
vi.mock("../lib/gemini.js", () => ({}));
vi.mock("../db/pool.js", () => ({ pool: {} }));

test("the hourly limit hands out 20 slots, then none until an hour has passed", () => {
	vi.useFakeTimers();

	// all asked for at the same moment, like requests arriving together
	const taken = Array.from({ length: HOURLY_LLM_CALL_LIMIT + 5 }, () => takeSlot());

	expect(taken.filter(Boolean)).toHaveLength(HOURLY_LLM_CALL_LIMIT);
	expect(callsLeft()).toBe(0);

	vi.advanceTimersByTime(3600_000);
	expect(takeSlot()).toBe(true);

	vi.useRealTimers();
});
