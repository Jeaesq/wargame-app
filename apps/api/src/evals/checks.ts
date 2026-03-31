import {
  advisorResponsePayloadSchema,
  turnGenerationArtifactsSchema,
  type AdvisorResponsePayload,
  type TurnGenerationArtifacts
} from "@wargame/shared";
import type { AdvisorEvalFixture, TurnEvalFixture } from "./fixtures.js";

export type EvalSeverity = "error" | "warn";
export type EvalCategory = "deterministic" | "qualitative";

export type EvalFinding = {
  severity: EvalSeverity;
  category: EvalCategory;
  fixtureId: string;
  message: string;
};

export type EvalResult = {
  fixtureId: string;
  fixtureName: string;
  findings: EvalFinding[];
};

const fillerPhrases = [
  "the situation remains fluid",
  "complex situation",
  "carefully monitor",
  "multiple factors are at play",
  "everything is resolved off-screen"
];

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function combineAdvisorText(payload: AdvisorResponsePayload): string {
  return normalizeText(
    [
      payload.summary,
      payload.shortAnswer,
      ...payload.rationale,
      ...payload.riskNotes,
      ...payload.assumptions
    ].join(" ")
  );
}

function combineTurnText(payload: TurnGenerationArtifacts): string {
  return normalizeText(
    [
      payload.publicSummary,
      payload.llmNarrative.headline,
      payload.llmNarrative.publicSummary,
      ...payload.effects,
      ...payload.recommendationLabels,
      ...payload.riskLabels,
      ...payload.recommendedOptionNotes.map((note) => note.rationale),
      ...payload.privateSummaries.map((summary) => summary.summary),
      ...payload.llmNarrative.privateUpdates.map((update) => update.summary)
    ].join(" ")
  );
}

function findMatchedTerms(text: string, terms: string[]): string[] {
  return terms.filter((term) => text.includes(normalizeText(term)));
}

function createFinding(
  severity: EvalSeverity,
  category: EvalCategory,
  fixtureId: string,
  message: string
): EvalFinding {
  return {
    severity,
    category,
    fixtureId,
    message
  };
}

export function evaluateAdvisorResponse(
  fixture: AdvisorEvalFixture,
  candidate: unknown
): EvalResult {
  const findings: EvalFinding[] = [];
  const payload = advisorResponsePayloadSchema.parse(candidate);
  const combinedText = combineAdvisorText(payload);
  const allowedOptionIds = new Set(fixture.expectations.allowedOptionIds);
  const matchedForbiddenTerms = findMatchedTerms(
    combinedText,
    fixture.expectations.forbiddenTerms
  );
  const matchedTopicalTerms = findMatchedTerms(
    combinedText,
    fixture.expectations.topicalTerms
  );

  const invalidRecommendedIds = payload.recommendedOptionIds.filter(
    (optionId) => !allowedOptionIds.has(optionId)
  );

  if (invalidRecommendedIds.length > 0) {
    findings.push(
      createFinding(
        "error",
        "deterministic",
        fixture.id,
        `Recommended option ids must remain visible. Invalid ids: ${invalidRecommendedIds.join(", ")}`
      )
    );
  }

  if (
    payload.recommendedOptionIds.length >
    fixture.expectations.maxRecommendedOptionCount
  ) {
    findings.push(
      createFinding(
        "warn",
        "qualitative",
        fixture.id,
        `Recommended ${payload.recommendedOptionIds.length} options; expected no more than ${fixture.expectations.maxRecommendedOptionCount}.`
      )
    );
  }

  if (matchedForbiddenTerms.length > 0) {
    findings.push(
      createFinding(
        "error",
        "deterministic",
        fixture.id,
        `Answer references forbidden hidden-only terms: ${matchedForbiddenTerms.join(", ")}`
      )
    );
  }

  if (payload.rationale.length < 2) {
    findings.push(
      createFinding(
        "warn",
        "qualitative",
        fixture.id,
        "Advisor rationale is thin; prefer at least two concrete reasons."
      )
    );
  }

  if (payload.shortAnswer.length > 220) {
    findings.push(
      createFinding(
        "warn",
        "qualitative",
        fixture.id,
        "Advisor shortAnswer is longer than expected for a direct answer."
      )
    );
  }

  if (matchedTopicalTerms.length === 0) {
    findings.push(
      createFinding(
        "warn",
        "qualitative",
        fixture.id,
        "Advisor answer does not clearly anchor itself in scenario-specific visible terms."
      )
    );
  }

  const matchedFillerPhrases = findMatchedTerms(combinedText, fillerPhrases);

  if (matchedFillerPhrases.length > 0) {
    findings.push(
      createFinding(
        "warn",
        "qualitative",
        fixture.id,
        `Advisor answer uses generic filler: ${matchedFillerPhrases.join(", ")}`
      )
    );
  }

  if (
    payload.confidenceLabel === "high" &&
    payload.confidencePercent < 60
  ) {
    findings.push(
      createFinding(
        "warn",
        "qualitative",
        fixture.id,
        "Advisor confidenceLabel is high but confidencePercent is relatively low."
      )
    );
  }

  return {
    fixtureId: fixture.id,
    fixtureName: fixture.name,
    findings
  };
}

export function evaluateTurnArtifacts(
  fixture: TurnEvalFixture,
  candidate: unknown
): EvalResult {
  const findings: EvalFinding[] = [];
  const payload = turnGenerationArtifactsSchema.parse(candidate);
  const combinedText = combineTurnText(payload);
  const allowedNextOptionIds = new Set(fixture.expectations.allowedNextOptionIds);
  const allowedPrivateFactionIds = new Set(fixture.expectations.allowedPrivateFactionIds);
  const allowedPrivatePlayerIds = new Set(fixture.expectations.allowedPrivatePlayerIds);
  const matchedForbiddenTerms = findMatchedTerms(
    combinedText,
    fixture.expectations.forbiddenTerms
  );
  const matchedTopicalTerms = findMatchedTerms(
    combinedText,
    fixture.expectations.topicalTerms
  );

  const invalidRecommendedIds = payload.recommendedNextOptionIds.filter(
    (optionId) => !allowedNextOptionIds.has(optionId)
  );
  const invalidRecommendedNotes = payload.recommendedOptionNotes.filter(
    (note) => !allowedNextOptionIds.has(note.optionId)
  );

  if (invalidRecommendedIds.length > 0) {
    findings.push(
      createFinding(
        "error",
        "deterministic",
        fixture.id,
        `recommendedNextOptionIds must stay inside visible next options. Invalid ids: ${invalidRecommendedIds.join(", ")}`
      )
    );
  }

  if (invalidRecommendedNotes.length > 0) {
    findings.push(
      createFinding(
        "error",
        "deterministic",
        fixture.id,
        "recommendedOptionNotes must stay inside visible next options."
      )
    );
  }

  const invalidPrivateSummaries = payload.privateSummaries.filter(
    (summary) =>
      !allowedPrivateFactionIds.has(summary.factionId) ||
      (summary.playerId !== null && !allowedPrivatePlayerIds.has(summary.playerId))
  );

  if (invalidPrivateSummaries.length > 0) {
    findings.push(
      createFinding(
        "error",
        "deterministic",
        fixture.id,
        "privateSummaries include unauthorized faction or player scope."
      )
    );
  }

  const invalidPrivateUpdates = payload.llmNarrative.privateUpdates.filter(
    (update) => !allowedPrivateFactionIds.has(update.factionId)
  );

  if (invalidPrivateUpdates.length > 0) {
    findings.push(
      createFinding(
        "error",
        "deterministic",
        fixture.id,
        "llmNarrative.privateUpdates include unauthorized faction scope."
      )
    );
  }

  if (matchedForbiddenTerms.length > 0) {
    findings.push(
      createFinding(
        "error",
        "deterministic",
        fixture.id,
        `Turn artifacts reference forbidden terms: ${matchedForbiddenTerms.join(", ")}`
      )
    );
  }

  if (
    fixture.input.tensionDelta > 0 &&
    payload.worldUpdateSuggestions.some(
      (suggestion) =>
        suggestion.key === "worldTension" && suggestion.direction === "decrease"
    )
  ) {
    findings.push(
      createFinding(
        "error",
        "deterministic",
        fixture.id,
        "worldUpdateSuggestions should not decrease world tension after a positive backend tension delta."
      )
    );
  }

  if (matchedTopicalTerms.length === 0) {
    findings.push(
      createFinding(
        "warn",
        "qualitative",
        fixture.id,
        "Turn narration does not clearly reference scenario-specific terms."
      )
    );
  }

  if (payload.recommendedOptionNotes.some((note) => note.rationale.length > 220)) {
    findings.push(
      createFinding(
        "warn",
        "qualitative",
        fixture.id,
        "recommendedOptionNotes should stay concise and gameplay-usable."
      )
    );
  }

  const matchedFillerPhrases = findMatchedTerms(combinedText, fillerPhrases);

  if (matchedFillerPhrases.length > 0) {
    findings.push(
      createFinding(
        "warn",
        "qualitative",
        fixture.id,
        `Turn narration uses generic filler: ${matchedFillerPhrases.join(", ")}`
      )
    );
  }

  if (payload.publicSummary.length > 260) {
    findings.push(
      createFinding(
        "warn",
        "qualitative",
        fixture.id,
        "Turn publicSummary is longer than expected for UI-friendly narration."
      )
    );
  }

  if (
    fixture.input.tensionDelta >= 10 &&
    !payload.riskLabels.some((label) => /high|escalat/i.test(label))
  ) {
    findings.push(
      createFinding(
        "warn",
        "qualitative",
        fixture.id,
        "High-tension military signal should usually carry an explicit escalation-oriented risk label."
      )
    );
  }

  return {
    fixtureId: fixture.id,
    fixtureName: fixture.name,
    findings
  };
}
