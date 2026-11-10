// All fixed values for the frontend in one place.
// The server has its own list in server/src/config/constants.ts (the two packages can't share a file).

// set VITE_API_URL for production builds
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export const PAGE_SIZE = 10; // pings per table page
export const AI_USAGE_REFRESH_MS = 60_000; // calls drop out of the 1-hour window over time

// chat: keep these equal to the server's MAX_HISTORY_MESSAGES and MAX_QUESTION_CHARS
export const CHAT_HISTORY_MESSAGES = 6;
export const MAX_QUESTION_CHARS = 500;

export const CHAT_SUGGESTIONS = [
	"What were the slowest response times today?",
	"Summarize any issues in the last 24 hours",
	"Why did response time spike in the last hour?",
];
