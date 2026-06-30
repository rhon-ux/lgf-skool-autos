import { PAGE_SIZE_OPTIONS } from "./membersData";

export default function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - safePage) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <div className="pagination">
      <p className="pagination-info">
        {total === 0 ? "No members" : `Showing ${start}–${end} of ${total} members`}
      </p>

      <div className="pagination-controls">
        <label className="pagination-size">
          <span>Rows</span>
          <select
            className="pagination-size-select"
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>

        <div className="pagination-nav">
          <button
            type="button"
            className="pagination-btn"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
          >
            Prev
          </button>

          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`ellipsis-${i}`} className="pagination-ellipsis">…</span>
            ) : (
              <button
                key={p}
                type="button"
                className={`pagination-btn pagination-btn--page${safePage === p ? " pagination-btn--active" : ""}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            )
          )}

          <button
            type="button"
            className="pagination-btn"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
