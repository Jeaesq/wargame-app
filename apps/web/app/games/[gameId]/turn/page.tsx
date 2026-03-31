import Link from "next/link";
import { notFound } from "next/navigation";
import { AdvisorChatPanel } from "../../../../components/advisor-chat-panel";
import { OptionsList } from "../../../../components/options-list";
import { PageHeader } from "../../../../components/page-header";
import { PrivateIntelligencePanel } from "../../../../components/private-intelligence-panel";
import { PublicStatePanel } from "../../../../components/public-state-panel";
import { SessionAccessPanel } from "../../../../components/session-access-panel";
import { TurnActionForm } from "../../../../components/turn-action-form";
import { getGame } from "../../../../lib/api";
import {
  buildFactionViewHref,
  getFactionName,
  getSelectedPlayerView
} from "../../../../lib/session-access";

export const dynamic = "force-dynamic";

type TurnPageProps = {
  params: Promise<{
    gameId: string;
  }>;
  searchParams?: Promise<{
    factionId?: string;
    playerId?: string;
  }>;
};

export default async function TurnPage({ params, searchParams }: TurnPageProps) {
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

  const currentHumanPlayer =
    getSelectedPlayerView(game, selectedPlayerId) ??
    game.players.find((player) => player.role === "human" && player.factionId === game.currentFactionId) ??
    game.players.find((player) => player.role === "human");
  const privateState = game.state.privateByPlayer.find(
    (state) => state.playerId === currentHumanPlayer?.id
  ) ?? null;
  const advisorAnswer = game.advisorAnswers.at(-1) ?? null;
  const overviewHref = buildFactionViewHref({
    pathname: `/games/${game.id}`,
    playerId: currentHumanPlayer?.id,
    factionId: currentHumanPlayer?.factionId
  });
  const currentViewName = getFactionName(game, currentHumanPlayer?.factionId);

  return (
    <main className="page">
      <div className="section-stack">
        <PageHeader
          eyebrow="Turn View"
          title={`Turn ${game.turnNumber} decision workspace`}
          description={`A tighter operational view for reviewing public state, private intelligence, advisory guidance, and the current options list before submitting an action. Current faction view: ${currentViewName}.`}
          actions={
            <Link className="button button--secondary" href={overviewHref}>
              Back to session overview
            </Link>
          }
        />
        <div className="turn-grid">
          <div className="section-stack">
            <SessionAccessPanel
              game={game}
              pathname={`/games/${gameId}/turn`}
              selectedPlayerId={currentHumanPlayer?.id}
            />
            <TurnActionForm game={game} />
            <OptionsList options={privateState?.availableOptions ?? []} />
            <PublicStatePanel game={game} />
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
