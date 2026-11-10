// same shapes the API returns (Incident and getUsage on the server)

export interface Incident {
	id: number;
	createdAt: string;
	pingId: number;
	endpoint: string;
	severity: "low" | "medium" | "high";
	responseTimeMs: number;
	averageMs: number;
	summary: string;
	rootCauses: string[];
	recommendations: string[];
	generatedBy: "llm" | "template";
}

export interface AiUsage {
	enabled: boolean;
	model: string;
	callsLastHour: number;
	limit: number;
	tokensToday: number;
	costTodayUsd: number;
	costTotalUsd: number;
}
