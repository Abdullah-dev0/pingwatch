import type { ReactNode } from "react";
import { card } from "./styles";

// centered text in a card, for empty and error states
export function Message({ children }: { children: ReactNode }) {
	return <div className={`${card} px-4 py-10 text-center text-sm text-zinc-500`}>{children}</div>;
}
