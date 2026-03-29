import type { AdvisorAnswer } from "@wargame/shared";

type AdvisorChatPanelProps = {
  answer: AdvisorAnswer | null;
};

export function AdvisorChatPanel({ answer }: AdvisorChatPanelProps) {
  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Advisor Chat</h2>
        <span className="pill">Placeholder</span>
      </div>
      {answer ? (
        <div className="chat-list">
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
        <p className="muted">No advisor response is available yet.</p>
      )}
    </section>
  );
}
