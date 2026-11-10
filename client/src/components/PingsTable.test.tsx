import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PingsTable } from "./PingsTable";

const ping = {
	id: 1,
	createdAt: "2026-11-10T12:00:00Z",
	ok: false,
	statusCode: null,
	responseTimeMs: 420,
	requestPayload: { id: "a" },
	responseBody: null,
	error: "Timed out",
};

// fake the API: each fetch call gets the next response in the list
function mockApi(...responses: { status: number; body: unknown }[]) {
	const fetchMock = vi.fn();
	for (const r of responses) {
		fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(r.body), { status: r.status }));
	}
	vi.stubGlobal("fetch", fetchMock);
}

function renderTable() {
	const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	render(
		<QueryClientProvider client={client}>
			<PingsTable />
		</QueryClientProvider>,
	);
}

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

it("shows the empty state when there are no pings", async () => {
	mockApi({ status: 200, body: { items: [], page: 1, pageSize: 10, total: 0, totalPages: 1 } });
	renderTable();
	expect(await screen.findByText(/No pings yet/)).toBeTruthy();
});

it("shows a ping row, and its error when the row is opened", async () => {
	mockApi({ status: 200, body: { items: [ping], page: 1, pageSize: 10, total: 1, totalPages: 1 } });
	renderTable();
	fireEvent.click(await screen.findByText("Failed")); // failed ping has no status code
	expect(screen.getByText("Timed out")).toBeTruthy();
});

it("shows the API error and recovers on Retry", async () => {
	mockApi(
		{ status: 500, body: { error: { message: "Database unavailable" } } },
		{ status: 200, body: { items: [ping], page: 1, pageSize: 10, total: 1, totalPages: 1 } },
	);
	renderTable();
	fireEvent.click(await screen.findByRole("button", { name: "Retry" }));
	expect(await screen.findByText("420 ms")).toBeTruthy();
});
