import { notFound } from "next/navigation";
import { AdvisorChatPanel } from "../../../../components/advisor-chat-panel";
import { OptionsList } from "../../../../components/options-list";
import { PageHeader } from "../../../../components/page-header";
import { PrivateIntelligencePanel } from "../../../../components/private-intelligence-panel";
import { PublicStatePanel } from "../../../../components/public-state-panel";
import {
  getMockAdvisorAnswer,
  getMockGameById,
  getPrivateStateForPlayer
} from "../../../../lib/mock-data";

type TurnPageProps = {
  params: Promise<{
    gameId: string;
  }>;
};

export default async function TurnPage({ params }: TurnPageProps) {
  const { gameId } = await params;
  const game = getMockGameById(gameId);

  if (!game) {
    notFound();
  }

  const privateState = getPrivateStateForPlayer(gameId);
  const advisorAnswer = getMockAdvisorAnswer(gameId);

  return (
    <main className="page">
      <div className="section-stack">
        <PageHeader
          eyebrow="Turn View"
          title={`Turn ${game.turnNumber} decision workspace`}
          description="A tighter operational view for reviewing public state, private intelligence, advisory guidance, and the current options list before submitting an action."
        />
        <div className="turn-grid">
          <div className="section-stack">
            <OptionsList options={game.availableOptions} />
            <PublicStatePanel game={game} />
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
