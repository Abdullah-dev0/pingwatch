import { pino } from "pino";
import { env } from "../config/env.js";

// pretty logs in dev, plain JSON in prod
export const logger = pino({
	level: env.NODE_ENV === "test" ? "silent" : "info",
	...(env.NODE_ENV === "development" && {
		transport: {
			target: "pino-pretty",
			options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
		},
	}),
});
