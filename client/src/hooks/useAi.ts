import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import { AI_USAGE_REFRESH_MS } from "../lib/constants";
import type { AiUsage, Incident } from "../types/ai";

// refreshed by useLivePings when the server sends an "incident" event
export function useIncidents() {
	return useQuery({ queryKey: ["incidents"], queryFn: () => apiGet<Incident[]>("/api/incidents") });
}

export function useAiUsage() {
	return useQuery({
		queryKey: ["ai-usage"],
		queryFn: () => apiGet<AiUsage>("/api/ai/usage"),
		// calls drop out of the 1-hour window over time, so poll gently
		refetchInterval: AI_USAGE_REFRESH_MS,
	});
}
