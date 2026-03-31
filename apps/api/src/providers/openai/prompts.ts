import type {
  AdvisorResponseProviderInput,
  BotDecisionProviderInput,
  TurnGenerationProviderInput
} from "../types.js";

type PromptTemplate = {
  instructions: string;
  prompt: string;
};

function buildPacingGuidance(targetGameLength: "short" | "medium" | "long") {
  return {
    targetGameLength,
    guidance:
      targetGameLength === "short"
        ? "Treat pacing as a cue to create decisive movement soon, while staying faithful to the supplied evidence."
        : targetGameLength === "long"
          ? "Treat pacing as a cue to preserve realism, second-order consequences, and room for later turns."
          : "Treat pacing as a cue to balance momentum and restraint without forcing an abrupt end state."
  };
}

function buildScenarioToneLabel(input: {
  title: string;
  historicalFrame: string;
}) {
  return `${input.title} (${input.historicalFrame})`;
}

function buildStructuredPrompt(payload: Record<string, unknown>): string {
  return JSON.stringify(payload, null, 2);
}

function toVisibleOptionSnapshot(option: {
  id: string;
  title: string;
  summary: string;
  detail?: string;
  kind: string;
  recommendationPercent: number | null;
  consequenceHints: string[];
  requirementTags: string[];
  metadata?: Record<string, unknown>;
}) {
  return {
    id: option.id,
    title: option.title,
    summary: option.summary,
    detail: option.detail,
    kind: option.kind,
    category:
      typeof option.metadata?.presentationCategory === "string"
        ? option.metadata.presentationCategory
        : option.kind,
    recommendationPercent: option.recommendationPercent,
    consequenceHints: option.consequenceHints,
    requirementTags: option.requirementTags
  };
}

function buildNarrativeQualityRules(input: {
  title: string;
  historicalFrame: string;
}) {
  return [
    `Preserve realism, plausible statecraft, and period-appropriate restraint for ${buildScenarioToneLabel(input)}.`,
    "Prefer concrete consequences, motives, and tradeoffs over generic filler.",
    "Avoid vague stock phrases unless they are tied to a supplied fact.",
    "Do not describe backend-owned outcomes as uncertain when they are already provided deterministically."
  ];
}

export function buildOpenAITurnGenerationPrompt(
  input: TurnGenerationProviderInput
): PromptTemplate {
  const actingFaction =
    input.scenario.factions.find((faction) => faction.id === input.action.factionId) ?? null;

  return {
    instructions:
      "You are generating structured turn-resolution narration for a historical geopolitical crisis simulation. The backend already decided the canonical action, legal moves, turn order, and deterministic state deltas. Use the prompt as bounded evidence, never as a request to invent mechanics. Return only JSON matching the requested schema.",
    prompt: buildStructuredPrompt({
      task: "Generate turn narration artifacts only.",
      scenario: {
        id: input.scenario.id,
        title: input.scenario.title,
        historicalFrame: input.scenario.historicalFrame,
        publicObjectives: input.scenario.objectives
          .filter((objective) => objective.visibility === "public")
          .map((objective) => ({
            factionId: objective.factionId,
            title: objective.title,
            summary: objective.summary
          })),
        actingFaction: actingFaction
          ? {
              id: actingFaction.id,
              name: actingFaction.name,
              doctrineSummary: actingFaction.doctrineSummary
            }
          : null
      },
      pacingGuidance: buildPacingGuidance(input.targetGameLength),
      turn: {
        currentTurnNumber: input.game.turnNumber,
        nextTurnNumber: input.nextTurnNumber
      },
      publicState: {
        headline: input.publicView.state.public.headline,
        publicNarrative: input.publicView.state.public.publicNarrative,
        worldTension: input.publicView.state.public.worldTension,
        nextWorldTension: input.nextWorldTension,
        visibleTracks: input.publicView.state.public.visibleTracks,
        publicFlags: input.publicView.state.public.publicFlags,
        revealedEvents: input.publicView.state.public.revealedEvents,
        outcomePressure: input.publicView.state.derived.outcome.pressure,
        publicObjectiveProgress: input.publicView.state.derived.outcome.publicObjectiveProgress
      },
      authorizedPrivateContext: {
        playerId: input.actingPlayer.id,
        playerName: input.actingPlayer.name,
        factionId: input.actingFactionView.state.privateByPlayer[0]?.factionId ?? input.actingPrivateState.factionId,
        privateBriefing:
          input.actingFactionView.state.privateByPlayer[0]?.privateBriefing ??
          input.actingPrivateState.privateBriefing,
        intelligence:
          input.actingFactionView.state.privateByPlayer[0]?.intelligence ??
          input.actingPrivateState.intelligence,
        secretFlags:
          input.actingFactionView.state.privateByPlayer[0]?.secretFlags ??
          input.actingPrivateState.secretFlags
      },
      selectedAction: {
        optionId: input.selectedOption.id,
        title: input.selectedOption.title,
        summary: input.selectedOption.summary,
        kind: input.selectedOption.kind,
        recommendationPercent: input.selectedOption.recommendationPercent,
        declaredIntent: input.action.declaredIntent ?? null,
        consequenceHints: input.selectedOption.consequenceHints,
        requirementTags: input.selectedOption.requirementTags
      },
      deterministicOutcome: {
        tensionDelta: input.tensionDelta,
        nextFactionId: input.nextFactionId,
        nextWorldTension: input.nextWorldTension,
        outcomeStatus: input.game.state.derived.outcome.status
      },
      nextTurnContext: {
        nextFactionId: input.nextFactionId,
        visibleNextOptions: input.nextOptions.map((candidate) => ({
          id: candidate.id,
          title: candidate.title,
          summary: candidate.summary,
          detail: candidate.detail ?? null,
          kind: candidate.kind,
          category:
            typeof candidate.metadata.presentationCategory === "string"
              ? candidate.metadata.presentationCategory
              : candidate.kind,
          recommendationPercent: candidate.recommendationPercent,
          consequenceHints: candidate.consequenceHints,
          visibleTrackDeltas: candidate.effectProfile.visibleTrackDeltas,
          worldTensionDelta: candidate.effectProfile.worldTensionDelta,
          escalationRiskDelta: candidate.effectProfile.escalationRiskDelta
        }))
      },
      outputRequirements: {
        publicSummary:
          "1-2 specific sentences on what happened publicly and why it matters next.",
        privateSummaries:
          "Zero or more concise summaries only for the authorized acting faction or acting player. Do not fabricate other factions' private intelligence.",
        effects:
          "Short gameplay-usable labels grounded in the supplied action and deterministic outcome.",
        recommendationLabels:
          "Short tags that characterize the move's posture or usefulness, not generic praise.",
        riskLabels:
          "Short tags naming concrete risks such as escalation, exposure, or diplomatic backlash.",
        recommendedNextOptionIds:
          "Only option ids from visibleNextOptions. Use an empty array if none stand out from the supplied evidence.",
        recommendedOptionNotes:
          "Zero to three concise notes keyed to option ids from visibleNextOptions. Explain why an option is strong or weak in this exact state, using concrete tradeoffs rather than generic praise.",
        worldUpdateSuggestions:
          "Advisory narrative suggestions only. They do not override backend state.",
        llmNarrative:
          "Headline and summaries should sound plausible for the scenario, not sensational or filler-heavy."
      },
      rules: [
        "Use only the supplied state, action, and deterministic outcome context.",
        "Treat authorizedPrivateContext as visible only to the acting faction. Do not leak or invent private facts for other factions.",
        "Distinguish direct facts from interpretation. Direct facts should be stated plainly; interpretations should stay cautious and compatible with the prompt.",
        "Respect targetGameLength as pacing guidance, not as a promise about how many turns remain.",
        "recommendedNextOptionIds must only contain ids from visibleNextOptions.",
        "recommendedOptionNotes must only reference ids from visibleNextOptions and should reward category variety where the supplied options support it.",
        "When visibleNextOptions span multiple strategic categories, favor concise comparisons that make those categories feel meaningfully different.",
        "worldUpdateSuggestions are advisory proposals only and must not assume they automatically become canonical state.",
        ...buildNarrativeQualityRules({
          title: input.scenario.title,
          historicalFrame: input.scenario.historicalFrame
        })
      ]
    })
  };
}

export function buildOpenAIAdvisorPrompt(
  input: AdvisorResponseProviderInput
): PromptTemplate {
  const visibleOptions = input.context.visibleOptions.map((option) =>
    toVisibleOptionSnapshot(option)
  );
  const faction =
    input.scenario.factions.find((candidate) => candidate.id === input.context.factionId) ?? null;

  return {
    instructions:
      "You are an advisor for a historical geopolitical crisis simulation. Answer only from player-visible information supplied in the prompt. The backend is the source of truth for what is visible, legal, and already known. Do not infer hidden intelligence, secret state, unseen future moves, or backend-only rules outcomes. Return only JSON matching the requested schema.",
    prompt: buildStructuredPrompt({
      task: "Answer a player question from visible state only.",
      scenario: {
        id: input.scenario.id,
        title: input.scenario.title,
        historicalFrame: input.scenario.historicalFrame,
        publicObjectives: input.scenario.objectives
          .filter((objective) => objective.visibility === "public")
          .map((objective) => ({
            factionId: objective.factionId,
            title: objective.title,
            summary: objective.summary
          })),
        playerPerspective: faction
          ? {
              factionId: faction.id,
              factionName: faction.name,
              doctrineSummary: faction.doctrineSummary
            }
          : {
              factionId: input.context.factionId,
              factionName: null,
              doctrineSummary: null
            }
      },
      pacingGuidance: buildPacingGuidance(input.targetGameLength),
      question: input.question,
      visibleState: {
        turnNumber: input.context.turnNumber,
        factionId: input.context.factionId,
        likelyOpponentFactionId: input.context.likelyOpponentFactionId,
        publicState: input.context.publicState,
        visibleOutcome: input.context.visibleOutcome,
        privateBriefing: input.context.privateBriefing,
        visibleIntelligence: input.context.visibleIntelligence,
        strategicAssessment: input.context.strategicAssessment,
        likelyOpponentAssessment: input.context.likelyOpponentAssessment,
        visibleOptions,
        visibleOptionIds: visibleOptions.map((option) => option.id),
        visibleWarnings: input.context.visibleWarnings,
        lastAdvisorAnswer: input.context.lastAdvisorAnswer
          ? {
              summary: input.context.lastAdvisorAnswer.summary,
              shortAnswer: input.context.lastAdvisorAnswer.shortAnswer,
              recommendationBand: input.context.lastAdvisorAnswer.recommendationBand,
              confidenceLabel: input.context.lastAdvisorAnswer.confidenceLabel,
              recommendedOptionIds:
                input.context.lastAdvisorAnswer.recommendedOptionIds
            }
          : null
      },
      answerRequirements: {
        summary:
          "2-3 specific sentences. Keep it practical, grounded, and free of generic filler.",
        shortAnswer:
          "1 direct sentence answering the question in plain language.",
        rationale:
          "2-4 concise points. Prefer direct visible facts first, then cautious interpretation if needed.",
        recommendationBand:
          "Use high, medium, low, or uncertain based on visible evidence quality and usefulness.",
        recommendedOptionIds:
          "Only option ids from visibleOptionIds. Use an empty array if no visible option deserves recommendation.",
        riskNotes:
          "Name concrete visible downsides, tradeoffs, or uncertainties.",
        assumptions:
          "Use this only for cautious inference, missing information, or stated unknowns. Do not repeat known facts here.",
        confidencePercent:
          "Estimate confidence from visible evidence quality, not from certainty about hidden state."
      },
      rules: [
        "Use only the supplied visibleState and question.",
        "Faction-visible private briefing and intelligence in visibleState are allowed evidence because they are already scoped to the requesting player.",
        "likelyOpponentAssessment is a backend-supplied visible inference based on public state and scenario framing. You may use it, but do not invent extra hidden motives beyond it.",
        "Distinguish known facts from inference. Put known visible facts in rationale; put cautious inference or uncertainty in assumptions.",
        "Do not mention hidden information, secret intentions, or unseen future options.",
        "Treat targetGameLength as pacing guidance, not as a strict turn cap or guaranteed ending.",
        "Recommendation percentages are advisory, not certain.",
        "Keep recommendations actionable and tied to visible options or visible constraints.",
        "Use recommendedOptionIds only for option ids that appear in visibleOptionIds.",
        "If visibility is insufficient, say so plainly, reduce confidence, and avoid overclaiming.",
        ...buildNarrativeQualityRules({
          title: input.scenario.title,
          historicalFrame: input.scenario.historicalFrame
        })
      ]
    })
  };
}

export function buildOpenAIBotDecisionPrompt(
  input: BotDecisionProviderInput
): {
  instructions: string;
  prompt: string;
} {
  return {
    instructions:
      "You are selecting one legal bot action for the current faction in a historical geopolitical crisis simulation. The backend remains the source of truth and supplied all valid choices. Return only JSON matching the requested schema.",
    prompt: JSON.stringify(
      {
        task: "Select a single legal option for the bot faction.",
        scenario: {
          id: input.scenario.id,
          title: input.scenario.title
        },
        factionId: input.factionId,
        publicState: input.publicState,
        visibleOptions: input.visibleOptions,
        rules: [
          "Choose exactly one of the provided option ids.",
          "Do not invent new actions.",
          "Provide a concise rationale."
        ]
      },
      null,
      2
    )
  };
}
