import { Message } from "./ui/Message";

// the server sends index.html for every non-API path, so the app decides what's a real page
export function NotFound() {
	return (
		<div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
			<Message>
				<p className="text-base font-medium text-zinc-900 dark:text-zinc-100">Page not found</p>
				<p className="mt-1">
					There's nothing at <span className="font-mono">{window.location.pathname}</span>.
				</p>
				<a href="/" className="mt-4 inline-block underline hover:text-zinc-700 dark:hover:text-zinc-300">
					Go to the dashboard
				</a>
			</Message>
		</div>
	);
}
