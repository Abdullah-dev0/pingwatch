import { type ReactNode, useState } from "react";
import { useIncidents } from "../hooks/useAi";
import { formatDateTime, formatRelative } from "../lib/format";
import type { Incident } from "../types/ai";
import { Message } from "./ui/Message";
import { button, card } from "./ui/styles";

const severityDot: Record<Incident["severity"], string> = {
	low: "bg-amber-400",
	medium: "bg-orange-500",
	high: "bg-red-500",
};

export function IncidentsList() {
	const { data, isPending, error, refetch } = useIncidents();
	// newest report open by default; click a row to switch
	const [openId, setOpenId] = useState<number | null>(null);

	if (isPending) return <ListSkeleton />;

	if (!data) {
		return (
			<Message>
				<span className="text-red-600 dark:text-red-400">Could not load incidents: {error?.message}</span>
				<button type="button" onClick={() => refetch()} className={`${button} ml-3`}>
					Retry
				</button>
			</Message>
		);
	}

	if (data.length === 0) {
		return (
			<div className={`${card} flex flex-col items-center px-4 py-12 text-center`}>
				<span className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
					<CheckIcon />
				</span>
				<p className="mt-3 text-sm font-medium">All clear</p>
				<p className="mt-1 text-sm text-zinc-500">An incident opens when a response takes more than 2× the 24h median.</p>
			</div>
		);
	}

	const shownId = openId ?? data[0]!.id;

	return (
		<>
			<p className="mb-3 text-xs text-zinc-500">
				{data.length} {data.length === 1 ? "incident" : "incidents"} · latest {formatRelative(data[0]!.createdAt)}
			</p>
			<ul className={`${card} divide-y divide-zinc-100 overflow-hidden dark:divide-zinc-800`}>
				{data.map((incident) => (
					<IncidentRow
						key={incident.id}
						incident={incident}
						open={incident.id === shownId}
						onToggle={() => setOpenId(incident.id === shownId ? -1 : incident.id)}
					/>
				))}
			</ul>
		</>
	);
}

function IncidentRow({ incident, open, onToggle }: { incident: Incident; open: boolean; onToggle: () => void }) {
	const ratio = (incident.responseTimeMs / incident.averageMs).toFixed(1);

	return (
		<li>
			<button
				type="button"
				onClick={onToggle}
				aria-expanded={open}
				className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
			>
				<span className={`size-2 shrink-0 rounded-full ${severityDot[incident.severity]}`} title={`${incident.severity} severity`} />
				<span className="min-w-0 flex-1">
					<span className="text-sm font-medium tabular-nums">
						{incident.responseTimeMs.toLocaleString()} ms
						<span className="ml-2 font-normal text-zinc-500">
							{ratio}× slower<span className="hidden sm:inline"> than usual</span>
						</span>
					</span>
					{!open && <span className="block truncate text-xs text-zinc-500">{incident.summary}</span>}
				</span>
				<span className="shrink-0 text-xs text-zinc-500" title={formatDateTime(incident.createdAt)}>
					{formatRelative(incident.createdAt)}
				</span>
				<ChevronIcon open={open} />
			</button>

			{open && (
				<div className="space-y-4 px-4 pb-5 text-sm sm:pl-9">
					{/* the key numbers first, so nobody has to dig them out of the summary */}
					<dl className="grid grid-cols-3 gap-2">
						<Metric label="Response" value={`${incident.responseTimeMs.toLocaleString()} ms`} />
						<Metric label="24h median" value={`${incident.averageMs.toLocaleString()} ms`} />
						<Metric
							label="Severity"
							value={
								<span className="flex items-center gap-1.5 capitalize">
									<span className={`size-2 rounded-full ${severityDot[incident.severity]}`} />
									{incident.severity}
								</span>
							}
						/>
					</dl>

					<p className="max-w-prose leading-relaxed text-zinc-600 dark:text-zinc-400">{incident.summary}</p>

					<div className="grid gap-3 sm:grid-cols-2">
						<Section icon={<AlertIcon />} title="Likely causes" items={incident.rootCauses} />
						<Section icon={<BulbIcon />} title="What to do" items={incident.recommendations} numbered />
					</div>

					<div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
						<span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono dark:bg-zinc-800">POST {incident.endpoint}</span>
						<span>{formatDateTime(incident.createdAt)}</span>
						<span className="ml-auto flex items-center gap-1">
							{incident.generatedBy === "llm" ? (
								<>
									<SparkleIcon /> AI report
								</>
							) : (
								"Basic report · AI limit reached or unavailable"
							)}
						</span>
					</div>
				</div>
			)}
		</li>
	);
}

function Metric({ label, value }: { label: string; value: ReactNode }) {
	return (
		<div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50">
			<dt className="text-xs text-zinc-500">{label}</dt>
			<dd className="mt-0.5 font-medium tabular-nums">{value}</dd>
		</div>
	);
}

function Section({ icon, title, items, numbered }: { icon: ReactNode; title: string; items: string[]; numbered?: boolean }) {
	return (
		<div className="rounded-lg border border-zinc-100 p-3 dark:border-zinc-800">
			<p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
				{icon}
				{title}
			</p>
			<ul className="space-y-2">
				{items.map((item, i) => (
					<li key={item} className="flex gap-2 leading-snug text-zinc-700 dark:text-zinc-300">
						{numbered ? (
							<span className="w-3 shrink-0 text-xs leading-5 text-zinc-400 tabular-nums">{i + 1}</span>
						) : (
							<span className="mt-2 size-1 shrink-0 rounded-full bg-zinc-400" />
						)}
						{item}
					</li>
				))}
			</ul>
		</div>
	);
}

function AlertIcon() {
	return (
		<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
		</svg>
	);
}

function BulbIcon() {
	return (
		<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z" />
		</svg>
	);
}

function SparkleIcon() {
	return (
		<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2z" />
		</svg>
	);
}

function ListSkeleton() {
	return (
		<ul className={`${card} divide-y divide-zinc-100 dark:divide-zinc-800`} aria-label="Loading incidents">
			{[0, 1, 2].map((i) => (
				<li key={i} className="flex items-center gap-3 px-4 py-4">
					<span className="size-2 rounded-full bg-zinc-200 dark:bg-zinc-700" />
					<span className="h-3 flex-1 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
					<span className="h-3 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
				</li>
			))}
		</ul>
	);
}

function ChevronIcon({ open }: { open: boolean }) {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			className={`shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
		>
			<path d="M6 9l6 6 6-6" />
		</svg>
	);
}

function CheckIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M5 12l5 5L20 7" />
		</svg>
	);
}
