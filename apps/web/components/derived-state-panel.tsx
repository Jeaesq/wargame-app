import type { DerivedGameState } from "@wargame/shared";

type DerivedStatePanelProps = {
  derivedState: DerivedGameState;
  factionLabels?: Record<string, string>;
};

function formatLabel(label: string, factionLabels?: Record<string, string>) {
  return factionLabels?.[label] ?? label;
}

export function DerivedStatePanel({ derivedState, factionLabels }: DerivedStatePanelProps) {
  const leverage = Object.entries(derivedState.negotiationLeverage);
  const momentum = Object.entries(derivedState.factionMomentum);
  const objectiveProgress = Object.entries(derivedState.outcome.publicObjectiveProgress);
  const pressure = derivedState.outcome.pressure;

  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Derived State</h2>
        <span className="pill">
          Escalation risk {derivedState.escalationRiskPercent}%
        </span>
      </div>
      <div className="split">
        <div>
          <h3>Negotiation Leverage</h3>
          <ul className="list">
            {leverage.map(([key, value]) => (
              <li className="list-item" key={key}>
                {formatLabel(key, factionLabels)}: {value}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Faction Momentum</h3>
          <ul className="list">
            {momentum.map(([key, value]) => (
              <li className="list-item" key={key}>
                {formatLabel(key, factionLabels)}: {value}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="subtle-divider" />
      <div className="panel__header">
        <h3>Outcome Pressure</h3>
        <span className="pill">
          {derivedState.outcome.status === "ended" ? "Ended" : "In play"}
        </span>
      </div>
      <div className="stats-grid">
        <div className="kpi">
          <span className="muted">Scenario maturity</span>
          <strong>{pressure.maturityPercent}%</strong>
        </div>
        <div className="kpi">
          <span className="muted">Decisive pressure</span>
          <strong>{pressure.decisiveOutcomePercent}%</strong>
        </div>
        <div className="kpi">
          <span className="muted">De-escalation window</span>
          <strong>{pressure.deescalationOpportunityPercent}%</strong>
        </div>
        <div className="kpi">
          <span className="muted">Catastrophic risk</span>
          <strong>{pressure.catastrophicRiskPercent}%</strong>
        </div>
      </div>
      <div className="subtle-divider" />
      <h3>Public Objective Progress</h3>
      <ul className="list">
        {objectiveProgress.map(([key, value]) => (
          <li className="list-item" key={key}>
            {formatLabel(key, factionLabels)}: {value}
          </li>
        ))}
      </ul>
      {derivedState.outcome.title ? (
        <>
          <div className="subtle-divider" />
          <h3>{derivedState.outcome.title}</h3>
          <p>{derivedState.outcome.summary}</p>
        </>
      ) : null}
      <div className="subtle-divider" />
      <h3>Warnings</h3>
      <ul className="list">
        {derivedState.warnings.map((warning) => (
          <li className="list-item" key={warning}>
            {warning}
          </li>
        ))}
      </ul>
    </section>
  );
}
