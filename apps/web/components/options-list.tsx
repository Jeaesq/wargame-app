import type { ChoiceOption } from "@wargame/shared";

type OptionsListProps = {
  options: ChoiceOption[];
};

export function OptionsList({ options }: OptionsListProps) {
  return (
    <section className="panel">
      <div className="panel__header">
        <h2>Options List</h2>
        <span className="muted">{options.length} available choices</span>
      </div>
      <div className="section-stack">
        {options.map((option) => (
          <article className="option-card" key={option.id}>
            <div className="panel__header">
              <h3>{option.title}</h3>
              <span className="pill">{option.kind.replaceAll("_", " ")}</span>
            </div>
            <p>{option.summary}</p>
            {option.detail ? <p className="muted">{option.detail}</p> : null}
            <div className="option-card__meta">
              <span className="pill">Visibility: {option.visibility}</span>
              <span className="pill">
                Advisory: {option.recommendationPercent ?? "n/a"}%
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
