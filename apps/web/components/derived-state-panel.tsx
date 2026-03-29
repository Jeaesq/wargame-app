import type { DerivedGameState } from "@wargame/shared";

type DerivedStatePanelProps = {
  derivedState: DerivedGameState;
};

export function DerivedStatePanel({ derivedState }: DerivedStatePanelProps) {
  const leverage = Object.entries(derivedState.negotiationLeverage);
  const momentum = Object.entries(derivedState.factionMomentum);

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
                {key}: {value}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Faction Momentum</h3>
          <ul className="list">
            {momentum.map(([key, value]) => (
              <li className="list-item" key={key}>
                {key}: {value}
              </li>
            ))}
          </ul>
        </div>
      </div>
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
