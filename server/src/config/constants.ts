// All fixed numbers and limits in one place. Values that change per environment live in env.ts.

// --- pinging -----------------------------------------------------------------
export const HTTPBIN_URL = "https://httpbin.org/anything";
export const PING_TIMEOUT_MS = 10_000;

// --- API ---------------------------------------------------------------------
export const JSON_BODY_LIMIT = "100kb";
export const INCIDENTS_LIST_LIMIT = 50;

// --- LLM cost controls -------------------------------------------------------
export const HOURLY_LLM_CALL_LIMIT = 20; // from the brief: max 20 LLM calls per hour
export const CHAT_CACHE_TTL_MS = 5 * 60 * 1000; // new data arrives every 5 minutes
export const MAX_QUESTION_CHARS = 500; // the chat input has the same limit (client constants)
export const MAX_MESSAGES_ACCEPTED = 50; // a request with more is rejected
export const MAX_HISTORY_MESSAGES = 6; // messages actually sent to Gemini; the client sends the same number
export const MAX_INPUT_TOKENS = 4000;
export const MAX_CHAT_STEPS = 10; // Gemini calls per question (tool rounds + the answer)
export const MAX_PINGS_PER_LOOKUP = 20; // rows one findPings tool call can return
// how much Gemini thinks before answering ('minimal' | 'low' | 'medium' | 'high').
// Thinking is billed as output tokens and is most of the wait; our questions are simple lookups.
export const THINKING_LEVEL = "low";

// --- incidents ---------------------------------------------------------------
export const INCIDENT_MIN_SAMPLES = 5; // fewer successful pings than this in 24h: no baseline yet
// slower than this many times the 24h average
export const SEVERITY_THRESHOLDS = { low: 2, medium: 3, high: 4 } as const;
