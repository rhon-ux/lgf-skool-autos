import { useEffect, useState } from "react";
import {
  DEFAULT_EVENT_REMINDER_CONFIG,
  MOCK_SCHEDULED_REMINDERS,
  TEMPLATE_PLACEHOLDERS,
  configEqual,
  loadStoredConfig,
  storeConfig,
} from "./eventRemindersData";

function ReminderToggle({ checked, onChange, label }) {
  return (
    <label className="er-toggle er-toggle--labeled">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="er-toggle-track" aria-hidden="true" />
      {label && <span className="er-toggle-label">{label}</span>}
    </label>
  );
}

export default function EventReminderConfigPage({
  community,
  onBack,
  onNotify,
  onToggleEnabled,
}) {
  const [savedConfig, setSavedConfig] = useState(() =>
    loadStoredConfig(community?.id) ?? { ...DEFAULT_EVENT_REMINDER_CONFIG },
  );
  const [config, setConfig] = useState(savedConfig);
  const [reminders, setReminders] = useState(MOCK_SCHEDULED_REMINDERS);
  const [lookaheadDays, setLookaheadDays] = useState(2);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const loaded = loadStoredConfig(community?.id) ?? { ...DEFAULT_EVENT_REMINDER_CONFIG };
    setSavedConfig(loaded);
    setConfig(loaded);
  }, [community?.id]);

  const isDirty = !configEqual(config, savedConfig);

  if (!community) {
    return (
      <div className="er-page">
        <button type="button" className="page-back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Communities
        </button>
        <h1 className="page-title">Community not found</h1>
      </div>
    );
  }

  const updateConfig = (patch) => setConfig(prev => ({ ...prev, ...patch }));

  const handleSave = () => {
    storeConfig(community.id, config);
    setSavedConfig({ ...config });
    onNotify?.(`Reminder settings saved for ${community.name}`);
  };

  const handleSendTest = async () => {
    setTesting(true);
    await new Promise(r => setTimeout(r, 800));
    setTesting(false);
    onNotify?.("Test DM sent to your linked Skool member");
  };

  const handleCancelReminder = (id) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    onNotify?.("Reminder cancelled", "error");
  };

  return (
    <div className="er-page er-config-page">
      <button type="button" className="page-back" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Communities
      </button>

      <div className="page-header er-config-header">
        <div>
          <h1 className="page-title">Event reminders</h1>
          <p className="page-subtitle er-config-community-name">{community.name}</p>
        </div>
      </div>

      <div className="panel er-config-panel">
        <div className="er-config-toolbar">
          <ReminderToggle
            checked={community.reminderEnabled}
            onChange={enabled => onToggleEnabled?.(community.id, enabled)}
            label="Enabled"
          />
          <button
            type="button"
            className={`btn btn-save${isDirty ? "" : " btn-save--muted"}`}
            onClick={handleSave}
            disabled={!isDirty}
          >
            Save
          </button>
        </div>

        <p className="er-config-community-line">
          Community: <strong>{community.name}</strong>
        </p>

        <div className="form-group form-group--lg">
          <label className="form-label" htmlFor="er-message-template">
            Message template
          </label>
          <textarea
            id="er-message-template"
            className="form-input er-config-textarea"
            rows={7}
            value={config.messageTemplate}
            onChange={e => updateConfig({ messageTemplate: e.target.value })}
          />
        </div>

        <details className="er-placeholder-ref">
          <summary>Placeholder reference</summary>
          <ul className="er-placeholder-list">
            {TEMPLATE_PLACEHOLDERS.map(p => (
              <li key={p.key}>
                <code>{p.key}</code>
                <span>{p.description}</span>
              </li>
            ))}
          </ul>
        </details>

        <section className="er-config-section">
          <h2 className="er-config-section-title">Send timing</h2>
          <div className="er-config-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="er-lead-time">
                Lead time (minutes before event)
              </label>
              <input
                id="er-lead-time"
                type="number"
                min={0}
                className="form-input form-input--sm"
                value={config.leadTimeMinutes}
                onChange={e => updateConfig({ leadTimeMinutes: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="er-moved-tolerance">
                Event moved tolerance (minutes)
              </label>
              <input
                id="er-moved-tolerance"
                type="number"
                min={0}
                className="form-input form-input--sm"
                value={config.eventMovedToleranceMinutes}
                onChange={e => updateConfig({ eventMovedToleranceMinutes: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
        </section>

        <section className="er-config-section">
          <div className="er-config-section-head">
            <h2 className="er-config-section-title">Audience</h2>
            <button type="button" className="er-link-btn" onClick={() => onNotify?.("Audience preview coming soon")}>
              Preview audience
            </button>
          </div>
          <p className="er-config-note">Churned members are automatically excluded.</p>
          <div className="er-config-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="er-last-active">
                Last active days
              </label>
              <input
                id="er-last-active"
                type="number"
                min={1}
                className="form-input form-input--sm"
                value={config.lastActiveDays}
                onChange={e => updateConfig({ lastActiveDays: Number(e.target.value) || 1 })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="er-recipient-limit">
                Recipient limit (max DMs per event)
              </label>
              <input
                id="er-recipient-limit"
                type="number"
                min={1}
                className="form-input form-input--sm"
                value={config.recipientLimit}
                onChange={e => updateConfig({ recipientLimit: Number(e.target.value) || 1 })}
              />
            </div>
          </div>
        </section>
      </div>

      <div className="panel er-try-panel">
        <h2 className="panel-title">Try it out</h2>
        <p className="er-try-desc">
          Preview the saved template as a DM to your linked Skool member in this community.
        </p>
        <button
          type="button"
          className="btn btn-configure er-try-btn"
          onClick={handleSendTest}
          disabled={testing}
        >
          {testing ? "Sending…" : "Send test DM to me"}
        </button>
      </div>

      <div className="panel er-reminders-panel">
        <div className="er-reminders-head">
          <h2 className="panel-title panel-title--inline">
            Reminders
            <span className="er-reminders-sub">upcoming + last 48 h</span>
          </h2>
          <div className="er-reminders-controls">
            <input
              type="number"
              min={1}
              className="form-input form-input--sm er-lookahead-input"
              value={lookaheadDays}
              onChange={e => setLookaheadDays(Number(e.target.value) || 1)}
            />
            <span className="er-lookahead-label">days</span>
            <button
              type="button"
              className="er-link-btn er-refresh-btn"
              onClick={() => onNotify?.("Upcoming events refreshed")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Refresh upcoming events
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="er-reminders-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Send at</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reminders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="table-empty">No upcoming reminders in this window.</td>
                </tr>
              ) : (
                reminders.map(reminder => (
                  <tr key={reminder.id}>
                    <td className="er-reminders-event">{reminder.event}</td>
                    <td className="date">{reminder.sendAt}</td>
                    <td>
                      <span className="er-status-badge" data-status={reminder.status}>
                        {reminder.status}
                      </span>
                    </td>
                    <td>
                      {reminder.status === "Scheduled" && (
                        <button
                          type="button"
                          className="er-link-btn"
                          onClick={() => handleCancelReminder(reminder.id)}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="er-reminders-legend">
          <strong>Scheduled</strong> — queued to send
          <span className="er-legend-sep">·</span>
          <strong>Sent</strong> — DM delivered
          <span className="er-legend-sep">·</span>
          <strong>Skipped</strong> — not sent; hover the ⓘ for reason
        </p>
      </div>
    </div>
  );
}
