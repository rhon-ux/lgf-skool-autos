import { useState, useEffect, useMemo, useRef } from "react";
import { MEMBER_COLUMNS, DEFAULT_PAGE_SIZE } from "./membersData";
import MemberAvatar from "./MemberAvatar";
import MemberFilters from "./MemberFilters";
import Pagination from "./Pagination";

function tierClass(tier) {
  const key = (tier || "bronze").toLowerCase();
  return `tier-badge tier-badge--${key}`;
}

export default function MembersPage({
  members,
  filtered,
  active,
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  onAddClick,
  onImportCsv,
  importing = false,
  importProgress = null,
  onViewMember,
  onEdit,
  onDelete,
  loading = false,
  dataSource = "local",
}) {
  const fileInputRef = useRef(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filtered.length, search, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  return (
    <div>
      <div className="page-header page-header--row">
        <div>
          <h1 className="page-title">Members</h1>
          <p className="page-subtitle">
            {loading ? "Loading members…" : `${members.length} total · ${active} active`}
            <span className={`db-source-badge db-source-badge--${dataSource}`}>
              {dataSource === "database" ? "Supabase" : "Local storage"}
            </span>
          </p>
        </div>
        <div className="page-header-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) onImportCsv?.(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className="btn btn-secondary btn-primary--inline"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
          >
            {importing
              ? importProgress
                ? `Importing… ${importProgress.done}/${importProgress.total}`
                : "Importing…"
              : "Import Skool CSV"}
          </button>
          <button type="button" className="btn btn-primary btn-primary--inline" onClick={onAddClick}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add member
          </button>
        </div>
      </div>

      <MemberFilters
        search={search}
        onSearchChange={onSearchChange}
        filters={filters}
        onFiltersChange={onFiltersChange}
      />

      <div className="panel table-wrapper table-wrapper--scroll">
        <table className="members-table">
          <thead>
            <tr>
              {MEMBER_COLUMNS.map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map(m => (
              <tr key={m.id}>
                <td>
                  <div className="member-cell">
                    <MemberAvatar member={m} className="member-avatar--sm" />
                    <div className="member-info member-info--table">
                      <button type="button" className="member-name member-name--link member-name--truncate" onClick={() => onViewMember(m)}>
                        {m.name}
                      </button>
                      <p className="member-meta member-meta--truncate">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={tierClass(m.tier)}>{m.tier || "—"}</span>
                </td>
                <td className="table-text">{m.price || "—"}</td>
                <td className="table-text">{m.recurringInterval || m.currentMembership || "—"}</td>
                <td className="date">{m.joinedDate ?? m.joined}</td>
                <td className="table-text table-text--ltv">{m.ltv}</td>
                <td className="table-text">{m.invitedBy || "—"}</td>
                <td>
                  <div className="table-actions">
                    <button type="button" className="btn-icon btn-icon--edit" onClick={() => onEdit(m)}>Edit</button>
                    <button type="button" className="btn-icon btn-icon--delete" onClick={() => onDelete(m.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={MEMBER_COLUMNS.length} className="table-empty">No members found</td></tr>
            )}
          </tbody>
        </table>

        {filtered.length > 0 && (
          <Pagination
            page={safePage}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={size => { setPageSize(size); setPage(1); }}
          />
        )}
      </div>
    </div>
  );
}
