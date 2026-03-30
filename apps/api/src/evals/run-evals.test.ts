import assert from "node:assert/strict";
import test from "node:test";
import { MockAdvisorResponseProvider } from "../providers/mock/mock-advisor-response-provider.js";
import { MockTurnGenerationProvider } from "../providers/mock/mock-turn-generation-provider.js";
import {
  createAdvisorEvalFixtures,
  createImplausibleTurnCandidate,
  createLeakyAdvisorCandidate,
  createTurnEvalFixtures
} from "./fixtures.js";
import { evaluateAdvisorResponse, evaluateTurnArtifacts } from "./checks.js";

test("mock advisor provider passes deterministic advisor eval checks", async () => {
  const provider = new MockAdvisorResponseProvider();
  const fixtures = createAdvisorEvalFixtures();

  for (const fixture of fixtures) {
    const candidate = await provider.generateAdvisorResponse(fixture.input);
    const result = evaluateAdvisorResponse(fixture, candidate);
    const errors = result.findings.filter((finding) => finding.severity === "error");

    assert.equal(errors.length, 0, fixture.name);
  }
});

test("advisor eval detects visibility leaks and non-visible recommendations", () => {
  const fixture = createAdvisorEvalFixtures()[0]!;
  const result = evaluateAdvisorResponse(
    fixture,
    createLeakyAdvisorCandidate(fixture)
  );
  const messages = result.findings.map((finding) => finding.message).join(" ");

  assert.match(messages, /must remain visible/i);
  assert.match(messages, /forbidden hidden-only terms/i);
});

test("mock turn provider passes deterministic turn eval checks", async () => {
  const provider = new MockTurnGenerationProvider();
  const fixtures = createTurnEvalFixtures();

  for (const fixture of fixtures) {
    const candidate = await provider.generateTurnArtifacts(fixture.input);
    const result = evaluateTurnArtifacts(fixture, candidate);
    const errors = result.findings.filter((finding) => finding.severity === "error");

    assert.equal(errors.length, 0, fixture.name);
  }
});

test("turn eval detects schema-adjacent scope and plausibility failures", () => {
  const fixture = createTurnEvalFixtures()[0]!;
  const result = evaluateTurnArtifacts(
    fixture,
    createImplausibleTurnCandidate(fixture)
  );
  const messages = result.findings.map((finding) => finding.message).join(" ");

  assert.match(messages, /visible next options/i);
  assert.match(messages, /unauthorized faction or player scope/i);
  assert.match(messages, /forbidden terms/i);
});
