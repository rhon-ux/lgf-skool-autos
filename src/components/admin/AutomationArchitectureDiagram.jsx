import { AUTOMATION_LAYERS } from "./automationArchitectureData";

function LayerArrow({ label }) {
  return (
    <div className="arch-arrow">
      <span className="arch-arrow-line" />
      <span className="arch-arrow-label">{label}</span>
    </div>
  );
}

function SkoolNode({ node }) {
  return (
    <div className="arch-node arch-node--skool">
      <p className="arch-node-title">{node.title}</p>
      <p className="arch-node-sub">{node.subtitle}</p>
      {node.arrow && <LayerArrow label={node.arrow} />}
    </div>
  );
}

function ZapNode({ node }) {
  return (
    <div className="arch-node arch-node--zapier">
      <p className="arch-node-title">{node.title}</p>
      <p className="arch-node-sub">{node.subtitle}</p>
      {node.paths && (
        <div className="arch-paths">
          {node.paths.map(path => (
            <div key={path.label} className="arch-path">
              <span className="arch-path-label">{path.label}</span>
              <span className="arch-path-steps">{path.steps.join(" → ")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BackendNode({ node }) {
  return (
    <div className={`arch-node arch-node--backend${node.id === "db" ? " arch-node--db" : ""}`}>
      <p className="arch-node-title">{node.title}</p>
      <p className="arch-node-sub">{node.subtitle}</p>
      {node.metrics && (
        <div className="arch-metrics">
          {node.metrics.map(m => (
            <span key={m} className="arch-metric-tag">{m}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AutomationArchitectureDiagram() {
  return (
    <div className="arch-diagram">
      {AUTOMATION_LAYERS.map((layer, layerIdx) => (
        <div key={layer.id} className="arch-layer">
          <div className="arch-layer-label" style={{ "--layer-color": layer.color }}>
            {layer.label}
          </div>
          <div className={`arch-layer-body arch-layer-body--${layer.id}`}>
            {layer.nodes.map(node => {
              if (layer.id === "skool") return <SkoolNode key={node.id} node={node} />;
              if (layer.id === "zapier") return <ZapNode key={node.id} node={node} />;
              return <BackendNode key={node.id} node={node} />;
            })}
          </div>
          {layerIdx < AUTOMATION_LAYERS.length - 1 && (
            <div className="arch-layer-connector" aria-hidden>
              <span>↓</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
