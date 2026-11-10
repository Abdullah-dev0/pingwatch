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
