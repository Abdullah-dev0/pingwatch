// shared by the table and its loading skeleton, so both have the same columns
export function PingsTableHead() {
	return (
		<thead className="border-b border-zinc-200 bg-zinc-50 text-xs whitespace-nowrap text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
			<tr>
				<th className="px-4 py-3 text-left font-medium">Time</th>
				<th className="px-4 py-3 text-left font-medium">Status</th>
				<th className="px-4 py-3 text-right font-medium">Response time</th>
				<th className="px-4 py-3 text-left font-medium">Payload</th>
				<th className="w-10 px-4 py-3" />
			</tr>
		</thead>
	);
}
