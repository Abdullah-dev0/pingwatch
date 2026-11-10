import { useEffect, useState } from "react";
import { usePings } from "../hooks/usePings";
import { useSearchParam } from "../hooks/useSearchParam";
import { Pagination } from "./Pagination";
import { PingRow } from "./PingRow";
import { TableSkeleton } from "./TableSkeleton";
import { Message } from "./ui/Message";
import { button, card } from "./ui/styles";

export function PingsTable() {
	// page lives in the URL (?page=3) so it can be shared; anything that isn't a whole number >= 1 means page 1
	const [pageParam, setPageParam] = useSearchParam("page");
	const page = Math.max(1, Number.parseInt(pageParam ?? "", 10) || 1);
	const [openId, setOpenId] = useState<number | null>(null);
	const { data, isPending, isError, error, refetch, isPlaceholderData } = usePings(page);

	// a shared link to page 9 when there are only 3 pages: go to the last page instead of an empty table
	const totalPages = data?.totalPages;
	useEffect(() => {
		if (totalPages && page > totalPages) setPageParam(String(totalPages), { replace: true });
	}, [page, totalPages, setPageParam]);

	if (isPending) {
		return <TableSkeleton />;
	}

	// only take over the whole table if we have nothing to show
	if (!data) {
		return (
			<Message>
				<span className="text-red-600 dark:text-red-400">Could not load pings: {error.message}</span>
				<button type="button" onClick={() => refetch()} className={`${button} ml-3`}>
					Retry
				</button>
			</Message>
		);
	}

	if (data.total === 0) {
		return <Message>No pings yet. The first one runs when the server starts.</Message>;
	}

	function goTo(newPage: number) {
		setPageParam(newPage === 1 ? null : String(newPage));
		setOpenId(null);
	}

	return (
		<>
			{/* fade the old page slightly while the new one loads */}
			<div className={`${card} overflow-hidden transition-opacity ${isPlaceholderData ? "opacity-60" : ""}`}>
				{/* scrolls sideways on small screens */}
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="border-b border-zinc-200 bg-zinc-50 text-xs whitespace-nowrap text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
							<tr>
								<th className="px-4 py-3 text-left font-medium">Time</th>
								<th className="px-4 py-3 text-left font-medium">Status</th>
								<th className="px-4 py-3 text-right font-medium">Response time</th>
								<th className="px-4 py-3 text-left font-medium">Payload</th>
								<th className="w-10 px-4 py-3" />
							</tr>
						</thead>
						<tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
							{data.items.map((ping) => (
								<PingRow
									key={ping.id}
									ping={ping}
									open={openId === ping.id}
									onToggle={() => setOpenId(openId === ping.id ? null : ping.id)}
								/>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{isError && (
				<p className="mt-3 text-sm text-red-600 dark:text-red-400">Could not load page: {error.message}</p>
			)}

			<Pagination
				page={data.page}
				totalPages={data.totalPages}
				total={data.total}
				loading={isPlaceholderData}
				onPageChange={goTo}
			/>
		</>
	);
}
