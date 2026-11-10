import type { Response } from "express";

// every open browser tab, as its open connection
const clients = new Set<Response>();

export function addClient(res: Response) {
	clients.add(res);
}

export function removeClient(res: Response) {
	clients.delete(res);
}

// send the data to every open tab.
// No event name = a new ping (the browser's onmessage); named events (e.g. "incident") need addEventListener.
export function broadcast(data: unknown, event?: string) {
	const message = `${event ? `event: ${event}\n` : ""}data: ${JSON.stringify(data)}\n\n`;
	for (const res of clients) {
		res.write(message);
	}
}
