import { useMemo, useState } from "react";
import {
  BULK_DM_COMMUNITIES,
  DEFAULT_BULK_DM_FILTERS,
  MAX_ACTIVE_DAYS,
  MOCK_BULK_DM_HISTORY,
  filterBulkDmMembers,
  formatLastActive,
  membersToBulkDmRows,
} from "./bulkDmsData";

function CommunityPill({ label, selected, onClick }) {
  return (
    <button
      type="button"
      className={`bulk-pill${selected ? " bulk-pill--selected" : ""}`}
      onClick={onClick}
    >
      <span className="bulk-pill-icon" aria-hidden="true">
        {selected ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
          </svg>
        )}
      </span>
      <span className="bulk-pill-label">{label}</span>
    </button>
  );
}

function FilterRow({ label, desc, children }) {
  return (
    <div className="bulk-filter-row">
      <div className="bulk-filter-row-label">
        <p className="bulk-filter-row-title">{label}</p>
        {desc && <p className="bulk-filter-row-desc">{desc}</p>}
      </div>
      <div className="bulk-filter-row-control">{children}</div>
    </div>
  );
}

export default function BulkDmsPage({
  members = [],
  loading = false,
  dataSource = "local",
  onRefresh,
  onNotify,
}) {
  const [view, setView] = useState("compose");
  const [filters, setFilters] = useState(DEFAULT_BULK_DM_FILTERS);
  const [memberSearch, setMemberSearch] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const bulkMembers = useMemo(() => membersToBulkDmRows(members), [members]);

  const matched = useMemo(
    () => filterBulkDmMembers(bulkMembers, { ...filters, search: memberSearch }),
    [bulkMembers, filters, memberSearch],
  );

  const handleRefresh = async () => {
    if (!onRefresh) {
      onNotify?.("Member list refreshed");
      return;
    }
    setRefreshing(true);
    try {
      await onRefresh();
      onNotify?.("Members reloaded from database");
    } catch (err) {
      onNotify?.(err.message || "Failed to refresh members", "error");
    } finally {
      setRefreshing(false);
    }
  };

  const toggleInclude = (id) => {
    setFilters(prev => {
      const include = prev.include.includes(id)
        ? prev.include.filter(x => x !== id)
        : [...prev.include, id];
      const exclude = prev.exclude.filter(x => x !== id);
      return { ...prev, include, exclude };
    });
  };

  const toggleExclude = (id) => {
    setFilters(prev => {
      const exclude = prev.exclude.includes(id)
        ? prev.exclude.filter(x => x !== id)
        : [...prev.exclude, id];
      const include = prev.include.filter(x => x !== id);
      return { ...prev, include, exclude };
    });
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 900));
    setSending(false);
    onNotify?.(`Bulk DM queued for ${matched.length} members`);
    setMessage("");
  };

  if (view === "history") {
    return (
      <div className="bulk-dms-page">
        <div className="page-header page-header--row">
          <div>
            <button type="button" className="page-back" onClick={() => setView("compose")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to Bulk DMs
            </button>
            <h1 className="page-title">Bulk DM history</h1>
            <p className="page-subtitle">Previously sent bulk messages.</p>
          </div>
        </div>

        <div className="panel table-wrapper">
          <table className="bulk-results-table">
            <thead>
              <tr>
                <th>Sent at</th>
                <th>Message</th>
                <th>Recipients</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_BULK_DM_HISTORY.map(entry => (
                <tr key={entry.id}>
                  <td className="date">{entry.sentAt}</td>
                  <td className="bulk-history-preview">{entry.preview}</td>
                  <td className="table-text">{entry.recipients}</td>
                  <td>
                    <span className="bulk-status-badge" data-status={entry.status}>
                      {entry.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bulk-dms-page">
      <div className="page-header page-header--row">
        <div>
          <h1 className="page-title">Bulk DMs</h1>
          <p className="page-subtitle">
            {loading ? "Loading members…" : `${bulkMembers.length} members from ${dataSource === "database" ? "Supabase" : "local storage"}`}
            <span className={`db-source-badge db-source-badge--${dataSource}`}>
              {dataSource === "database" ? "Supabase" : "Local storage"}
            </span>
          </p>
        </div>
        <button type="button" className="btn btn-secondary bulk-history-btn" onClick={() => setView("history")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          View History
        </button>
      </div>

      <div className="panel bulk-filter-panel">
        <div className="bulk-section-head">
          <h2 className="panel-title panel-title--inline">Filter Members</h2>
          <p className="bulk-section-desc">Narrow down who receives this message.</p>
        </div>

        <FilterRow label="Activity window" desc="Days since last seen online.">
          <div className="bulk-activity-control">
            <span>Active in the past</span>
            <input
              type="number"
              min={1}
              max={MAX_ACTIVE_DAYS}
              className="form-input form-input--sm bulk-days-input"
              value={filters.activeDays}
              onChange={e => setFilters(prev => ({
                ...prev,
                activeDays: Math.min(MAX_ACTIVE_DAYS, Math.max(1, Number(e.target.value) || 1)),
              }))}
            />
            <span>days</span>
            <span className="bulk-days-max">max {MAX_ACTIVE_DAYS}</span>
          </div>
        </FilterRow>

        <FilterRow label="Communities" desc="Select which to include or exclude.">
          <div className="bulk-communities-grid">
            <div className="bulk-communities-col">
              <p className="bulk-communities-col-title">Include</p>
              <div className="bulk-pill-list">
                {BULK_DM_COMMUNITIES.map(c => (
                  <CommunityPill
                    key={`include-${c.id}`}
                    label={c.label}
                    selected={filters.include.includes(c.id)}
                    onClick={() => toggleInclude(c.id)}
                  />
                ))}
              </div>
            </div>
            <div className="bulk-communities-col">
              <p className="bulk-communities-col-title">Exclude</p>
              <div className="bulk-pill-list">
                {BULK_DM_COMMUNITIES.map(c => (
                  <CommunityPill
                    key={`exclude-${c.id}`}
                    label={c.label}
                    selected={filters.exclude.includes(c.id)}
                    onClick={() => toggleExclude(c.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </FilterRow>
      </div>

      <div className="panel bulk-compose-panel">
        <h2 className="bulk-compose-title">Compose message</h2>

        <div className="bulk-compose-tip">
          <strong>Tip:</strong> Use <code>{"{{firstName}}"}</code> as a placeholder for the member&apos;s first name.
          {" "}To include links, use the format <code>[text](https://example.com)</code>.
        </div>

        <div className="form-group form-group--lg">
          <label className="form-label" htmlFor="bulk-message">Message</label>
          <textarea
            id="bulk-message"
            className="form-input bulk-compose-textarea"
            rows={6}
            placeholder="Hey {{firstName}}, ..."
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
        </div>

        <div className="bulk-compose-footer">
          <span className="bulk-char-count">{message.length} characters</span>
          <button
            type="button"
            className="btn btn-configure bulk-send-btn"
            onClick={handleSend}
            disabled={sending || !message.trim() || matched.length === 0}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            {sending ? "Sending…" : "Send Bulk DM"}
          </button>
        </div>
      </div>

      <div className="panel bulk-results-panel">
        <div className="bulk-results-head">
          <p className="bulk-match-count">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <strong>{matched.length}</strong> members match your filters
          </p>
          <div className="bulk-results-tools">
            <input
              type="text"
              className="form-input form-input--sm bulk-results-search"
              placeholder="Search name, handle, or email…"
              value={memberSearch}
              onChange={e => setMemberSearch(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-secondary bulk-refresh-btn"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              title="Refresh from database"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          </div>
        </div>

        <div className="table-wrapper table-wrapper--scroll">
          <table className="bulk-results-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Handle</th>
                <th>Email</th>
                <th>Tier</th>
                <th>Last Active</th>
                <th>DM Status</th>
              </tr>
            </thead>
            <tbody>
              {matched.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    {loading ? "Loading members…" : bulkMembers.length === 0
                      ? "No members in database. Import Skool CSV on the Members page."
                      : "No members match the current filters."}
                  </td>
                </tr>
              ) : (
                matched.slice(0, 50).map(member => (
                  <tr key={member.id}>
                    <td className="bulk-member-name">{member.name}</td>
                    <td className="table-text">{member.handle}</td>
                    <td className="table-text">{member.email ?? "—"}</td>
                    <td className="table-text">{member.tier || "—"}</td>
                    <td className="date">{formatLastActive(member.lastActiveDays)}</td>
                    <td className="table-text">
                      <span className={`bulk-dm-status bulk-dm-status--${member.dmSent ? "sent" : "pending"}`}>
                        {member.dmSent ? "Messaged" : member.migrationStatus ?? "pending"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {matched.length > 50 && (
          <p className="bulk-results-more">Showing first 50 of {matched.length} members.</p>
        )}
      </div>
    </div>
  );
}
