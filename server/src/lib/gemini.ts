import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

export const aiEnabled = Boolean(env.GEMINI_API_KEY);

// used for chat and incident reports (through the Vercel AI SDK)
export const model = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY })(env.GEMINI_MODEL);

// the AI SDK has no "count tokens before the call", so we use Google's own SDK for that one thing
const genai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY ?? "" });

// a separate, free Gemini endpoint: it only counts, it doesn't run the model.
// null if counting failed; callers then skip the size check (the hourly limit still caps cost).
export async function countTokens(text: string): Promise<number | null> {
	try {
		const { totalTokens } = await genai.models.countTokens({ model: env.GEMINI_MODEL, contents: text });
		return totalTokens ?? null;
	} catch {
		return null;
	}
}

export function costUsd(inputTokens: number, outputTokens: number): number {
	return (inputTokens * env.GEMINI_INPUT_USD_PER_M + outputTokens * env.GEMINI_OUTPUT_USD_PER_M) / 1_000_000;
}
