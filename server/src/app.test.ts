import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";
import { getHistory } from "./services/monitor.service.js";

// fake the service so these tests don't need a database
vi.mock("./services/monitor.service.js");

const app = createApp();
const emptyPage = { items: [], page: 1, pageSize: 10, total: 0, totalPages: 1 };

beforeEach(() => {
	vi.resetAllMocks();
});

describe("API", () => {
	it("GET /api/health returns 200", async () => {
		const res = await request(app).get("/api/health");

		expect(res.status).toBe(200);
	});

	it("GET /api/pings uses page 1 and 10 per page by default", async () => {
		vi.mocked(getHistory).mockResolvedValue(emptyPage);

		const res = await request(app).get("/api/pings");

		expect(res.status).toBe(200);
		expect(getHistory).toHaveBeenCalledWith(1, 10);
	});

	it("GET /api/pings reads page and pageSize from the URL", async () => {
		vi.mocked(getHistory).mockResolvedValue(emptyPage);

		await request(app).get("/api/pings?page=3&pageSize=25");

		expect(getHistory).toHaveBeenCalledWith(3, 25);
	});

	it("GET /api/pings returns 400 for a bad page", async () => {
		const res = await request(app).get("/api/pings?page=abc");

		expect(res.status).toBe(400);
	});

	it("GET /api/pings returns 400 for a pageSize over 100", async () => {
		const res = await request(app).get("/api/pings?pageSize=500");

		expect(res.status).toBe(400);
	});

	it("returns 500 without leaking the real error", async () => {
		vi.mocked(getHistory).mockRejectedValue(new Error("password authentication failed"));

		const res = await request(app).get("/api/pings");

		expect(res.status).toBe(500);
		expect(res.body.error.message).toBe("Something went wrong on our side");
	});

	it("returns 404 for unknown routes", async () => {
		const res = await request(app).get("/api/nope");

		expect(res.status).toBe(404);
	});
});
