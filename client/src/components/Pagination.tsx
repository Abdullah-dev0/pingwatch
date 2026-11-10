import { Spinner } from "./ui/Spinner";
import { button } from "./ui/styles";

interface Props {
	page: number;
	totalPages: number;
	total: number;
	loading: boolean;
	onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, loading, onPageChange }: Props) {
	// everything fits on one page, so there's nothing to page through
	if (totalPages <= 1) {
		return <p className="mt-4 text-sm text-zinc-500 tabular-nums">{total} pings</p>;
	}

	return (
		<div className="mt-4 flex items-center justify-between gap-3">
			<p className="flex items-center gap-2 text-sm text-zinc-500 tabular-nums">
				Page {page} of {totalPages}
				<span className="hidden sm:inline">· {total} pings</span>
				{loading && <Spinner />}
			</p>

			<div className="flex gap-2">
				<button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className={button}>
					Previous
				</button>
				<button
					type="button"
					onClick={() => onPageChange(page + 1)}
					disabled={page >= totalPages}
					className={button}
				>
					Next
				</button>
			</div>
		</div>
	);
}
