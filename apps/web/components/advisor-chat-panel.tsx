import type { AdvisorAnswer, ChoiceOption } from "@wargame/shared";
import { AdvisorQuestionForm } from "./advisor-question-form";

type AdvisorChatPanelProps = {
  answer: AdvisorAnswer | null;
  gameId: string;
  playerId?: string;
  factionId?: string | null;
  visibleOptions?: ChoiceOption[];
};

export function AdvisorChatPanel({
  answer,
  gameId,
  playerId,
  factionId,
  visibleOptions = []
}: AdvisorChatPanelProps) {
  const hasRecommendations = (answer?.recommendedOptionIds.length ?? 0) > 0;
  const optionById = new Map(visibleOptions.map((option) => [option.id, option]));

  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Advisor Readout</h2>
        <span className="pill">Visible-state guidance</span>
      </div>
      <p className="muted">
        Ask for a visible-state assessment of this round. The advisor can compare current legal
        options, but it does not reveal hidden information or backend-only outcomes.
      </p>
      <AdvisorQuestionForm
        factionId={factionId}
        gameId={gameId}
        playerId={playerId}
      />
      {answer ? (
        <div className="chat-list">
          <div className="chat-item">
            <strong>Short Answer</strong>
            <p>{answer.shortAnswer}</p>
          </div>
          <div className="chat-item">
            <strong>Question</strong>
            <p>{answer.question}</p>
          </div>
          <div className="chat-item">
            <strong>Advisor Summary</strong>
            <p>{answer.summary}</p>
          </div>
          {hasRecommendations ? (
            <div className="chat-item">
              <strong>Recommended visible options</strong>
              <div className="section-stack">
                {answer.recommendedOptionIds.map((optionId) => {
                  const option = optionById.get(optionId);

                  return (
                    <div className="option-card" key={optionId}>
                      <div className="panel__header">
                        <strong>{option?.title ?? optionId}</strong>
                        <span className="pill">
                          {typeof option?.metadata.presentationCategory === "string"
                            ? option.metadata.presentationCategory
                            : option?.kind?.replaceAll("_", " ") ?? "visible option"}
                        </span>
                      </div>
                      <p className="muted">{option?.summary ?? "Visible recommendation from the advisor."}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
          <div className="chat-item">
            <strong>Rationale</strong>
            <ul className="list">
              {answer.rationale.map((item) => (
                <li className="list-item" key={item}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="chat-item">
            <strong>Confidence</strong>
            <div className="inline-meta">
              <span className="pill">{answer.confidenceLabel}</span>
              <span className="pill">{answer.confidencePercent}%</span>
              <span className="pill">Band: {answer.recommendationBand}</span>
            </div>
          </div>
          <div className="chat-item">
            <strong>Risk Notes</strong>
            <ul className="list">
              {answer.riskNotes.map((item) => (
                <li className="list-item" key={item}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {answer.assumptions.length ? (
            <div className="chat-item">
              <strong>Stated assumptions</strong>
              <ul className="list">
                {answer.assumptions.map((item) => (
                  <li className="list-item" key={item}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="muted">Ask a question to get a visible-state advisory read for the current round.</p>
      )}
    </section>
  );
}
