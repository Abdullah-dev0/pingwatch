import { env } from "../config/env.js";
import { runCheck } from "../services/monitor.service.js";

export function startPingJob(): () => void {
	// run once on startup so we don't wait 5 min for the first ping
	void runCheck();
	const timer = setInterval(runCheck, env.PING_INTERVAL_MS);
	return () => clearInterval(timer);
}
