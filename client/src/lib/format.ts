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

export function formatTime(iso: string): string {
	return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
