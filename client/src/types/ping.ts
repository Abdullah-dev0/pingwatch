// same shapes the API returns (SavedPing and PingsPage on the server)

export interface Ping {
	id: number;
	createdAt: string;
	ok: boolean;
	statusCode: number | null;
	responseTimeMs: number;
	requestPayload: Record<string, unknown>;
	responseBody: unknown;
	error: string | null;
}

export interface PingsPage {
	items: Ping[];
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
}
