import type { Game, PrivatePlayerState } from "@wargame/shared";

type SessionOverviewSummaryProps = {
  game: Game;
  privateState: PrivatePlayerState | null;
  factionLabels?: Record<string, string>;
};

function formatFactionLabel(label: string, factionLabels?: Record<string, string>) {
  return factionLabels?.[label] ?? label;
}

function formatSignedDelta(value: number) {
  return `${value >= 0 ? "+" : ""}${value}`;
}

function formatRiskShift(game: Game) {
  const riskChange = game.lastResolution?.stateChanges.find(
    (change) => change.key === "escalationRiskPercent"
  );

  if (!riskChange) {
    return `Escalation risk is currently ${game.state.derived.escalationRiskPercent}%.`;
  }

  return `Escalation risk is ${game.state.derived.escalationRiskPercent}% (${formatSignedDelta(
    riskChange.delta
  )} last turn).`;
}

function buildWhatMattersNow(game: Game) {
  const outcome = game.state.derived.outcome;
  const warnings = game.state.derived.warnings.slice(0, 2);
  const lines: string[] = [];

  if (outcome.status === "ended" && outcome.summary) {
    lines.push(outcome.summary);
  } else if (outcome.pressure.catastrophicRiskPercent >= 70) {
    lines.push("The crisis is entering a dangerous phase, so moves that raise pressure further carry much heavier costs.");
  } else if (outcome.pressure.deescalationOpportunityPercent >= 60) {
    lines.push("A credible off-ramp is available now, so restraint or quiet leverage could matter more than raw signaling.");
  } else if (outcome.pressure.decisiveOutcomePercent >= 60) {
    lines.push("The scenario is mature enough that leverage gains can now swing the overall result.");
  } else {
    lines.push("The crisis is still contestable, so incremental leverage and signaling choices will shape the next phase.");
  }

  if (warnings[0]) {
    lines.push(warnings[0]);
  }

  return lines;
}

export function SessionOverviewSummary({
  game,
  privateState,
  factionLabels
}: SessionOverviewSummaryProps) {
  const lastResolution = game.lastResolution;
  const publicChanges =
    lastResolution?.stateChanges.filter((change) => change.visibility !== "private").slice(0, 4) ??
    [];
  const privateUpdates = [
    ...(lastResolution?.privateSummaries.map((summary) => summary.summary) ?? []),
    ...((privateState?.intelligence ?? []).slice(0, 2))
  ].filter((value, index, all) => all.indexOf(value) === index);
  const whySituationChanged = [
    ...(lastResolution?.recommendationLabels ?? []).slice(0, 2),
    ...(lastResolution?.riskLabels ?? []).slice(0, 2),
    ...(lastResolution?.llmNarrative.consequenceTags ?? []).slice(0, 2)
  ].filter((value, index, all) => all.indexOf(value) === index);
  const whatMattersNow = buildWhatMattersNow(game);

  return (
    <section className="panel">
      <div className="panel__header">
        <h2>What Matters Now</h2>
        <span className="pill">
          {lastResolution ? `After turn ${lastResolution.turnNumber}` : "Opening state"}
        </span>
      </div>
      <p className="highlight">
        {lastResolution?.llmNarrative.headline ?? game.state.public.headline}
      </p>
      <ul className="list">
        {whatMattersNow.map((item) => (
          <li className="list-item" key={item}>
            {item}
          </li>
        ))}
      </ul>
      <div className="subtle-divider" />
      <div className="split">
        <div>
          <h3>Public developments</h3>
          <p>{lastResolution?.publicSummary ?? game.state.public.publicNarrative}</p>
        </div>
        <div>
          <h3>Key risk shift</h3>
          <p>{formatRiskShift(game)}</p>
        </div>
      </div>
      {publicChanges.length ? (
        <>
          <div className="subtle-divider" />
          <h3>What changed</h3>
          <ul className="list">
            {publicChanges.map((change) => (
              <li className="list-item" key={change.key}>
                {change.label}: {change.previousValue ?? "n/a"} to {change.newValue} (
                {formatSignedDelta(change.delta)})
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {privateUpdates.length ? (
        <>
          <div className="subtle-divider" />
          <h3>Private intelligence updates</h3>
          <ul className="list">
            {privateUpdates.map((update) => (
              <li className="list-item" key={update}>
                {update}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {whySituationChanged.length ? (
        <>
          <div className="subtle-divider" />
          <h3>Why the situation changed</h3>
          <div className="inline-meta">
            {whySituationChanged.map((item) => (
              <span className="pill" key={item}>
                {item}
              </span>
            ))}
          </div>
        </>
      ) : null}
      {game.state.derived.outcome.winningFactionId ? (
        <p className="muted">
          Leading public objective pressure currently favors{" "}
          {formatFactionLabel(game.state.derived.outcome.winningFactionId, factionLabels)}.
        </p>
      ) : null}
    </section>
  );
}
