import type { AdvisorAnswer } from "@wargame/shared";
import { AdvisorQuestionForm } from "./advisor-question-form";

type AdvisorChatPanelProps = {
  answer: AdvisorAnswer | null;
  gameId: string;
  playerId?: string;
  factionId?: string | null;
};

export function AdvisorChatPanel({
  answer,
  gameId,
  playerId,
  factionId
}: AdvisorChatPanelProps) {
  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Advisor Chat</h2>
        <span className="pill">Mock Q&A</span>
      </div>
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
        </div>
      ) : (
        <p className="muted">Ask a question to get a mock advisory read based on visible state.</p>
      )}
    </section>
  );
}
