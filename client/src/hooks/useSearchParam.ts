import { useEffect, useState } from "react";

function read(name: string): string | null {
	return new URLSearchParams(window.location.search).get(name);
}

// keeps one value in the URL (?tab=incidents&page=3) so a link opens the same view.
// null removes it, which keeps default views at a clean "/".
export function useSearchParam(name: string) {
	const [value, setValue] = useState(() => read(name));

	// back / forward buttons change the URL without telling React
	useEffect(() => {
		const onPopState = () => setValue(read(name));
		window.addEventListener("popstate", onPopState);
		return () => window.removeEventListener("popstate", onPopState);
	}, [name]);

	// push = new history entry (back button returns here); replace = fix the URL quietly
	function update(next: string | null, { replace = false } = {}) {
		const params = new URLSearchParams(window.location.search);
		if (next === null) params.delete(name);
		else params.set(name, next);

		const query = params.toString();
		const url = query ? `?${query}` : window.location.pathname;
		if (replace) window.history.replaceState(null, "", url);
		else window.history.pushState(null, "", url);
		setValue(next);
	}

	return [value, update] as const;
}
