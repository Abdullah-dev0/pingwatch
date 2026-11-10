import { describe, expect, it, vi } from "vitest";
import { addClient, broadcast } from "./sse.service.js";

describe("sse.service", () => {
	it("sends the message to every connected tab", () => {
		const tabA = vi.fn();
		const tabB = vi.fn();
		addClient(tabA);
		addClient(tabB);

		broadcast({ id: 1 });

		expect(tabA).toHaveBeenCalledWith('data: {"id":1}\n\n');
		expect(tabB).toHaveBeenCalledWith('data: {"id":1}\n\n');
	});

	it("stops sending to a tab after it's removed", () => {
		const tab = vi.fn();
		const remove = addClient(tab);

		remove();
		broadcast({ id: 2 });

		expect(tab).not.toHaveBeenCalled();
	});
});
