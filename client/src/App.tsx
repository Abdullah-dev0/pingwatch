import { LiveStatus } from "./components/LiveStatus";
import { PingStats } from "./components/PingStats";
import { PingsTable } from "./components/PingsTable";
import { useLivePings } from "./hooks/useLivePings";

export default function App() {
	const connectionStatus = useLivePings();

	return (
		<div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
			<header className="mb-8 flex items-start justify-between gap-4">
				<div>
					<h1 className="text-xl font-semibold tracking-tight">HTTP Monitor</h1>
					<p className="mt-1 text-sm text-zinc-500">
						Pinging <span className="font-mono text-zinc-700 dark:text-zinc-300">httpbin.org/anything</span>{" "}
						every 5 minutes
					</p>
				</div>
				<LiveStatus status={connectionStatus} />
			</header>

			<PingStats />
			<PingsTable />
		</div>
	);
}
