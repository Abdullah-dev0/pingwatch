import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PingsTable } from "./PingsTable";

// fake fetch, so the component gets our test data instead of calling the API
const fakeFetch = vi.fn();
vi.stubGlobal("fetch", fakeFetch);

beforeEach(() => {
	fakeFetch.mockReset();
});

const ping = {
	id: 1,
	createdAt: "2026-11-10T12:00:00.000Z",
	ok: true,
	statusCode: 200,
	responseTimeMs: 120,
	requestPayload: {},
	responseBody: {},
	error: null,
};

// make the fake API return this body
function apiReturns(body: object, status = 200) {
	fakeFetch.mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

function renderTable() {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	render(
		<QueryClientProvider client={queryClient}>
			<PingsTable />
		</QueryClientProvider>,
	);
}

describe("PingsTable", () => {
	it("shows the pings from the API", async () => {
		apiReturns({ items: [ping], page: 1, pageSize: 10, total: 1, totalPages: 1 });

		renderTable();

		expect(await screen.findByText("120 ms")).toBeInTheDocument();
		expect(screen.getByText("200")).toBeInTheDocument();
	});

	it("shows a message when there are no pings", async () => {
		apiReturns({ items: [], page: 1, pageSize: 10, total: 0, totalPages: 1 });

		renderTable();

		expect(await screen.findByText(/No pings yet/)).toBeInTheDocument();
	});

	it("shows the error when the API fails", async () => {
		apiReturns({ error: { message: "Database is down" } }, 500);

		renderTable();

		expect(await screen.findByText(/Database is down/)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
	});

	it("goes to page 2 when Next is clicked", async () => {
		apiReturns({ items: [ping], page: 1, pageSize: 10, total: 25, totalPages: 3 });
		renderTable();
		expect(await screen.findByText(/Page 1 of 3/)).toBeInTheDocument();

		apiReturns({ items: [ping], page: 2, pageSize: 10, total: 25, totalPages: 3 });
		await userEvent.click(screen.getByRole("button", { name: "Next" }));

		expect(await screen.findByText(/Page 2 of 3/)).toBeInTheDocument();
	});
});
