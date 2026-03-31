import { paginate } from "@/lib/utils";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = paginate(totalPages, currentPage);

  return (
    <div className="flex justify-center gap-1 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1.5 rounded border text-sm disabled:opacity-40 hover:bg-gray-100"
      >
        ‹ Prev
      </button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-3 py-1.5 text-sm text-muted">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1.5 rounded border text-sm ${
              p === currentPage
                ? "bg-primary text-white border-primary"
                : "hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1.5 rounded border text-sm disabled:opacity-40 hover:bg-gray-100"
      >
        Next ›
      </button>
    </div>
  );
}
