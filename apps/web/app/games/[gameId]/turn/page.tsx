import { notFound } from "next/navigation";
import { AdvisorChatPanel } from "../../../../components/advisor-chat-panel";
import { OptionsList } from "../../../../components/options-list";
import { PageHeader } from "../../../../components/page-header";
import { PrivateIntelligencePanel } from "../../../../components/private-intelligence-panel";
import { PublicStatePanel } from "../../../../components/public-state-panel";
import { TurnActionForm } from "../../../../components/turn-action-form";
import { getGame } from "../../../../lib/api";

export const dynamic = "force-dynamic";

type TurnPageProps = {
  params: Promise<{
    gameId: string;
  }>;
};

export default async function TurnPage({ params }: TurnPageProps) {
  const { gameId } = await params;
  const game = await getGame(gameId).catch(() => null);

  if (!game) {
    notFound();
  }

  const currentHumanPlayer =
    game.players.find((player) => player.role === "human" && player.factionId === game.currentFactionId) ??
    game.players.find((player) => player.role === "human");
  const privateState = game.state.privateByPlayer.find(
    (state) => state.playerId === currentHumanPlayer?.id
  ) ?? null;
  const advisorAnswer = game.advisorAnswers.at(-1) ?? null;

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
            <TurnActionForm game={game} />
            <OptionsList options={privateState?.availableOptions ?? []} />
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
