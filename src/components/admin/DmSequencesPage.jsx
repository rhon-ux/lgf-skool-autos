import { useMemo, useState } from "react";
import { COMMUNITY_OPTIONS } from "./membersData";
import {
  cloneSequences,
  DEFAULT_DM_SEQUENCES,
  loadStoredSequences,
  MOCK_DM_LOG,
  sequencesEqual,
  storeSequences,
} from "./dmSequencesData";

function Toggle({ checked, onChange, label }) {
  return (
    <label className="dm-toggle" onClick={e => e.stopPropagation()}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="dm-toggle-track" aria-hidden="true" />
      {label && <span className="sr-only">{label}</span>}
    </label>
  );
}

function SequenceEditor({ sequence, onChange, onSave, onDiscard, isDirty }) {
  const updateStep = (stepId, field, value) => {
    onChange({
      ...sequence,
      steps: sequence.steps.map(step =>
        step.id === stepId ? { ...step, [field]: value } : step,
      ),
    });
  };

  return (
    <div className="dm-seq-editor">
      <p className="dm-seq-hints">
        Personalization: <code>{"{{firstName}}"}</code>
        <span className="dm-seq-hints-sep">·</span>
        Links: <code>[text](https://url)</code>
      </p>

      <div className="dm-seq-steps">
        {sequence.steps.map((step, index) => (
          <div key={step.id} className="dm-seq-step">
            <div className="dm-seq-step-rail">
              <span className="dm-seq-step-num">{step.id}</span>
              {index < sequence.steps.length - 1 && <span className="dm-seq-step-line" />}
            </div>
            <div className="dm-seq-step-body">
              <p className="dm-seq-step-label">
                Step {step.id}
                {step.delayDays === 0 ? (
                  <> — Sends immediately</>
                ) : (
                  <>
                    {" "}— Send after{" "}
                    <input
                      type="number"
                      min={1}
                      className="dm-seq-delay-input"
                      value={step.delayDays}
                      onChange={e => updateStep(step.id, "delayDays", Number(e.target.value) || 1)}
                    />
                    {" "}days
                  </>
                )}
              </p>
              <textarea
                className="dm-seq-message"
                rows={4}
                value={step.message}
                onChange={e => updateStep(step.id, "message", e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {isDirty && (
        <div className="dm-seq-unsaved">
          <span className="dm-seq-unsaved-label">
            <span className="dm-seq-unsaved-dot" />
            You have unsaved edits
          </span>
          <div className="dm-seq-unsaved-actions">
            <button type="button" className="btn btn-secondary btn-secondary--xs" onClick={onDiscard}>
              Discard
            </button>
            <button type="button" className="btn btn-primary btn-primary--xs" onClick={onSave}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DmSequencesPage({ onNotify }) {
  const [community, setCommunity] = useState("starter");
  const [tab, setTab] = useState("sequences");
  const [sequences, setSequences] = useState(() => loadStoredSequences() ?? cloneSequences(DEFAULT_DM_SEQUENCES));
  const [expandedId, setExpandedId] = useState(null);
  const [drafts, setDrafts] = useState({});

  const draftKey = (id) => `${community}-${id}`;

  const communitySequences = sequences[community] ?? [];

  const grouped = useMemo(() => {
    const groups = {};
    for (const seq of communitySequences) {
      if (!groups[seq.category]) groups[seq.category] = [];
      groups[seq.category].push(seq);
    }
    return groups;
  }, [communitySequences]);

  const getSaved = (id) => communitySequences.find(s => s.id === id);

  const getWorking = (id) => {
    const key = draftKey(id);
    return drafts[key] ?? getSaved(id);
  };

  const isDirty = (id) => {
    const saved = getSaved(id);
    const working = getWorking(id);
    if (!saved || !working) return false;
    return !sequencesEqual(working, saved);
  };

  const updateWorking = (id, next) => {
    setDrafts(prev => ({ ...prev, [draftKey(id)]: next }));
  };

  const saveSequence = (id) => {
    const working = getWorking(id);
    if (!working || !isDirty(id)) return;

    const nextSequences = {
      ...sequences,
      [community]: sequences[community].map(s => (s.id === id ? working : s)),
    };

    setSequences(nextSequences);
    storeSequences(nextSequences);
    setDrafts(prev => {
      const next = { ...prev };
      delete next[draftKey(id)];
      return next;
    });
    onNotify?.(`"${working.name}" saved`);
  };

  const discardSequence = (id) => {
    const saved = getSaved(id);
    if (!saved || !isDirty(id)) return;

    setDrafts(prev => {
      const next = { ...prev };
      delete next[draftKey(id)];
      return next;
    });
    onNotify?.(`Changes to "${saved.name}" discarded`, "error");
  };

  const confirmDiscard = (id) => {
    if (!isDirty(id)) return true;
    return window.confirm("Discard unsaved changes?");
  };

  const toggleExpanded = (id) => {
    if (expandedId === id) {
      if (!confirmDiscard(id)) return;
      discardSequence(id);
      setExpandedId(null);
      return;
    }

    if (expandedId && isDirty(expandedId) && !confirmDiscard(expandedId)) return;
    if (expandedId && isDirty(expandedId)) discardSequence(expandedId);

    setExpandedId(id);
  };

  const toggleEnabled = (id, enabled) => {
    const current = getWorking(id);
    if (!current) return;
    updateWorking(id, { ...current, enabled });
  };

  const handleCommunityChange = (value) => {
    if (expandedId && isDirty(expandedId) && !confirmDiscard(expandedId)) return;
    if (expandedId && isDirty(expandedId)) discardSequence(expandedId);
    setCommunity(value);
    setExpandedId(null);
  };

  const handleTabChange = (nextTab) => {
    if (expandedId && isDirty(expandedId) && !confirmDiscard(expandedId)) return;
    if (expandedId && isDirty(expandedId)) discardSequence(expandedId);
    setTab(nextTab);
    setExpandedId(null);
  };

  const communityLabel = COMMUNITY_OPTIONS.find(c => c.value === community)?.label ?? community;

  return (
    <div className="dm-seq-page">
      <div className="page-header">
        <h1 className="page-title">DM Sequences</h1>
      </div>

      <div className="dm-seq-community">
        <label className="dm-seq-community-label" htmlFor="dm-community">Community</label>
        <select
          id="dm-community"
          className="filter-select dm-seq-community-select"
          value={community}
          onChange={e => handleCommunityChange(e.target.value)}
        >
          {COMMUNITY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="dm-seq-tabs">
        <button
          type="button"
          className={`dm-seq-tab${tab === "sequences" ? " dm-seq-tab--active" : ""}`}
          onClick={() => handleTabChange("sequences")}
        >
          Sequences
        </button>
        <button
          type="button"
          className={`dm-seq-tab${tab === "log" ? " dm-seq-tab--active" : ""}`}
          onClick={() => handleTabChange("log")}
        >
          DM Log
        </button>
      </div>

      {tab === "sequences" ? (
        <div className="dm-seq-list">
          {Object.entries(grouped).map(([category, items]) => (
            <section key={category} className="dm-seq-group">
              <h2 className="dm-seq-group-title">{category}</h2>
              {items.map(seq => {
                const display = getWorking(seq.id);
                const expanded = expandedId === seq.id;
                const dirty = isDirty(seq.id);
                return (
                  <div key={seq.id} className={`dm-seq-item${expanded ? " dm-seq-item--expanded" : ""}`}>
                    <div className="dm-seq-row">
                      <button
                        type="button"
                        className="dm-seq-row-main"
                        onClick={() => toggleExpanded(seq.id)}
                      >
                        <svg
                          className={`dm-seq-chevron${expanded ? " dm-seq-chevron--open" : ""}`}
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                        <span className="dm-seq-row-title">{display.name}</span>
                        <span className="dm-seq-row-meta">· {display.steps.length} steps</span>
                        {dirty && !expanded && <span className="dm-seq-dirty-dot" title="Unsaved edits" />}
                      </button>
                      <Toggle
                        checked={display.enabled}
                        onChange={v => toggleEnabled(seq.id, v)}
                        label={`Toggle ${display.name}`}
                      />
                    </div>

                    {expanded && (
                      <div className="dm-seq-expanded">
                        <p className="dm-seq-expanded-category">{display.category}</p>
                        <SequenceEditor
                          sequence={display}
                          isDirty={dirty}
                          onChange={next => updateWorking(seq.id, next)}
                          onSave={() => saveSequence(seq.id)}
                          onDiscard={() => discardSequence(seq.id)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      ) : (
        <div className="panel table-wrapper table-wrapper--scroll">
          <table className="members-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Sequence</th>
                <th>Step</th>
                <th>Community</th>
                <th>Sent</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_DM_LOG.filter(entry => entry.community === communityLabel).length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty">No messages sent for this community yet.</td>
                </tr>
              ) : (
                MOCK_DM_LOG
                  .filter(entry => entry.community === communityLabel)
                  .map(entry => (
                    <tr key={entry.id}>
                      <td className="table-text">{entry.member}</td>
                      <td className="table-text">{entry.sequence}</td>
                      <td className="table-text">{entry.step}</td>
                      <td className="table-text">{entry.community}</td>
                      <td className="date">{entry.sentAt}</td>
                      <td>
                        <span
                          className="status-badge"
                          data-status={entry.status === "Delivered" ? "Active" : "Inactive"}
                        >
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
