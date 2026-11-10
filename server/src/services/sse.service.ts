import type { Response } from "express";

// every open browser tab, as its open connection
const clients = new Set<Response>();

export function addClient(res: Response) {
	clients.add(res);
}

export function removeClient(res: Response) {
	clients.delete(res);
}

// send the data to every open tab
export function broadcast(data: unknown) {
	for (const res of clients) {
		res.write(`data: ${JSON.stringify(data)}\n\n`);
	}
}
