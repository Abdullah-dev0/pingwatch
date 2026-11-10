import { card } from "./ui/styles";

// grey placeholder rows shown on first load
export function TableSkeleton() {
	return (
		<div className={`${card} divide-y divide-zinc-100 dark:divide-zinc-800`} aria-busy="true" aria-label="Loading pings">
			{Array.from({ length: 8 }, (_, i) => (
				<div key={i} className="flex animate-pulse items-center gap-6 px-4 py-4">
					<div className="h-3 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
					<div className="h-5 w-10 rounded bg-zinc-200 dark:bg-zinc-800" />
					<div className="h-3 w-14 rounded bg-zinc-200 dark:bg-zinc-800" />
					<div className="hidden h-3 flex-1 rounded bg-zinc-100 sm:block dark:bg-zinc-800/60" />
				</div>
			))}
		</div>
	);
}
