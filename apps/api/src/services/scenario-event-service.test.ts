import assert from "node:assert/strict";
import test from "node:test";
import { createColdWarMvpScenarioDefinition } from "../scenarios/cold-war-mvp.js";
import { createSuezMvpScenarioDefinition } from "../scenarios/suez-mvp.js";
import { applyScenarioEvents } from "./scenario-event-service.js";

const berlinScenario = createColdWarMvpScenarioDefinition();
const suezScenario = createSuezMvpScenarioDefinition();

test("scenario event service can trigger a Berlin airlift off-ramp chain", () => {
  const selectedOption = berlinScenario.choiceCatalog.find(
    (option) => option.id === "option-usa-airlift"
  );

  assert.ok(selectedOption);

  const result = applyScenarioEvents({
    scenario: berlinScenario,
    selectedOption,
    state: {
      roundNumber: 2,
      worldTension: 53,
      escalationRiskPercent: 46,
      visibleTracks: {
        diplomaticPressure: 57,
        militaryPosture: 41,
        globalAttention: 66
      },
      publicFlags: [
        "airlift-expanded",
        "airlift-becomes-global-symbol",
        "airlift-relief-window"
      ],
      revealedEvents: [
        "airlift-sorties-expanded",
        "berlin-airlift-symbolism-surges",
        "allied-relief-window-signaled"
      ],
      warnings: []
    }
  });

  assert.equal(result.triggeredEventIds.includes("berlin-airlift-offramp-emerges"), true);
  assert.equal(result.revealedEvents.includes("berlin-airlift-offramp-emerges"), true);
  assert.equal(result.publicFlags.includes("berlin-offramp-visible"), true);
  assert.equal(result.worldTension, 48);
  assert.equal(result.escalationRiskPercent, 40);
  assert.equal(result.visibleTracks.militaryPosture, 38);
  assert.equal(
    result.warnings.some((warning) => /narrow diplomatic off-ramp/i.test(warning)),
    true
  );
});

test("scenario event service can escalate Berlin checkpoint pressure into a faceoff", () => {
  const selectedOption = berlinScenario.choiceCatalog.find(
    (option) => option.id === "option-ussr-probe-checkpoints"
  );

  assert.ok(selectedOption);

  const result = applyScenarioEvents({
    scenario: berlinScenario,
    selectedOption,
    state: {
      roundNumber: 3,
      worldTension: 69,
      escalationRiskPercent: 64,
      visibleTracks: {
        diplomaticPressure: 68,
        militaryPosture: 61,
        globalAttention: 63
      },
      publicFlags: [
        "administrative-pressure-expanded",
        "checkpoint-probe",
        "checkpoint-crisis-hardening"
      ],
      revealedEvents: [
        "soviet-checks-expanded",
        "berlin-administrative-squeeze-hardens",
        "checkpoint-columns-mobilized"
      ],
      warnings: []
    }
  });

  assert.equal(
    result.triggeredEventIds.includes("berlin-checkpoint-faceoff-intensifies"),
    true
  );
  assert.equal(result.revealedEvents.includes("berlin-checkpoint-faceoff-intensifies"), true);
  assert.equal(result.publicFlags.includes("checkpoint-faceoff-active"), true);
  assert.equal(result.worldTension, 73);
  assert.equal(result.escalationRiskPercent, 71);
  assert.equal(result.visibleTracks.militaryPosture, 68);
  assert.equal(
    result.warnings.some((warning) => /hardening into a direct faceoff/i.test(warning)),
    true
  );
});

test("scenario event service can open a Suez ceasefire channel under mediation pressure", () => {
  const selectedOption = suezScenario.choiceCatalog.find(
    (option) => option.id === "option-egypt-superpower-mediation"
  );

  assert.ok(selectedOption);

  const result = applyScenarioEvents({
    scenario: suezScenario,
    selectedOption,
    state: {
      roundNumber: 3,
      worldTension: 61,
      escalationRiskPercent: 57,
      visibleTracks: {
        canalControl: 45,
        internationalPressure: 74,
        militaryTempo: 54
      },
      publicFlags: ["external-mediation-sought", "un-scrutiny-intensifies"],
      revealedEvents: [
        "outside-diplomatic-contact-rumored",
        "suez-un-pressure-hardens"
      ],
      warnings: []
    }
  });

  assert.equal(result.triggeredEventIds.includes("suez-ceasefire-channel-opens"), true);
  assert.equal(
    result.triggeredEventIds.includes("suez-ceasefire-pressure-converges"),
    true
  );
  assert.equal(result.publicFlags.includes("ceasefire-channel-visible"), true);
  assert.equal(result.publicFlags.includes("ceasefire-pressure-converged"), true);
  assert.equal(result.revealedEvents.includes("suez-ceasefire-channel-opens"), true);
  assert.equal(result.revealedEvents.includes("suez-ceasefire-pressure-converges"), true);
  assert.equal(result.worldTension, 47);
  assert.equal(result.escalationRiskPercent, 38);
  assert.equal(result.visibleTracks.militaryTempo, 43);
});

test("scenario event service can harden the Suez intervention window after mobilization", () => {
  const selectedOption = suezScenario.choiceCatalog.find(
    (option) => option.id === "option-coalition-airborne-plan"
  );

  assert.ok(selectedOption);

  const result = applyScenarioEvents({
    scenario: suezScenario,
    selectedOption,
    state: {
      roundNumber: 2,
      worldTension: 67,
      escalationRiskPercent: 61,
      visibleTracks: {
        canalControl: 47,
        internationalPressure: 62,
        militaryTempo: 68
      },
      publicFlags: ["airborne-plan-readied"],
      revealedEvents: ["coalition-forces-mobilizing"],
      warnings: []
    }
  });

  assert.equal(result.triggeredEventIds.includes("suez-intervention-window-hardens"), true);
  assert.equal(result.publicFlags.includes("intervention-window-hardening"), true);
  assert.equal(result.revealedEvents.includes("suez-intervention-window-hardens"), true);
  assert.equal(result.worldTension, 72);
  assert.equal(result.escalationRiskPercent, 69);
  assert.equal(result.visibleTracks.militaryTempo, 76);
});

test("scenario event service can converge Suez ceasefire pressure into a stronger off-ramp", () => {
  const selectedOption = suezScenario.choiceCatalog.find(
    (option) => option.id === "option-egypt-un-appeal"
  );

  assert.ok(selectedOption);

  const result = applyScenarioEvents({
    scenario: suezScenario,
    selectedOption,
    state: {
      roundNumber: 3,
      worldTension: 57,
      escalationRiskPercent: 54,
      visibleTracks: {
        canalControl: 43,
        internationalPressure: 82,
        militaryTempo: 53
      },
      publicFlags: ["ceasefire-channel-visible", "un-scrutiny-intensifies"],
      revealedEvents: ["suez-ceasefire-channel-opens"],
      warnings: []
    }
  });

  assert.equal(
    result.triggeredEventIds.includes("suez-ceasefire-pressure-converges"),
    true
  );
  assert.equal(result.publicFlags.includes("ceasefire-pressure-converged"), true);
  assert.equal(result.revealedEvents.includes("suez-ceasefire-pressure-converges"), true);
  assert.equal(result.worldTension, 49);
  assert.equal(result.escalationRiskPercent, 42);
  assert.equal(result.visibleTracks.militaryTempo, 46);
});
