import type { DerivedGameState } from "@wargame/shared";

type DerivedStatePanelProps = {
  derivedState: DerivedGameState;
  factionLabels?: Record<string, string>;
};

function formatLabel(label: string, factionLabels?: Record<string, string>) {
  return factionLabels?.[label] ?? label;
}

function buildPressureSummary(derivedState: DerivedGameState) {
  const pressure = derivedState.outcome.pressure;

  if (derivedState.outcome.status === "ended") {
    return derivedState.outcome.summary ?? "This session has already resolved.";
  }

  if (pressure.catastrophicRiskPercent >= 75) {
    return "The visible state is close to a dangerous break point, so further pressure spikes could force the ending.";
  }

  if (pressure.deescalationOpportunityPercent >= 65) {
    return "A visible off-ramp is open, and preserving it now matters more than squeezing out one more signal.";
  }

  if (pressure.decisiveOutcomePercent >= 60) {
    return "The scenario is mature enough that the next exchange can visibly change who is ahead.";
  }

  return "The situation is still contestable, with room to build leverage before the crisis hardens.";
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
      <p className="highlight">{buildPressureSummary(derivedState)}</p>
      <div className="split">
        <div>
          <h3>Negotiation Leverage</h3>
          {leverage.length ? (
            <ul className="list">
              {leverage.map(([key, value]) => (
                <li className="list-item" key={key}>
                  {formatLabel(key, factionLabels)}: {value}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No visible leverage tracks are currently active.</p>
          )}
        </div>
        <div>
          <h3>Faction Momentum</h3>
          {momentum.length ? (
            <ul className="list">
              {momentum.map(([key, value]) => (
                <li className="list-item" key={key}>
                  {formatLabel(key, factionLabels)}: {value}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No visible momentum shifts are currently active.</p>
          )}
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
      {objectiveProgress.length ? (
        <ul className="list">
          {objectiveProgress.map(([key, value]) => (
            <li className="list-item" key={key}>
              {formatLabel(key, factionLabels)}: {value}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">Objective pressure has not separated visibly yet.</p>
      )}
      {derivedState.outcome.title ? (
        <>
          <div className="subtle-divider" />
          <h3>{derivedState.outcome.title}</h3>
          <p>{derivedState.outcome.summary}</p>
        </>
      ) : null}
      <div className="subtle-divider" />
      <h3>Warnings</h3>
      {derivedState.warnings.length ? (
        <ul className="list">
          {derivedState.warnings.map((warning) => (
            <li className="list-item" key={warning}>
              {warning}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No immediate visible warnings are active.</p>
      )}
    </section>
  );
}
