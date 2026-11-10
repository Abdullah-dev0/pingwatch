const dateTime = new Intl.DateTimeFormat(undefined, {
	month: "short",
	day: "numeric",
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
});

export function formatDateTime(iso: string): string {
	return dateTime.format(new Date(iso));
}

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

// "5 minutes ago", "yesterday"
export function formatRelative(iso: string): string {
	const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
	if (Math.abs(minutes) < 60) return relative.format(minutes, "minute");
	if (Math.abs(minutes) < 24 * 60) return relative.format(Math.round(minutes / 60), "hour");
	return relative.format(Math.round(minutes / (24 * 60)), "day");
}

export function formatTime(iso: string): string {
	return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const dayTime = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

// "2:19 PM – 8:19 PM", or with dates when the range crosses midnight: "Nov 9, 8:50 PM – Nov 10, 8:50 PM"
export function formatRange(fromIso: string, toIso: string): string {
	const from = new Date(fromIso);
	const to = new Date(toIso);
	if (from.toDateString() === to.toDateString()) return `${formatTime(fromIso)} – ${formatTime(toIso)}`;
	return `${dayTime.format(from)} – ${dayTime.format(to)}`;
}
