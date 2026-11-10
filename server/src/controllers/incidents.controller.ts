import type { Request, Response } from "express";
import { INCIDENTS_LIST_LIMIT } from "../config/constants.js";
import { listIncidents } from "../repositories/incident.repository.js";

// GET /api/incidents (latest ones, newest first)
export async function getIncidents(_req: Request, res: Response) {
	res.json(await listIncidents(INCIDENTS_LIST_LIMIT));
}
