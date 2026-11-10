import type { Request, Response } from "express";
import { listIncidents } from "../repositories/incident.repository.js";

// GET /api/incidents (latest 50, newest first)
export async function getIncidents(_req: Request, res: Response) {
	res.json(await listIncidents(50));
}
