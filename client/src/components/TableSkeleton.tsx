import { PAGE_SIZE } from "../lib/constants";
import { PingsTableHead } from "./PingsTableHead";
import { card } from "./ui/styles";

const bar = "h-3 rounded bg-zinc-200 dark:bg-zinc-800";

// grey placeholder rows shown on first load: same table, header and row count as the real one,
// so nothing jumps when the data arrives
export function TableSkeleton() {
	return (
		<div className={`${card} overflow-hidden`} aria-busy="true" aria-label="Loading pings">
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<PingsTableHead />
					<tbody className="animate-pulse divide-y divide-zinc-100 dark:divide-zinc-800">
						{Array.from({ length: PAGE_SIZE }, (_, i) => (
							<tr key={i}>
								{/* each cell is one text line tall (h-5), like the real rows */}
								<td className="px-4 py-3">
									<div className="flex h-5 items-center">
										<div className={`${bar} w-40`} />
									</div>
								</td>
								<td className="px-4 py-3">
									{/* same badge as the real row with hidden text, so the row is exactly as tall */}
									<span className="inline-flex rounded-md bg-zinc-200 px-2 py-0.5 text-xs text-transparent dark:bg-zinc-800">
										200
									</span>
								</td>
								<td className="px-4 py-3">
									<div className="flex h-5 items-center justify-end">
										<div className={`${bar} w-14`} />
									</div>
								</td>
								<td className="px-4 py-3">
									<div className="flex h-5 items-center">
										<div className="h-3 w-80 rounded bg-zinc-100 dark:bg-zinc-800/60" />
									</div>
								</td>
								<td className="px-4 py-3" />
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
