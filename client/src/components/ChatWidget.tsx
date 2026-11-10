import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport, isToolUIPart, type UIMessage } from "ai";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { API_URL } from "../lib/api";
import { ToolSteps } from "./ToolSteps";

const SUGGESTIONS = [
	"What were the slowest response times today?",
	"Summarize any issues in the last 24 hours",
	"Why did response time spike in the last hour?",
];

const transport = new DefaultChatTransport({
	api: `${API_URL}/api/chat`,
	// the server doesn't store chats, so we send the conversation, but only the last 6 messages:
	// that's all the server uses, and a long chat would otherwise hit its 50-message limit
	prepareSendMessagesRequest: ({ messages }) => ({
		body: {
			messages: messages.slice(-6),
			// so "2pm" means 2pm for this user, not for the server
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		},
	}),
});

// the server sends { error: { message } } for 400/429; show that text instead of raw JSON
function errorText(error: Error): string {
	try {
		return JSON.parse(error.message).error.message;
	} catch {
		return "Something went wrong. Please try again.";
	}
}

export function ChatWidget() {
	const [open, setOpen] = useState(false);

	return (
		<div className="fixed right-4 bottom-4 z-10 flex flex-col items-end gap-3">
			{open && <ChatPanel onClose={() => setOpen(false)} />}
			<button
				type="button"
				onClick={() => setOpen(!open)}
				aria-label={open ? "Close AI chat" : "Open AI chat"}
				className="flex size-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition hover:scale-105 dark:bg-white dark:text-zinc-900">
				{open ? <CloseIcon /> : <SparkleIcon />}
			</button>
		</div>
	);
}

function ChatPanel({ onClose }: { onClose: () => void }) {
	const queryClient = useQueryClient();
	const { messages, sendMessage, status, stop, error } = useChat({
		transport,
		// each answer may have used LLM calls: refresh the counter
		onFinish: () => queryClient.invalidateQueries({ queryKey: ["ai-usage"] }),
	});

	const [input, setInput] = useState("");
	const busy = status === "submitted" || status === "streaming";
	const bottom = useRef<HTMLDivElement>(null);

	// keep the newest message in view. Braces matter: an effect may only return a clean-up function
	useEffect(() => {
		bottom.current?.scrollIntoView({ block: "end" });
	}, [messages, status]);

	function ask(text: string) {
		if (!text.trim() || busy) return;
		sendMessage({ text });
		setInput("");
	}

	function onSubmit(e: FormEvent) {
		e.preventDefault();
		ask(input);
	}

	// useChat status: "submitted" = request sent, stream not started, so there's no assistant message yet.
	// "streaming" = the assistant message exists (tool calls arrive first), its text may not have started.
	const lastId = messages.at(-1)?.id;

	return (
		<div className="flex h-128 max-h-[calc(100vh-6rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl sm:w-[26rem] dark:border-zinc-800 dark:bg-zinc-900">
			<div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
				<Avatar />
				<div className="flex-1">
					<p className="text-sm font-semibold">Monitor assistant</p>
					<p className="text-xs text-zinc-500">Answers from your ping data</p>
				</div>
				<button
					type="button"
					onClick={onClose}
					aria-label="Close"
					className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
					<CloseIcon />
				</button>
			</div>

			<div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 text-sm leading-relaxed">
				{messages.length === 0 && (
					<div className="flex h-full flex-col items-center justify-center text-center">
						<div className="mb-3 flex size-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
							<SparkleIcon />
						</div>
						<p className="font-medium">How can I help?</p>
						<p className="mt-1 mb-4 text-xs text-zinc-500">Ask about response times, failures or spikes.</p>
						<div className="flex w-full flex-col gap-2">
							{SUGGESTIONS.map((s) => (
								<button
									key={s}
									type="button"
									onClick={() => ask(s)}
									className="rounded-xl border border-zinc-200 px-3 py-2 text-left text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
									{s}
								</button>
							))}
						</div>
					</div>
				)}

				{messages.map((message) =>
					message.role === "user" ? (
						<div key={message.id} className="flex justify-end">
							<p className="max-w-[85%] rounded-3xl bg-zinc-100 px-4 py-2.5 whitespace-pre-wrap dark:bg-zinc-800">
								{textOf(message)}
							</p>
						</div>
					) : (
						<div key={message.id} className="flex gap-3">
							<Avatar />
							<div className="min-w-0 flex-1 pt-0.5">
								<ToolSteps message={message} />
								{textOf(message) ? (
									<p className="whitespace-pre-wrap">{textOf(message)}</p>
								) : (
									// dots only while the model is "thinking"; during lookups ToolSteps shows its own status
									status === "streaming" && message.id === lastId && !toolsRunning(message) && <TypingDots />
								)}
							</div>
						</div>
					),
				)}

				{status === "submitted" && (
					<div className="flex gap-3">
						<Avatar />
						<TypingDots />
					</div>
				)}

				{error && (
					<p className="rounded-xl bg-red-50 px-3 py-2 text-red-700 dark:bg-red-500/10 dark:text-red-300">
						{errorText(error)}
					</p>
				)}
				<div ref={bottom} />
			</div>

			<form onSubmit={onSubmit} className="p-3">
				<div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 py-1.5 pr-1.5 pl-4 focus-within:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800">
					<input
						value={input}
						onChange={(e) => setInput(e.target.value)}
						maxLength={500}
						placeholder="Ask anything about the pings…"
						aria-label="Question"
						className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
					/>
					{busy ? (
						<button
							type="button"
							onClick={() => stop()}
							aria-label="Stop"
							className="flex size-8 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
							<span className="size-2.5 rounded-sm bg-current" />
						</button>
					) : (
						<button
							type="submit"
							disabled={!input.trim()}
							aria-label="Send"
							className="flex size-8 items-center justify-center rounded-full bg-zinc-900 text-white transition disabled:bg-zinc-300 dark:bg-white dark:text-zinc-900 dark:disabled:bg-zinc-600">
							<ArrowUpIcon />
						</button>
					)}
				</div>
				<p className="mt-2 text-center text-[11px] text-zinc-400">
					AI answers can be wrong. Check the table for exact values.
				</p>
			</form>
		</div>
	);
}

function textOf(message: UIMessage): string {
	return message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

function toolsRunning(message: UIMessage): boolean {
	return message.parts.some((p) => isToolUIPart(p) && (p.state === "input-streaming" || p.state === "input-available"));
}

function Avatar() {
	return (
		<span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
			<SparkleIcon small />
		</span>
	);
}

function TypingDots() {
	return (
		<span className="flex items-center gap-1 pt-2" role="status" aria-label="Thinking">
			{[0, 150, 300].map((delay) => (
				<span
					key={delay}
					className="size-1.5 animate-bounce rounded-full bg-zinc-400"
					style={{ animationDelay: `${delay}ms` }}
				/>
			))}
		</span>
	);
}

// --- icons (inline SVG, no icon library) ---

function SparkleIcon({ small }: { small?: boolean }) {
	const size = small ? 14 : 20;
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2zm7 12l.9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 14z" />
		</svg>
	);
}

function CloseIcon() {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			aria-hidden="true">
			<path d="M6 6l12 12M18 6L6 18" />
		</svg>
	);
}

function ArrowUpIcon() {
	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true">
			<path d="M12 19V5M5 12l7-7 7 7" />
		</svg>
	);
}
