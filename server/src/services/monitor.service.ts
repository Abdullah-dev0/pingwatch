import { logger } from "../lib/logger.js";
import { countPings, listPings, type SavedPing, savePing } from "../repositories/ping.repository.js";
import { callHttpbin } from "./httpbin.service.js";
import { checkForIncident } from "./incident.service.js";
import { broadcast } from "./sse.service.js";

export async function runCheck(): Promise<void> {
	const result = await callHttpbin();
	const { ok, statusCode, responseTimeMs, error } = result;

	if (ok) {
		logger.info({ statusCode, responseTimeMs }, "Ping succeeded");
	} else {
		logger.warn({ statusCode, responseTimeMs, error }, "Ping failed");
	}

	// if the db is down just log it, the next run will try again
	let saved: SavedPing;
	try {
		saved = await savePing(result);
		logger.info({ id: saved.id }, "Ping saved");
		broadcast(saved);
	} catch (err) {
		logger.error({ err }, "Could not save ping");
		return;
	}

	try {
		const incident = await checkForIncident(saved);
		if (incident) broadcast(incident, "incident");
	} catch (err) {
		logger.error({ err }, "Incident check failed");
	}
}

export interface PingsPage {
	items: SavedPing[];
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
}

export async function getHistory(page: number, pageSize: number): Promise<PingsPage> {
	const offset = (page - 1) * pageSize;
	const [items, total] = await Promise.all([listPings(pageSize, offset), countPings()]);

	return {
		items,
		page,
		pageSize,
		total,
		totalPages: Math.max(1, Math.ceil(total / pageSize)),
	};
}
