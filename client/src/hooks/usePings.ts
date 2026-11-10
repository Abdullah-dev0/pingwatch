import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api";
import { PAGE_SIZE } from "../lib/constants";
import type { PingsPage } from "../types/ping";

export function usePings(page: number) {
	return useQuery({
		queryKey: ["pings", page],
		queryFn: () => apiGet<PingsPage>(`/api/pings?page=${page}&pageSize=${PAGE_SIZE}`),
		// keep showing the current page while the next one loads, so the table doesn't flash
		placeholderData: keepPreviousData,
	});
}
