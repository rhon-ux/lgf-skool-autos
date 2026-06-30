import { useEffect, useRef } from "react";
import { ZAPIER_EVENTS, PAYLOAD_PREVIEW } from "./constants";
import { ZAPIER_PATH_SETUP_STEPS, ZAPIER_ZAP1 } from "./zapierWorkflowData";
import { ZAPIER_API_ENDPOINTS, supabaseRpcUrl } from "./automationArchitectureData";
import ZapierWorkflowDiagram from "./ZapierWorkflowDiagram";
import AutomationArchitectureDiagram from "./AutomationArchitectureDiagram";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";

export default function ZapierPage({
  zapWebhook,
  onWebhookChange,
  zapEvents,
  onEventsChange,
  zapLog,
  onClearLog,
  zapSaved,
  onSaveWebhook,
  zapTesting,
  onTestWebhook,
}) {
  const logEndRef = useRef(null);

  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [zapLog]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Zapier Integration</h1>
        <p className="page-subtitle">Skool → Zapier → Supabase → Dashboard (full automation build)</p>
      </div>

      <div className="panel zap-workflow-panel">
        <h3 className="panel-title panel-title--sm">Automation architecture</h3>
        <p className="panel-desc">Your build — CSV + Skool webhook in, Skool DMs out, database as source of truth.</p>
        <AutomationArchitectureDiagram />
      </div>

      <div className="panel zap-workflow-panel">
        <h3 className="panel-title panel-title--sm">{ZAPIER_ZAP1.title}</h3>
        <ol className="guide-list">
          {ZAPIER_ZAP1.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="panel zap-workflow-panel">
        <h3 className="panel-title panel-title--sm">Zap 2 — Paths workflow</h3>
        <p className="panel-desc">
          Match this layout in Zapier — same as <strong>Webhook → Paths → Skool Send DM</strong>.
          All messages go through the Skool platform.
        </p>
        <ZapierWorkflowDiagram />
      </div>

      <div className="zapier-grid">
        <div className="panel">
          <h3 className="panel-title panel-title--sm">Webhook URL</h3>
          <p className="panel-desc">Get this from your Zapier trigger step (Catch Hook)</p>
          <input
            type="url"
            className="form-input form-input--sm"
            value={zapWebhook}
            onChange={e => onWebhookChange(e.target.value)}
            placeholder="https://hooks.zapier.com/hooks/catch/..."
          />
          <div className="zapier-actions">
            <button type="button" className="btn btn-primary btn-primary--xs" onClick={onSaveWebhook}>
              {zapSaved ? "✓ Saved" : "Save webhook"}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-secondary--xs"
              onClick={onTestWebhook}
              disabled={!zapWebhook || zapTesting}
            >
              {zapTesting ? "Sending..." : "Test webhook"}
            </button>
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-title panel-title--sm">Events to trigger</h3>
          <div className="event-list">
            {ZAPIER_EVENTS.map(ev => (
              <label key={ev.id} className="event-item">
                <input
                  type="checkbox"
                  checked={zapEvents.includes(ev.id)}
                  onChange={e => onEventsChange(ev.id, e.target.checked)}
                />
                <div>
                  <p className="event-label">{ev.label}</p>
                  <p className="event-desc">{ev.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="panel panel--mb-sm">
        <h3 className="panel-title panel-title--sm">Backend API (Supabase RPC for Zapier)</h3>
        <p className="panel-desc">
          Set <code>zapier_api_key</code> in Supabase <code>app_settings</code> table. Zapier POSTs to these endpoints.
        </p>
        <div className="zap-api-list">
          {ZAPIER_API_ENDPOINTS.map(ep => (
            <details key={ep.name} className="zap-api-item">
              <summary>
                <span className="zap-api-method">{ep.method}</span>
                {ep.name}
              </summary>
              <p className="zap-api-desc">{ep.desc}</p>
              <p className="zap-api-url">{supabaseRpcUrl(supabaseUrl, ep.path)}</p>
              <pre className="code-block code-block--sm">{JSON.stringify(ep.body, null, 2)}</pre>
            </details>
          ))}
        </div>
      </div>

      <div className="panel panel--mb-sm">
        <h3 className="panel-title panel-title--sm">Webhook payload structure</h3>
        <pre className="code-block">{PAYLOAD_PREVIEW}</pre>
      </div>

      <div className="panel">
        <div className="log-header">
          <h3 className="panel-title panel-title--inline">Webhook log</h3>
          <button type="button" className="btn-text" onClick={onClearLog}>Clear</button>
        </div>
        <div className="log-container">
          {zapLog.length === 0 && (
            <p className="log-empty">No webhook events yet. Try adding or updating a member.</p>
          )}
          {zapLog.map((entry, i) => (
            <div key={i} className="log-entry">
              <span className="log-time">{entry.time}</span>
              <span className={`log-status log-status--${entry.status === "sent" ? "sent" : entry.status === "error" ? "error" : "pending"}`}>
                {entry.status === "sent" ? "SENT" : entry.status === "error" ? "ERR" : "..."}
              </span>
              <span className="log-event">{entry.event}</span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

      <div className="guide-panel">
        <h3 className="guide-title">Step-by-step (copy into Zapier)</h3>
        <ol className="guide-list">
          {ZAPIER_PATH_SETUP_STEPS.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        <p className="guide-note">
          Path A handles FB group transfer batches from <strong>FB Transfer</strong>.
          Path B handles welcome DMs when you add a member in <strong>Members</strong>.
        </p>
      </div>
    </div>
  );
}
