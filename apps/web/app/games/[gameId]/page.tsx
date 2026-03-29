import Link from "next/link";
import { notFound } from "next/navigation";
import { AdvisorChatPanel } from "../../../components/advisor-chat-panel";
import { PageHeader } from "../../../components/page-header";
import { PrivateIntelligencePanel } from "../../../components/private-intelligence-panel";
import { PublicStatePanel } from "../../../components/public-state-panel";
import { ScenarioBriefing } from "../../../components/scenario-briefing";
import { TurnHistory } from "../../../components/turn-history";
import {
  getMockAdvisorAnswer,
  getMockGameById,
  getMockTurnHistory,
  getPrivateStateForPlayer,
  mockScenario
} from "../../../lib/mock-data";

type GameDetailPageProps = {
  params: Promise<{
    gameId: string;
  }>;
};

export default async function GameDetailPage({ params }: GameDetailPageProps) {
  const { gameId } = await params;
  const game = getMockGameById(gameId);

  if (!game) {
    notFound();
  }

  const privateState = getPrivateStateForPlayer(gameId);
  const advisorAnswer = getMockAdvisorAnswer(gameId);
  const turnHistory = getMockTurnHistory(gameId);

  return (
    <main className="page">
      <div className="section-stack">
        <PageHeader
          eyebrow="Game Detail"
          title={`${mockScenario.title} · Session overview`}
          description="This page acts like the player’s command dashboard: current scenario framing, state visibility, advisor guidance, and recent turn outcomes."
          actions={
            <Link className="button" href={`/games/${gameId}/turn`}>
              Open turn workspace
            </Link>
          }
        />
        <div className="dashboard-grid">
          <div className="section-stack">
            <ScenarioBriefing game={game} scenario={mockScenario} />
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
