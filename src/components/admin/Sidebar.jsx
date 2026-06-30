import { useState } from "react";
import logo from "../../assets/logo.png";

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  },
  {
    id: "members",
    label: "Members",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    id: "dm-sequences",
    label: "DM Sequences",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  },
  {
    id: "bulk-dms",
    label: "Bulk DMs",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  },
  {
    id: "event-reminders",
    label: "Event Reminders",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  // {
  //   id: "fb-transfer",
  //   label: "FB Transfer",
  //   icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>,
  // },
  // {
  //   id: "zapier",
  //   label: "Zapier",
  //   icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
  // },
];

export default function Sidebar({ page, onNavigate, onSignOut }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src={logo} alt="Let's Get Funded" className="sidebar-logo-img" />
        </div>
        <span className="sidebar-brand">Let's Get Funded</span>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {collapsed
              ? <polyline points="9 18 15 12 9 6" />
              : <polyline points="15 18 9 12 15 6" />}
          </svg>
        </button>
      </div>

      <nav className="sidebar-nav">
        <h4 className="sidebar-title">Engagement</h4>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            type="button"
            className={`sidebar-nav-item${page === item.id || (item.id === "members" && page === "member-detail") || (item.id === "event-reminders" && page === "event-reminder-config") ? " sidebar-nav-item--active" : ""}`}
            onClick={() => onNavigate(item.id)}
            title={collapsed ? item.label : undefined}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            <span className="sidebar-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user" title={collapsed ? "Rhon Rico · Admin" : undefined}>
          <div className="sidebar-user-avatar">RR</div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">Rhon Rico</p>
            <p className="sidebar-user-role">Admin</p>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-secondary--full sidebar-signout"
          onClick={onSignOut}
          title={collapsed ? "Sign out" : undefined}
        >
          <span className="sidebar-signout-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
          <span className="sidebar-signout-label">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
