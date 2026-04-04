import type { ChoiceOption } from "@wargame/shared";

type OptionsListProps = {
  options: ChoiceOption[];
};

export function OptionsList({ options }: OptionsListProps) {
  const topRecommendation = [...options]
    .filter((option) => option.recommendationPercent !== null)
    .sort((left, right) => (right.recommendationPercent ?? 0) - (left.recommendationPercent ?? 0))[0]
    ?.id;

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
              <div className="inline-meta">
                <span className="pill">
                  {typeof option.metadata.presentationCategory === "string"
                    ? option.metadata.presentationCategory
                    : option.kind.replaceAll("_", " ")}
                </span>
                {option.id === topRecommendation ? <span className="pill">Top visible advisory</span> : null}
              </div>
            </div>
            <p>{option.summary}</p>
            {option.detail ? <p className="muted">{option.detail}</p> : null}
            <div className="option-card__meta">
              <span className="pill">Visibility: {option.visibility}</span>
              <span className="pill">
                Advisory: {option.recommendationPercent ?? "n/a"}%
              </span>
              {option.requirementTags.length ? (
                <span className="pill">Requirements: {option.requirementTags.join(", ")}</span>
              ) : null}
            </div>
            {option.consequenceHints.length ? (
              <p className="muted">
                Visible tradeoffs: {option.consequenceHints.slice(0, 3).join(" · ")}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
