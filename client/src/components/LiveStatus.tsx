import type { ConnectionStatus } from "../hooks/useLivePings";

const styles: Record<ConnectionStatus, { color: string; label: string }> = {
	connecting: { color: "bg-zinc-400", label: "Connecting to server" },
	live: { color: "bg-emerald-500", label: "Connected, receiving live updates" },
	offline: { color: "bg-red-500", label: "Server unreachable, retrying" },
};

export function LiveStatus({ status }: { status: ConnectionStatus }) {
	const { color, label } = styles[status];
	return (
		<span className="relative mt-1.5 flex size-2.5" title={label} aria-label={label} role="status">
			{status === "live" && (
				<span className={`absolute inline-flex size-full animate-ping rounded-full opacity-60 ${color}`} />
			)}
			<span className={`relative inline-flex size-2.5 rounded-full ${color}`} />
		</span>
	);
}
