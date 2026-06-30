function ReminderToggle({ checked, onChange, label }) {
  return (
    <label className="er-toggle" onClick={e => e.stopPropagation()}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="er-toggle-track" aria-hidden="true" />
      {label && <span className="sr-only">{label}</span>}
    </label>
  );
}

export default function EventRemindersPage({ communities, onToggleReminder, onConfigure }) {
  const visible = communities.filter(c => c.eventRemindersEnabled);

  return (
    <div className="er-page">
      <div className="page-header">
        <h1 className="page-title">Event reminders</h1>
        <p className="page-subtitle">
          Only communities with <code>communities.event_reminders_enabled = true</code> appear here.
          Toggle that flag directly in the database to show or hide a community.
        </p>
      </div>

      <div className="panel er-table-panel">
        <div className="table-wrapper">
          <table className="er-table">
            <thead>
              <tr>
                <th>Community</th>
                <th>Reminder enabled</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={3} className="table-empty">
                    No communities have event reminders enabled.
                  </td>
                </tr>
              ) : (
                visible.map(community => (
                  <tr key={community.id}>
                    <td className="er-table-community">{community.name}</td>
                    <td>
                      <ReminderToggle
                        checked={community.reminderEnabled}
                        onChange={enabled => onToggleReminder(community.id, enabled)}
                        label={`Toggle reminders for ${community.name}`}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-configure"
                        onClick={() => onConfigure(community.id)}
                      >
                        Configure
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
