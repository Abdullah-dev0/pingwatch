// one entry per open browser tab; each is just "a way to send a message"
type Send = (message: string) => void;

const clients = new Set<Send>();

// returns a function that removes the client again
export function addClient(send: Send): () => void {
	clients.add(send);
	return () => {
		clients.delete(send);
	};
}

export function broadcast(data: unknown) {
	const message = `data: ${JSON.stringify(data)}\n\n`;
	for (const send of clients) {
		send(message);
	}
}
