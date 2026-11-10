import type { Request, Response } from "express";
import { createUIMessageStream, pipeUIMessageStreamToResponse, toUIMessageStream, type UIMessage } from "ai";
import { z } from "zod";
import { aiEnabled, countTokens } from "../lib/gemini.js";
import { logger } from "../lib/logger.js";
import { streamChatAnswer } from "../services/chat.service.js";
import { cacheAnswer, callsLeft, getCachedAnswer, getUsage } from "../services/llmBudget.service.js";
import {
	MAX_HISTORY_MESSAGES,
	MAX_INPUT_TOKENS,
	MAX_MESSAGES_ACCEPTED,
	MAX_QUESTION_CHARS,
} from "../config/constants.js";

// useChat sends the whole conversation; anyone could send a fake huge one, so check it
const chatBody = z.object({
	messages: z
		.array(
			z.object({
				id: z.string(),
				role: z.enum(["user", "assistant"]),
				parts: z.array(z.looseObject({ type: z.string() })),
			}),
		)
		.min(1)
		.max(MAX_MESSAGES_ACCEPTED),
	timezone: z.string().max(64).default("UTC"),
});

// only the text of recent messages: old tool results would cost tokens on every question
function trimHistory(messages: z.infer<typeof chatBody>["messages"]): UIMessage[] {
	return messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
		id: m.id,
		role: m.role,
		parts: m.parts
			.filter((p) => p.type === "text" && typeof p.text === "string")
			.map((p) => ({ type: "text" as const, text: p.text as string })),
	}));
}

function textOf(message: UIMessage): string {
	return message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

// answer without calling Gemini (cache hit, over the limit, not configured).
// Sent as a normal chat stream so the widget shows it like any other answer.
function replyWith(res: Response, text: string) {
	const id = crypto.randomUUID();
	const stream = createUIMessageStream({
		execute: ({ writer }) => {
			writer.write({ type: "text-start", id });
			writer.write({ type: "text-delta", id, delta: text });
			writer.write({ type: "text-end", id });
		},
	});
	return pipeUIMessageStreamToResponse({ response: res, stream });
}

// POST /api/chat
export async function postChat(req: Request, res: Response) {
	const body = chatBody.safeParse(req.body);

	if (!body.success) {
		res.status(400).json({ error: { message: "Invalid chat request" } });
		return;
	}

	const messages = trimHistory(body.data.messages);
	const question = textOf(messages.at(-1)!);
	if (messages.at(-1)!.role !== "user" || !question.trim()) {
		res.status(400).json({ error: { message: "The last message must be a question" } });
		return;
	}
	if (question.length > MAX_QUESTION_CHARS) {
		res.status(400).json({ error: { message: `Questions can be at most ${MAX_QUESTION_CHARS} characters` } });
		return;
	}

	if (!aiEnabled) {
		return replyWith(res, "The AI assistant isn't configured on this server (no GEMINI_API_KEY).");
	}

	// only first questions are cached: a follow-up's answer depends on the conversation before it
	const isFirstQuestion = messages.length === 1;
	const cached = isFirstQuestion && getCachedAnswer(question);
	if (cached) return replyWith(res, cached);

	const stepsAllowed = callsLeft();
	if (stepsAllowed === 0) {
		return replyWith(
			res,
			"The AI assistant has used its hourly limit. It will be back within the hour. The table and stats above are still live.",
		);
	}

	const tokens = await countTokens(messages.map(textOf).join("\n"));

	if (tokens !== null && tokens > MAX_INPUT_TOKENS) {
		return replyWith(res, "This conversation is too long for me. Please start a new chat.");
	}

	const result = await streamChatAnswer({
		messages,
		timezone: body.data.timezone,
		stepsAllowed,
		onAnswer: (answer) => isFirstQuestion && cacheAnswer(question, answer),
	});

	return pipeUIMessageStreamToResponse({
		response: res,
		stream: toUIMessageStream({
			stream: result.stream,
			// log the real error, show the user a generic one
			onError: (err) => {
				logger.error({ err }, "Chat failed");
				return "Sorry, something went wrong while answering. Please try again.";
			},
		}),
	});
}

// GET /api/ai/usage
export async function getAiUsage(_req: Request, res: Response) {
	res.json({ ...(await getUsage()), enabled: aiEnabled });
}
