export function Spinner() {
	return (
		<span
			role="status"
			aria-label="Loading"
			className="inline-block size-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700 dark:border-zinc-700 dark:border-t-zinc-200"
		/>
	);
}
