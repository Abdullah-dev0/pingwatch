import type { Request, Response } from "express";
import { z } from "zod";
import { getHistory } from "../services/monitor.service.js";
import { addClient } from "../services/sse.service.js";

const listQuery = z.object({
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

// GET /api/pings?page=1&pageSize=10
export async function listPings(req: Request, res: Response) {
	const query = listQuery.safeParse(req.query);

	if (!query.success) {
		res.status(400).json({ error: { message: "page must be 1 or more and pageSize 1-100" } });
		return;
	}

	const result = await getHistory(query.data.page, query.data.pageSize);
	res.json(result);
}

// GET /api/pings/stream (SSE)
export function streamPings(req: Request, res: Response) {
	res.set({
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache",
		Connection: "keep-alive",
		"X-Accel-Buffering": "no", // otherwise nginx buffers the stream
	});
	res.flushHeaders();

	const removeClient = addClient((message) => res.write(message));
	req.on("close", removeClient);
}
