import type { Request, Response } from "express";

// GET /api/health
export function getHealth(_req: Request, res: Response) {
	res.json({
		status: "ok",
		uptimeSeconds: Math.round(process.uptime()),
		timestamp: new Date().toISOString(),
	});
}
