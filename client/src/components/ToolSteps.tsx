import { getToolName, isToolUIPart, type UIMessage } from "ai";
import { useState } from "react";
import { toolsRunning } from "../lib/chat";
import { formatRange } from "../lib/format";

// what the server's tools return (getStats / findPings in chat.service.ts)
interface StatsOutput {
	total: number;
	failures: number;
	avgMs: number | null;
}
interface PingsInput {
	from: string;
	to: string;
	onlyFailures: boolean;
	sortBy: "newest" | "slowest" | "fastest";
	limit: number;
}

type ToolPart = Extract<UIMessage["parts"][number], { toolCallId: string }>;

// "Looking up data…" while tools run, then a collapsible list of steps, like ChatGPT's activity panel
export function ToolSteps({ message }: { message: UIMessage }) {
	const [open, setOpen] = useState(false);
	const steps = message.parts.filter(isToolUIPart) as ToolPart[];
	if (steps.length === 0) return null;

	const running = toolsRunning(message);

	return (
		<div className="mb-2">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				aria-expanded={open}
				className="group flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
			>
				{running ? <SmallSpinner /> : <SearchIcon />}
				<span className={running ? "animate-pulse" : ""}>
					{running ? "Looking up data…" : `Looked up data · ${steps.length} ${steps.length === 1 ? "step" : "steps"}`}
				</span>
				<ChevronIcon open={open} />
			</button>

			{open && (
				<ol className="mt-2 ml-1.5 space-y-2 border-l border-zinc-200 pl-4 dark:border-zinc-700">
					{steps.map((step) => (
						<li key={step.toolCallId} className="relative text-xs">
							<StatusDot state={step.state} />
							<p className="text-zinc-700 dark:text-zinc-300">{describe(step)}</p>
							<p className="text-zinc-500">{result(step)}</p>
						</li>
					))}
				</ol>
			)}
		</div>
	);
}

// what the step looked for, in words: "5 slowest pings · 2:19 PM – 8:19 PM"
function describe(step: ToolPart): string {
	const input = step.input as Partial<PingsInput> | undefined;
	const range = input?.from && input.to ? ` · ${formatRange(input.from, input.to)}` : "";

	switch (getToolName(step)) {
		case "getStats":
			return `Stats${range}`;

		default: {
			// findPings: the input streams in, so it may not have arrived yet
			if (!input?.sortBy) return "Searching pings";
			const one = input.limit === 1;
			const what = `${input.onlyFailures ? "failed " : ""}${one ? "ping" : "pings"}`;
			const order = input.sortBy === "newest" ? "latest" : input.sortBy;
			// "slowest ping" / "5 slowest pings"
			return `${one ? "" : (input.limit ?? "")} ${order} ${what}${range}`.trim();
		}
	}
}

// what came back: "21 pings, 0 failed, avg 720 ms" / "5 found"
function result(step: ToolPart): string {
	switch (step.state) {
		case "output-error":
			return "Lookup failed";

		case "output-available": {
			if (getToolName(step) === "getStats") {
				const s = step.output as StatsOutput;
				return `${s.total} pings, ${s.failures} failed${s.avgMs === null ? "" : `, avg ${s.avgMs} ms`}`;
			}
			const rows = step.output as unknown[];
			return rows.length === 0 ? "None found" : `${rows.length} found`;
		}

		default:
			// still streaming the input or waiting for the server
			return "Running…";
	}
}

function StatusDot({ state }: { state: ToolPart["state"] }) {
	// green = done, red = failed, grey pulsing = still running
	let color: string;
	switch (state) {
		case "output-available":
			color = "bg-emerald-500";
			break;
		case "output-error":
			color = "bg-red-500";
			break;
		default:
			color = "bg-zinc-400 animate-pulse";
	}
	// sits on the timeline line to the left
	return <span className={`absolute top-1 left-[-1.3rem] size-2 rounded-full ring-2 ring-white dark:ring-zinc-900 ${color}`} />;
}

function SmallSpinner() {
	return <span className="size-3 animate-spin rounded-full border-[1.5px] border-zinc-300 border-t-zinc-600 dark:border-zinc-600 dark:border-t-zinc-200" />;
}

function SearchIcon() {
	return (
		<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
			<circle cx="11" cy="11" r="7" />
			<path d="M20 20l-3.5-3.5" />
		</svg>
	);
}

function ChevronIcon({ open }: { open: boolean }) {
	return (
		<svg
			width="12"
			height="12"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			className={`transition-transform ${open ? "rotate-90" : ""}`}
		>
			<path d="M9 6l6 6-6 6" />
		</svg>
	);
}
