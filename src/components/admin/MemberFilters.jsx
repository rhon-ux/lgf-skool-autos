import { useState } from "react";
import {
  COMMUNITY_FILTER_OPTIONS,
  TIER_OPTIONS,
  STATUS_OPTIONS,
  STATUS_QUICK_FILTERS,
  LEVEL_OPTIONS,
  SORT_OPTIONS,
  ACTIVE_PAST_OPTIONS,
} from "./membersData";

function FilterField({ label, hint, children }) {
  return (
    <div className="filter-field">
      <label className="filter-field-label">
        {label}
        {hint && (
          <span className="filter-field-hint" title={hint}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

export default function MemberFilters({ search, onSearchChange, filters, onFiltersChange }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const set = (key, value) => onFiltersChange(prev => ({ ...prev, [key]: value }));

  const quickStatus = filters.status || "All";
  const setQuickStatus = (value) => set("status", value === "All" ? "" : value);

  return (
    <div className="member-filters">
      <div className="member-filters-top">
        <input
          type="text"
          className="form-input form-input--search member-filters-search"
          placeholder="Search name or email..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
        />
        <div className="filter-group">
          {STATUS_QUICK_FILTERS.map(s => (
            <button
              key={s}
              type="button"
              className={`filter-btn${quickStatus === s ? " filter-btn--active" : ""}`}
              onClick={() => setQuickStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="member-filters-panel panel">
        <div className="member-filters-row">
          <FilterField label="Community">
            <select
              className="filter-select"
              value={filters.community}
              onChange={e => set("community", e.target.value)}
            >
              {COMMUNITY_FILTER_OPTIONS.map(o => (
                <option key={o.value || "all"} value={o.value}>{o.label}</option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Tier">
            <select className="filter-select" value={filters.tier} onChange={e => set("tier", e.target.value)}>
              <option value="">Select tiers...</option>
              {TIER_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FilterField>

          <FilterField label="Status">
            <select
              className="filter-select"
              value={filters.status}
              onChange={e => set("status", e.target.value)}
            >
              <option value="">Select statuses...</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FilterField>

          <FilterField label="Sort">
            <select className="filter-select" value={filters.sort} onChange={e => set("sort", e.target.value)}>
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </FilterField>

          <button
            type="button"
            className="filter-toggle"
            onClick={() => setShowAdvanced(v => !v)}
          >
            {showAdvanced ? "Less Filters" : "More Filters"}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {showAdvanced
                ? <polyline points="18 15 12 9 6 15" />
                : <polyline points="6 9 12 15 18 9" />}
            </svg>
          </button>
        </div>

        {showAdvanced && (
          <>
            <p className="member-filters-advanced-label">
              Advanced Filters · Additional filtering options
            </p>
            <div className="member-filters-row">
              <FilterField label="Level">
                <select className="filter-select" value={filters.level} onChange={e => set("level", e.target.value)}>
                  <option value="">Select levels...</option>
                  {LEVEL_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </FilterField>

              <FilterField label="Joined From">
                <div className="filter-date">
                  <input
                    type="date"
                    className="filter-select filter-date-input"
                    value={filters.joinedFrom}
                    onChange={e => set("joinedFrom", e.target.value)}
                  />
                  <svg className="filter-date-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
              </FilterField>

              <FilterField label="Joined To">
                <div className="filter-date">
                  <input
                    type="date"
                    className="filter-select filter-date-input"
                    value={filters.joinedTo}
                    onChange={e => set("joinedTo", e.target.value)}
                  />
                  <svg className="filter-date-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
              </FilterField>

              <FilterField
                label="Active in Past"
                hint="Show members active within the selected number of days"
              >
                <select className="filter-select" value={filters.activeInPast} onChange={e => set("activeInPast", e.target.value)}>
                  <option value="">Select days...</option>
                  {ACTIVE_PAST_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </FilterField>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
