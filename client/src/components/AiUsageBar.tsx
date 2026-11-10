import { useAiUsage } from "../hooks/useAi";

// "AI calls this hour 3 / 20 · 4,210 tokens today · $0.0021 today"
export function AiUsageBar() {
	const { data, isPending } = useAiUsage();
	// keep the line's space while loading so the content below doesn't shift
	if (isPending) {
		return (
			<div className="mb-4 flex h-4 items-center" aria-hidden="true">
				<div className="h-3 w-72 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
			</div>
		);
	}
	if (!data?.enabled) return null;

	return (
		<p className="mb-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500" title={`Model: ${data.model}`}>
			<span>
				AI calls this hour{" "}
				<span className="font-medium text-zinc-700 tabular-nums dark:text-zinc-300">
					{data.callsLastHour} / {data.limit}
				</span>
			</span>
			<span>·</span>
			<span className="tabular-nums">{data.tokensToday.toLocaleString()} tokens in 24h</span>
			<span>·</span>
			<span className="tabular-nums">
				est. ${data.costTodayUsd.toFixed(4)} in 24h (${data.costTotalUsd.toFixed(4)} total)
			</span>
		</p>
	);
}
