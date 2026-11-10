import { usePings } from "../hooks/usePings";
import { formatTime } from "../lib/format";
import { card } from "./ui/styles";

// summary of the latest page of pings
export function PingStats() {
	const { data } = usePings(1);
	const pings = data?.items ?? [];
	if (pings.length === 0) return null;

	const okPings = pings.filter((p) => p.ok);
	const successRate = Math.round((okPings.length / pings.length) * 100);
	const avgMs = okPings.length
		? Math.round(okPings.reduce((sum, p) => sum + p.responseTimeMs, 0) / okPings.length)
		: null;

	return (
		<div className="mb-6 grid grid-cols-3 gap-3">
			<Stat label="Success rate" value={`${successRate}%`} />
			<Stat label="Avg response" value={avgMs === null ? "—" : `${avgMs} ms`} />
			<Stat label="Last check" value={formatTime(pings[0]!.createdAt)} />
		</div>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className={`${card} px-4 py-3`}>
			<p className="text-xs text-zinc-500">{label}</p>
			<p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
		</div>
	);
}
