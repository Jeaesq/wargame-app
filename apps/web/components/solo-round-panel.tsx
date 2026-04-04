import type { Game } from "@wargame/shared";

type SoloRoundPanelProps = {
  game: Game;
  context?: "overview" | "turn";
  factionLabels?: Record<string, string>;
};

function formatFactionLabel(label: string | null, factionLabels?: Record<string, string>) {
  if (!label) {
    return "Unassigned";
  }

  return factionLabels?.[label] ?? label;
}

function buildRoundSummary(input: {
  game: Game;
  context: "overview" | "turn";
  factionLabels?: Record<string, string>;
}) {
  const { game, context, factionLabels } = input;
  const pressure = game.state.derived.outcome.pressure;

  if (game.state.derived.outcome.status === "ended") {
    return game.state.derived.outcome.summary ?? "This session has reached a resolved ending.";
  }

  if (game.mode === "solo" && game.progression.model === "solo_round") {
    const activeFactionLabel = formatFactionLabel(game.currentFactionId, factionLabels);

    if (context === "turn") {
      return `You are choosing the player step of Round ${game.progression.currentRound}. After you submit, the AI follow-up will resolve the opposing move before Round ${game.progression.currentRound + 1} begins. Active visible faction: ${activeFactionLabel}.`;
    }

    if (pressure.deescalationOpportunityPercent >= 65) {
      return `Round ${game.progression.currentRound} is live, and a visible off-ramp is open if this exchange stays disciplined.`;
    }

    if (pressure.catastrophicRiskPercent >= 70) {
      return `Round ${game.progression.currentRound} is entering a dangerous exchange where both your move and the AI reply could harden the ending.`;
    }

    return `Round ${game.progression.currentRound} is in progress, with each visible turn representing one player action plus one AI response.`;
  }

  return `Turn ${game.turnNumber} is active for ${formatFactionLabel(game.currentFactionId, factionLabels)}.`;
}

function buildPressureCallout(game: Game) {
  const pressure = game.state.derived.outcome.pressure;

  if (pressure.catastrophicRiskPercent >= 75) {
    return "Catastrophic pressure is the main visible concern right now.";
  }

  if (pressure.deescalationOpportunityPercent >= 65) {
    return "A visible de-escalation window is currently worth protecting.";
  }

  if (pressure.decisiveOutcomePercent >= 60) {
    return "The crisis is mature enough that the next exchange can visibly swing the result.";
  }

  return "The crisis is still contestable, so this round should build leverage without losing control.";
}

export function SoloRoundPanel({
  game,
  context = "overview",
  factionLabels
}: SoloRoundPanelProps) {
  const isSoloRound = game.mode === "solo" && game.progression.model === "solo_round";
  const pressure = game.state.derived.outcome.pressure;
  const lastResolution = game.lastResolution;

  return (
    <section className="panel solo-round-panel">
      <div className="panel__header">
        <h2>{isSoloRound ? "Round Status" : "Turn Status"}</h2>
        <span className="pill">
          {game.state.derived.outcome.status === "ended" ? "Resolved" : "Active"}
        </span>
      </div>
      <p className="highlight">{buildRoundSummary({ game, context, factionLabels })}</p>
      <div className="inline-meta">
        <span className="pill">Mode: {game.mode.replaceAll("_", " ")}</span>
        <span className="pill">
          {isSoloRound ? `Round ${game.progression.currentRound}` : `Turn ${game.turnNumber}`}
        </span>
        <span className="pill">Target length: {game.sessionConfig.targetGameLength}</span>
        <span className="pill">
          Active faction: {formatFactionLabel(game.currentFactionId, factionLabels)}
        </span>
      </div>
      <div className="stats-grid">
        <div className="kpi">
          <span className="muted">Completed rounds</span>
          <strong>{game.progression.completedRoundCount}</strong>
        </div>
        <div className="kpi">
          <span className="muted">Scenario maturity</span>
          <strong>{pressure.maturityPercent}%</strong>
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
      <div className="split">
        <div>
          <h3>What This Exchange Means</h3>
          <p>{buildPressureCallout(game)}</p>
        </div>
        <div>
          <h3>Latest visible exchange</h3>
          <p>
            {lastResolution
              ? `${lastResolution.actor.playerRole === "ai" ? "AI follow-up" : "Player action"}: ${lastResolution.selectedAction.title}. ${lastResolution.publicSummary}`
              : "No resolved exchange has been recorded yet in this session."}
          </p>
        </div>
      </div>
    </section>
  );
}
