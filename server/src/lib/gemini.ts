import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

export const aiEnabled = Boolean(env.GEMINI_API_KEY);

// used for chat and incident reports (through the Vercel AI SDK)
export const model = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY })(env.GEMINI_MODEL);

// the AI SDK has no "count tokens before the call", so we use Google's own SDK for that one thing
const genai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY ?? "" });

export async function countTokens(text: string): Promise<number> {
	try {
		const { totalTokens } = await genai.models.countTokens({ model: env.GEMINI_MODEL, contents: text });
		return totalTokens ?? estimateTokens(text);
	} catch {
		// counting is a safety check, not worth failing the request over
		return estimateTokens(text);
	}
}

// rough rule of thumb: ~4 characters per token for English text
function estimateTokens(text: string): number {
	return Math.ceil(text.length / 4);
}

export function costUsd(inputTokens: number, outputTokens: number): number {
	return (inputTokens * env.GEMINI_INPUT_USD_PER_M + outputTokens * env.GEMINI_OUTPUT_USD_PER_M) / 1_000_000;
}
