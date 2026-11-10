import { AiUsageBar } from "./components/AiUsageBar";
import { ChatWidget } from "./components/ChatWidget";
import { IncidentsList } from "./components/IncidentsList";
import { LiveStatus } from "./components/LiveStatus";
import { PingStats } from "./components/PingStats";
import { PingsTable } from "./components/PingsTable";
import { useLivePings } from "./hooks/useLivePings";
import { useSearchParam } from "./hooks/useSearchParam";

const TABS = ["Pings", "Incidents"] as const;
type Tab = (typeof TABS)[number];

export default function App() {
	const connectionStatus = useLivePings();
	// tab lives in the URL (?tab=incidents) so it can be shared; anything unknown means Pings
	const [tabParam, setTabParam] = useSearchParam("tab");
	const tab: Tab = tabParam === "incidents" ? "Incidents" : "Pings";
	const setTab = (name: Tab) => setTabParam(name === "Pings" ? null : name.toLowerCase());

	return (
		// pb-24: room at the bottom so the floating chat button never covers the pagination
		<div className="mx-auto max-w-5xl px-4 pt-10 pb-24 sm:px-6">
			<header className="mb-8 flex items-start justify-between gap-4">
				<div>
					<h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
						<img src="/favicon.svg" alt="" className="h-7 w-7" />
						HTTP Monitor
					</h1>
					<p className="mt-1 text-sm text-zinc-500">
						Pinging <span className="font-mono text-zinc-700 dark:text-zinc-300">httpbin.org/anything</span>{" "}
						every 5 minutes
					</p>
				</div>
				<LiveStatus status={connectionStatus} />
			</header>

			<PingStats />
			<AiUsageBar />

			<nav className="mb-4 flex gap-1 border-b border-zinc-200 dark:border-zinc-800" aria-label="Sections">
				{TABS.map((name) => (
					<button
						key={name}
						type="button"
						onClick={() => setTab(name)}
						aria-current={tab === name ? "page" : undefined}
						className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
							tab === name
								? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
								: "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
						}`}
					>
						{name}
					</button>
				))}
			</nav>

			{tab === "Pings" ? <PingsTable /> : <IncidentsList />}
			<ChatWidget />
		</div>
	);
}
