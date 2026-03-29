import Link from "next/link";
import { notFound } from "next/navigation";
import { AdvisorChatPanel } from "../../../components/advisor-chat-panel";
import { PageHeader } from "../../../components/page-header";
import { PrivateIntelligencePanel } from "../../../components/private-intelligence-panel";
import { PublicStatePanel } from "../../../components/public-state-panel";
import { ScenarioBriefing } from "../../../components/scenario-briefing";
import { TurnHistory } from "../../../components/turn-history";
import { getGame, getScenarios, getTurnHistory } from "../../../lib/api";

export const dynamic = "force-dynamic";

type GameDetailPageProps = {
  params: Promise<{
    gameId: string;
  }>;
};

export default async function GameDetailPage({ params }: GameDetailPageProps) {
  const { gameId } = await params;
  const game = await getGame(gameId).catch(() => null);

  if (!game) {
    notFound();
  }

  const [scenarios, turnHistory] = await Promise.all([getScenarios(), getTurnHistory(gameId)]);
  const scenario = scenarios.find((item) => item.id === game.scenarioId);
  const currentHumanPlayer =
    game.players.find((player) => player.role === "human" && player.factionId === game.currentFactionId) ??
    game.players.find((player) => player.role === "human");
  const privateState = game.privatePlayerStates.find(
    (state) => state.playerId === currentHumanPlayer?.id
  ) ?? null;
  const advisorAnswer = game.advisorAnswers.at(-1) ?? null;

  return (
    <main className="page">
      <div className="section-stack">
        <PageHeader
          eyebrow="Game Detail"
          title={`${scenario?.title ?? "Scenario"} · Session overview`}
          description="This page acts like the player’s command dashboard: current scenario framing, state visibility, advisor guidance, and recent turn outcomes."
          actions={
            <Link className="button" href={`/games/${gameId}/turn`}>
              Open turn workspace
            </Link>
          }
        />
        <div className="dashboard-grid">
          <div className="section-stack">
            {scenario ? <ScenarioBriefing game={game} scenario={scenario} /> : null}
            <PublicStatePanel game={game} />
            <TurnHistory turns={turnHistory} />
          </div>
          <div className="section-stack">
            <PrivateIntelligencePanel privateState={privateState} />
            <AdvisorChatPanel answer={advisorAnswer} />
          </div>
        </div>
      </div>
    </main>
  );
}
