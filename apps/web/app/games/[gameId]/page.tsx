import Link from "next/link";
import { notFound } from "next/navigation";
import { AdvisorChatPanel } from "../../../components/advisor-chat-panel";
import { DerivedStatePanel } from "../../../components/derived-state-panel";
import { PageHeader } from "../../../components/page-header";
import { PrivateIntelligencePanel } from "../../../components/private-intelligence-panel";
import { PublicStatePanel } from "../../../components/public-state-panel";
import { ScenarioBriefing } from "../../../components/scenario-briefing";
import { SessionOverviewSummary } from "../../../components/session-overview-summary";
import { SessionAccessPanel } from "../../../components/session-access-panel";
import { TurnHistory } from "../../../components/turn-history";
import { getGame, getScenarios, getTurnHistory } from "../../../lib/api";
import {
  buildFactionViewHref,
  getFactionName,
  getSelectedPlayerView
} from "../../../lib/session-access";

export const dynamic = "force-dynamic";

type GameDetailPageProps = {
  params: Promise<{
    gameId: string;
  }>;
  searchParams?: Promise<{
    factionId?: string;
    playerId?: string;
  }>;
};

export default async function GameDetailPage({
  params,
  searchParams
}: GameDetailPageProps) {
  const { gameId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedPlayerId = resolvedSearchParams?.playerId ?? undefined;
  const selectedFactionId = resolvedSearchParams?.factionId ?? undefined;
  const game = await getGame(gameId, {
    playerId: selectedPlayerId,
    factionId: selectedFactionId
  }).catch(() => null);

  if (!game) {
    notFound();
  }

  const [scenarios, turnHistory] = await Promise.all([getScenarios(), getTurnHistory(gameId)]);
  const scenario = scenarios.find((item) => item.id === game.scenarioId);
  const currentHumanPlayer =
    getSelectedPlayerView(game, selectedPlayerId) ??
    game.players.find((player) => player.role === "human" && player.factionId === game.currentFactionId) ??
    game.players.find((player) => player.role === "human");
  const privateState = game.state.privateByPlayer.find(
    (state) => state.playerId === currentHumanPlayer?.id
  ) ?? null;
  const advisorAnswer = game.advisorAnswers.at(-1) ?? null;
  const turnWorkspaceHref = buildFactionViewHref({
    pathname: `/games/${gameId}/turn`,
    playerId: currentHumanPlayer?.id,
    factionId: currentHumanPlayer?.factionId
  });
  const currentViewName = getFactionName(game, currentHumanPlayer?.factionId);
  const factionLabels = Object.fromEntries(
    game.factions.map((faction) => [faction.id, faction.name])
  );

  return (
    <main className="page">
      <div className="section-stack">
        <PageHeader
          eyebrow="Game Detail"
          title={`${scenario?.title ?? "Scenario"} · Session overview`}
          description={`This page acts like the player’s command dashboard: current scenario framing, state visibility, advisor guidance, and recent turn outcomes. Current faction view: ${currentViewName}.`}
          actions={
            <Link className="button" href={turnWorkspaceHref}>
              Open turn workspace
            </Link>
          }
        />
        <div className="dashboard-grid">
          <div className="section-stack">
            <section className="section-stack current-state-section">
              <div className="section-label">Current State</div>
              <SessionAccessPanel
                game={game}
                pathname={`/games/${gameId}`}
                selectedPlayerId={currentHumanPlayer?.id}
              />
              <section className="panel">
                <div className="panel__header">
                  <h2>Session Settings</h2>
                </div>
                <div className="inline-meta">
                  <span className="pill">Mode: {game.mode}</span>
                  <span className="pill">
                    Target length: {game.sessionConfig.targetGameLength}
                  </span>
                </div>
              </section>
              {scenario ? <ScenarioBriefing game={game} scenario={scenario} /> : null}
              <SessionOverviewSummary
                game={game}
                privateState={privateState}
                factionLabels={factionLabels}
              />
              <PublicStatePanel game={game} />
              <DerivedStatePanel
                derivedState={game.state.derived}
                factionLabels={factionLabels}
              />
            </section>
            <section className="section-stack history-section">
              <div className="section-label">Historical Turns</div>
              <TurnHistory turns={turnHistory} />
            </section>
          </div>
          <div className="section-stack">
            <PrivateIntelligencePanel
              privateState={privateState}
              lastResolution={game.lastResolution}
            />
            <AdvisorChatPanel
              answer={advisorAnswer}
              factionId={currentHumanPlayer?.factionId ?? null}
              gameId={game.id}
              playerId={currentHumanPlayer?.id}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
