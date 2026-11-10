import { formatDateTime } from "../lib/format";
import type { Ping } from "../types/ping";

interface Props {
	ping: Ping;
	open: boolean;
	onToggle: () => void;
}

// one table row; click it to show the request and response underneath
export function PingRow({ ping, open, onToggle }: Props) {
	return (
		<>
			<tr onClick={onToggle} className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
				<td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
					{formatDateTime(ping.createdAt)}
				</td>
				<td className="px-4 py-3">
					<StatusBadge ping={ping} />
				</td>
				<td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">{ping.responseTimeMs} ms</td>
				<td className="px-4 py-3">
					<code className="block max-w-xs truncate font-mono text-xs text-zinc-500">
						{JSON.stringify(ping.requestPayload)}
					</code>
				</td>
				<td className="px-4 py-3 text-right">
					<button
						type="button"
						aria-expanded={open}
						aria-label={open ? "Hide details" : "Show details"}
						className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
					>
						<span className={`inline-block transition-transform ${open ? "rotate-90" : ""}`}>›</span>
					</button>
				</td>
			</tr>

			{open && (
				<tr className="bg-zinc-50/60 dark:bg-zinc-950/40">
					<td colSpan={5} className="px-4 py-4">
						<div className="grid gap-4 md:grid-cols-2">
							<JsonBlock title="Request payload" value={ping.requestPayload} />
							{ping.error ? (
								<div>
									<p className="mb-2 text-xs font-medium text-zinc-500">Error</p>
									<p className="text-sm text-red-600 dark:text-red-400">{ping.error}</p>
								</div>
							) : (
								<JsonBlock title="Response" value={ping.responseBody} />
							)}
						</div>
					</td>
				</tr>
			)}
		</>
	);
}

function StatusBadge({ ping }: { ping: Ping }) {
	const style = ping.ok
		? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400"
		: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400";

	return (
		<span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium tabular-nums ring-1 ring-inset ${style}`}>
			{ping.statusCode ?? "Failed"}
		</span>
	);
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
	return (
		<div className="min-w-0">
			<p className="mb-2 text-xs font-medium text-zinc-500">{title}</p>
			<pre className="max-h-72 overflow-auto rounded-lg bg-white p-3 font-mono text-xs ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
				{JSON.stringify(value, null, 2)}
			</pre>
		</div>
	);
}
