import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { lastPingAt } from "../repositories/ping.repository.js";
import { runCheck } from "../services/monitor.service.js";

// how long to wait before the first ping after startup: none if the last ping is older than one
// interval (or there is none), otherwise until that ping's next slot. Without this, every restart
// or deploy adds an extra ping a few seconds after a scheduled one.
export function msUntilFirstPing(lastAt: Date | null, now: number, intervalMs: number): number {
	if (!lastAt) return 0;
	return Math.max(0, lastAt.getTime() + intervalMs - now);
}

export function startPingJob(): () => void {
	let timer: NodeJS.Timeout | undefined;
	let stopped = false;

	void lastPingAt()
		.catch(() => null) // can't tell: ping now, like a fresh start
		.then((lastAt) => {
			if (stopped) return;
			const wait = msUntilFirstPing(lastAt, Date.now(), env.PING_INTERVAL_MS);
			if (wait > 0) logger.info({ waitMs: wait }, "Last ping was recent, waiting for its next slot");
			timer = setTimeout(() => {
				void runCheck();
				timer = setInterval(runCheck, env.PING_INTERVAL_MS);
			}, wait);
		});

	return () => {
		stopped = true;
		clearTimeout(timer); // also clears an interval in Node
	};
}
