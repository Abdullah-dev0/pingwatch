import { z } from "zod";

// fail on startup if config is wrong, not later
const envSchema = z.object({
	NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
	PORT: z.coerce.number().int().positive().default(3001),
	// comma-separated list of frontend urls
	CORS_ORIGIN: z
		.string()
		.default("http://localhost:5173")
		.transform((value) => value.split(",").map((origin) => origin.trim())),
	DATABASE_URL: z.string().min(1, "DATABASE_URL is required (see .env.example)"),
	PING_INTERVAL_MS: z.coerce
		.number()
		.int()
		.min(5000)
		.default(5 * 60 * 1000),
});

export const env = envSchema.parse(process.env);
