import { expect, test, vi } from "vitest";
import { classify } from "./incident.service.js";

// classify is pure, but its file imports the database and Gemini; fake them so nothing connects
vi.mock("../db/pool.js", () => ({ pool: {} }));
vi.mock("../lib/gemini.js", () => ({ aiEnabled: false }));

test("normal response time is not an incident", () => {
	expect(classify(1000, 600, 100)).toBeNull(); // 1.7x
	expect(classify(1200, 600, 100)).toBeNull(); // exactly 2x is not "more than 2x"
});

test("severity grows with how far above the average it is", () => {
	expect(classify(1300, 600, 100)).toBe("low"); // 2.2x
	expect(classify(2000, 600, 100)).toBe("medium"); // 3.3x
	expect(classify(3000, 600, 100)).toBe("high"); // 5x
});

test("no incident while there is too little history to trust the average", () => {
	expect(classify(5000, 600, 4)).toBeNull();
	expect(classify(5000, null, 0)).toBeNull();
});
