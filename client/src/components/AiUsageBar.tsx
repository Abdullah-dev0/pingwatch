import { useAiUsage } from "../hooks/useAi";

// "AI calls this hour 3 / 20 · 4,210 tokens today · $0.0021 today"
export function AiUsageBar() {
	const { data } = useAiUsage();
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
