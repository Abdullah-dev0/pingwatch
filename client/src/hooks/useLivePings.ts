import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { API_URL } from "../lib/api";
import type { Ping, PingsPage } from "../types/ping";

export type ConnectionStatus = "connecting" | "live" | "offline";

// listens for new pings over SSE and puts them at the top of page 1
export function useLivePings(): ConnectionStatus {
	const queryClient = useQueryClient();
	const [status, setStatus] = useState<ConnectionStatus>("connecting");

	useEffect(() => {
		const source = new EventSource(`${API_URL}/api/pings/stream`);
		let connectedBefore = false;

		source.onopen = () => {
			setStatus("live");
			// after a reconnect, refetch in case we missed something
			if (connectedBefore) queryClient.invalidateQueries({ queryKey: ["pings"] });
			connectedBefore = true;
		};

		// EventSource reconnects by itself
		source.onerror = () => setStatus("offline");

		source.onmessage = (event) => {
			const ping: Ping = JSON.parse(event.data);

			queryClient.setQueryData<PingsPage>(["pings", 1], (old) => {
				if (!old || old.items.some((p) => p.id === ping.id)) return old;
				const total = old.total + 1;
				return {
					...old,
					items: [ping, ...old.items].slice(0, old.pageSize),
					total,
					totalPages: Math.ceil(total / old.pageSize),
				};
			});

			// other pages are now off by one; refetch them next time they're opened
			queryClient.invalidateQueries({
				queryKey: ["pings"],
				predicate: (query) => query.queryKey[1] !== 1,
				refetchType: "none",
			});
		};

		return () => source.close();
	}, [queryClient]);

	return status;
}
