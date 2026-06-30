import {
  ZAPIER_WORKFLOW_TRIGGER,
  ZAPIER_WORKFLOW_PATHS,
  ZAPIER_WORKFLOW_BRANCHES,
} from "./zapierWorkflowData";

function WebhookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="4" fill="#ff4f00" />
      <path d="M8 12h8M12 8v8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PathsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="3" fill="#7c3aed" />
      <circle cx="18" cy="6" r="3" fill="#7c3aed" />
      <circle cx="12" cy="18" r="3" fill="#7c3aed" />
      <path d="M8.5 7.5L10.5 15M15.5 7.5L13.5 15M9 6h6" stroke="#7c3aed" strokeWidth="1.5" />
    </svg>
  );
}

function SkoolIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="4" fill="#1d9e75" />
      <path d="M7 9h10M7 13h6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LoopIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="4" fill="#f59e0b" />
      <path d="M8 12a4 4 0 0 1 7-2M16 12a4 4 0 0 1-7 2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function appIcon(app) {
  if (app === "Skool") return <SkoolIcon />;
  if (app === "Looping by Zapier") return <LoopIcon />;
  if (app === "Paths") return <PathsIcon />;
  return <WebhookIcon />;
}

function WorkflowStep({ step, app, event, detail, variant = "action" }) {
  return (
    <div className={`zap-flow-step zap-flow-step--${variant}`}>
      <div className="zap-flow-step-icon">{appIcon(app)}</div>
      <div className="zap-flow-step-body">
        <span className="zap-flow-step-num">{step}.</span>
        <p className="zap-flow-step-app">{app}</p>
        <p className="zap-flow-step-event">{event}</p>
        {detail && <p className="zap-flow-step-detail">{detail}</p>}
      </div>
    </div>
  );
}

function ConditionStep({ step, rules, title }) {
  return (
    <div className="zap-flow-step zap-flow-step--condition">
      <div className="zap-flow-step-icon zap-flow-step-icon--condition">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      </div>
      <div className="zap-flow-step-body">
        <span className="zap-flow-step-num">{step}.</span>
        <p className="zap-flow-step-app">Path conditions</p>
        <p className="zap-flow-step-event">{title}</p>
        <ul className="zap-flow-rules">
          {rules.map((rule, i) => (
            <li key={i}>
              <code>{rule.field}</code> {rule.operator} <code>{rule.value}</code>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function ZapierWorkflowDiagram({ compact = false }) {
  return (
    <div className={`zap-flow${compact ? " zap-flow--compact" : ""}`}>
      <div className="zap-flow-column zap-flow-column--center">
        <WorkflowStep
          step={ZAPIER_WORKFLOW_TRIGGER.step}
          app={ZAPIER_WORKFLOW_TRIGGER.app}
          event={ZAPIER_WORKFLOW_TRIGGER.event}
          detail={ZAPIER_WORKFLOW_TRIGGER.hint}
          variant="trigger"
        />
        <div className="zap-flow-connector" aria-hidden />
        <WorkflowStep
          step={ZAPIER_WORKFLOW_PATHS.step}
          app={ZAPIER_WORKFLOW_PATHS.app}
          event={ZAPIER_WORKFLOW_PATHS.event}
          variant="paths"
        />
        <div className="zap-flow-split" aria-hidden>
          <div className="zap-flow-split-line" />
          <div className="zap-flow-split-arms" />
        </div>
      </div>

      <div className="zap-flow-branches">
        {ZAPIER_WORKFLOW_BRANCHES.map(branch => (
          <div key={branch.id} className="zap-flow-branch">
            <div className="zap-flow-branch-label">{branch.label}</div>
            <p className="zap-flow-branch-title">{branch.title}</p>
            <ConditionStep
              step={branch.condition.step}
              rules={branch.condition.rules}
              title="Only continue if…"
            />
            {branch.actions.map(action => (
              <div key={action.step}>
                <div className="zap-flow-connector zap-flow-connector--short" aria-hidden />
                <WorkflowStep
                  step={action.step}
                  app={action.app}
                  event={action.event}
                  detail={action.detail}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
