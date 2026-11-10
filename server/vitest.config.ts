import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// env.ts needs these to load; tests never connect to a real database
		env: {
			NODE_ENV: "test",
			DATABASE_URL: "postgres://test:test@localhost:5432/test",
		},
		coverage: {
			provider: "v8",
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.test.ts", "src/index.ts"],
			reporter: ["text", "html", "lcov"],
		},
	},
});
