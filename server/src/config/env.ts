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
	// optional: without it the AI features answer with a 'not configured' message
	GEMINI_API_KEY: z.string().optional(),
	GEMINI_MODEL: z.string().default("gemini-3.8-flash"),
	// USD per 1M tokens (paid tier), used for the cost display. Check https://aistudio.google.com/docs/pricing
	// gemini-3.8-flash: 0.75 / 3.75 until 31 Dec 2026, then 1.5 / 7.5
	GEMINI_INPUT_USD_PER_M: z.coerce.number().min(0).default(0.75),
	GEMINI_OUTPUT_USD_PER_M: z.coerce.number().min(0).default(3.75),
});

export const env = envSchema.parse(process.env);
