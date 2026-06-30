import { useMemo, useState } from "react";
import {
  DEFAULT_FB_TRANSFER_CONFIG,
  DEFAULT_ZAPIER_BATCH_PAYLOAD,
  MOCK_SEND_LOG,
  SKOOL_COMMUNITY_NAME,
  SKOOL_COMMUNITY_URL,
  buildBatchMembers,
  buildZapierBatchPayload,
  getTransferStats,
  loadTransferConfig,
  membersToBatchRows,
  resetDailyCountIfNeeded,
  storeTransferConfig,
} from "./fbTransferData";
import ZapierWorkflowDiagram from "./ZapierWorkflowDiagram";

export default function FbGroupTransferPage({
  members = [],
  zapWebhook,
  zapSaved,
  onSaveWebhook,
  onWebhookChange,
  onSendBatch,
  onNotify,
}) {
  const [config, setConfig] = useState(() => {
    const loaded = loadTransferConfig() ?? { ...DEFAULT_FB_TRANSFER_CONFIG };
    return resetDailyCountIfNeeded(loaded);
  });
  const [sending, setSending] = useState(false);
  const [sendLog, setSendLog] = useState(MOCK_SEND_LOG);

  const stats = useMemo(() => getTransferStats(config, members), [config, members]);
  const nextBatch = useMemo(() => {
    const fromDb = membersToBatchRows(members, stats.nextBatchSize);
    if (fromDb.length > 0) return fromDb.slice(0, 25);
    return buildBatchMembers(Math.min(stats.nextBatchSize, 25), config.sentCount);
  }, [members, config.sentCount, stats.nextBatchSize]);

  const updateConfig = (patch) => {
    setConfig(prev => {
      const next = resetDailyCountIfNeeded({ ...prev, ...patch });
      storeTransferConfig(next);
      return next;
    });
  };

  const handleSendBatch = async () => {
    if (!config.fbGroupUrl.trim()) {
      onNotify?.("Add your Facebook group URL first", "error");
      return;
    }
    if (!zapWebhook) {
      onNotify?.("Connect your Zapier webhook first (Zapier page)", "error");
      return;
    }
    if (stats.nextBatchSize === 0) {
      onNotify?.("Daily limit reached or campaign complete", "error");
      return;
    }

    setSending(true);
    const batchMembers = membersToBatchRows(members, stats.nextBatchSize).length > 0
      ? membersToBatchRows(members, stats.nextBatchSize)
      : buildBatchMembers(stats.nextBatchSize, config.sentCount);
    const payload = buildZapierBatchPayload(config, batchMembers);

    try {
      await onSendBatch?.(payload);
      const next = {
        ...config,
        sentCount: config.sentCount + stats.nextBatchSize,
        todaySent: config.todaySent + stats.nextBatchSize,
        lastBatchDate: new Date().toISOString().slice(0, 10),
      };
      setConfig(next);
      storeTransferConfig(next);
      setSendLog(prev => [{
        id: Date.now(),
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        count: stats.nextBatchSize,
        status: "Completed",
        zapierStatus: "Sent",
      }, ...prev]);
      onNotify?.(`Batch of ${stats.nextBatchSize} sent to Zapier`);
    } catch {
      onNotify?.("Zapier webhook failed", "error");
    }
    setSending(false);
  };

  return (
    <div className="fb-transfer-page">
      <div className="page-header page-header--row">
        <div>
          <h1 className="page-title">Facebook group transfer</h1>
          <p className="page-subtitle">
            Message Skool members via Skool DM (through Zapier) to invite them to your Facebook group — {config.dailyLimit.toLocaleString()} per day.
          </p>
        </div>
        <span className={`fb-status-badge fb-status-badge--${config.status}`}>
          {config.status === "active" ? "Campaign active" : "Paused"}
        </span>
      </div>

      <div className="stats-grid fb-stats-grid">
        <div className="stat-card" style={{ "--stat-color": "#1d9e75", "--stat-bg": "#0d2e22" }}>
          <p className="stat-label">Total members</p>
          <p className="stat-value">{stats.total.toLocaleString()}</p>
        </div>
        <div className="stat-card" style={{ "--stat-color": "#22c55e", "--stat-bg": "#0d2218" }}>
          <p className="stat-label">Sent</p>
          <p className="stat-value">{stats.sentCount.toLocaleString()}</p>
        </div>
        <div className="stat-card" style={{ "--stat-color": "#f59e0b", "--stat-bg": "#2a1f0d" }}>
          <p className="stat-label">Remaining</p>
          <p className="stat-value">{stats.remaining.toLocaleString()}</p>
        </div>
        <div className="stat-card" style={{ "--stat-color": "#94a3b8", "--stat-bg": "#1a2332" }}>
          <p className="stat-label">Est. days left</p>
          <p className="stat-value">{stats.daysLeft}</p>
        </div>
      </div>

      <div className="panel fb-progress-panel">
        <div className="fb-progress-head">
          <span>Campaign progress</span>
          <strong>{stats.progress}%</strong>
        </div>
        <div className="fb-progress-bar">
          <div className="fb-progress-fill" style={{ width: `${stats.progress}%` }} />
        </div>
        <p className="fb-progress-note">
          Today: <strong>{config.todaySent.toLocaleString()}</strong> / {config.dailyLimit.toLocaleString()} sent
          · Next batch: <strong>{stats.nextBatchSize.toLocaleString()}</strong> members
        </p>
      </div>

      <div className="fb-transfer-grid">
        <div className="panel">
          <h2 className="panel-title">Source & destination</h2>

          <div className="form-group">
            <label className="form-label">Skool community</label>
            <div className="fb-link-row">
              <span className="fb-platform-tag">Skool</span>
              <a href={SKOOL_COMMUNITY_URL} target="_blank" rel="noreferrer" className="fb-external-link">
                {SKOOL_COMMUNITY_NAME}
              </a>
            </div>
            <p className="fb-field-hint">{config.totalMembers.toLocaleString()} members to transfer</p>
          </div>

          <div className="form-group form-group--lg">
            <label className="form-label" htmlFor="fb-group-url">Facebook group URL</label>
            <input
              id="fb-group-url"
              type="url"
              className="form-input form-input--sm"
              placeholder="https://www.facebook.com/groups/your-group"
              value={config.fbGroupUrl}
              onChange={e => updateConfig({ fbGroupUrl: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="fb-daily-limit">Daily send limit</label>
            <input
              id="fb-daily-limit"
              type="number"
              min={1}
              max={5000}
              className="form-input form-input--sm fb-limit-input"
              value={config.dailyLimit}
              onChange={e => updateConfig({ dailyLimit: Number(e.target.value) || 1 })}
            />
            <p className="fb-field-hint">Recommended: 1,000/day to avoid rate limits</p>
          </div>
        </div>

        <div className="panel">
          <h2 className="panel-title">Zapier webhook</h2>
          <p className="panel-desc">Use <strong>Webhooks by Zapier → Catch Hook</strong> as the trigger.</p>

          <div className="form-group">
            <label className="form-label" htmlFor="fb-zap-webhook">Webhook URL</label>
            <input
              id="fb-zap-webhook"
              type="url"
              className="form-input form-input--sm"
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              value={zapWebhook}
              onChange={e => onWebhookChange?.(e.target.value)}
            />
          </div>

          <div className="fb-zap-actions">
            <button type="button" className="btn btn-secondary btn-secondary--xs" onClick={onSaveWebhook}>
              {zapSaved ? "Webhook saved" : "Save webhook"}
            </button>
          </div>

          <details className="fb-payload-ref">
            <summary>Zapier payload preview</summary>
            <pre className="code-block">{JSON.stringify(DEFAULT_ZAPIER_BATCH_PAYLOAD, null, 2)}</pre>
          </details>
        </div>
      </div>

      <div className="panel fb-compose-panel">
        <h2 className="panel-title">Message template</h2>
        <div className="bulk-compose-tip">
          <strong>Skool DM:</strong> Zapier sends this text through <strong>Skool → Send DM</strong> (not Facebook Messenger).
          Use <code>{"{{firstName}}"}</code> and <code>{"{{fbGroupUrl}}"}</code> — the FB link goes inside the Skool message.
        </div>
        <textarea
          className="form-input bulk-compose-textarea"
          rows={6}
          value={config.messageTemplate}
          onChange={e => updateConfig({ messageTemplate: e.target.value })}
        />
      </div>

      <div className="panel fb-queue-panel">
        <div className="fb-queue-head">
          <h2 className="panel-title panel-title--inline">
            Next batch preview
            <span className="fb-queue-sub">showing first {nextBatch.length} of {stats.nextBatchSize.toLocaleString()}</span>
          </h2>
          <button
            type="button"
            className="btn btn-configure fb-send-batch-btn"
            onClick={handleSendBatch}
            disabled={sending || stats.nextBatchSize === 0 || config.status !== "active"}
          >
            {sending ? "Sending to Zapier…" : `Send today's batch (${stats.nextBatchSize.toLocaleString()})`}
          </button>
        </div>

        <div className="table-wrapper table-wrapper--scroll">
          <table className="bulk-results-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Handle</th>
                <th>Skool ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {nextBatch.map(member => (
                <tr key={member.id}>
                  <td className="bulk-member-name">{member.name}</td>
                  <td className="table-text">{member.handle}</td>
                  <td className="table-text">{member.skoolMemberId}</td>
                  <td><span className="fb-queue-status">Queued</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title">Send history</h2>
        <div className="table-wrapper">
          <table className="bulk-results-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Members sent</th>
                <th>Status</th>
                <th>Zapier</th>
              </tr>
            </thead>
            <tbody>
              {sendLog.map(entry => (
                <tr key={entry.id}>
                  <td className="date">{entry.date}</td>
                  <td className="table-text">{entry.count.toLocaleString()}</td>
                  <td><span className="bulk-status-badge" data-status={entry.status}>{entry.status}</span></td>
                  <td className="table-text">{entry.zapierStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel zap-workflow-panel zap-workflow-panel--inline">
        <h2 className="panel-title">Your Zap uses Path A</h2>
        <p className="panel-desc">
          FB Transfer fires <code>fb_transfer.daily_batch</code> — Path A in your Zapier Paths workflow sends Skool DMs.
        </p>
        <ZapierWorkflowDiagram compact />
      </div>

      <div className="guide-panel">
        <h3 className="guide-title">Path A setup in Zapier</h3>
        <p className="guide-intro">
          Messages are sent <strong>through Skool</strong> (Skool DM). Facebook is only the invite link inside the message.
        </p>
        <ol className="guide-list">
          <li><strong>Step 1:</strong> Webhooks by Zapier → Catch Hook — paste URL from this page</li>
          <li><strong>Step 2:</strong> Paths → Split into paths</li>
          <li><strong>Path A condition:</strong> <code>event</code> exactly matches <code>fb_transfer.daily_batch</code></li>
          <li><strong>Path A action:</strong> Looping by Zapier → loop <code>data → members</code></li>
          <li><strong>Inside loop:</strong> Skool → Send DM — Message = <code>message</code>, Member = <code>email</code></li>
          <li>Connect Skool community <strong>{SKOOL_COMMUNITY_NAME}</strong></li>
          <li>Click <strong>Send today&apos;s batch</strong> here daily — max {config.dailyLimit.toLocaleString()} Skool DMs/day</li>
        </ol>
        <p className="guide-note">
          Path B (member.created welcome DM) is configured on the <strong>Zapier</strong> page in the admin.
        </p>
      </div>
    </div>
  );
}
