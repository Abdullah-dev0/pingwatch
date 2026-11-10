import { isToolUIPart, type UIMessage } from "ai";

// true while a lookup hasn't finished yet (ToolSteps shows "Looking up data…", ChatWidget hides the typing dots)
export function toolsRunning(message: UIMessage): boolean {
	return message.parts.some((p) => isToolUIPart(p) && (p.state === "input-streaming" || p.state === "input-available"));
}
