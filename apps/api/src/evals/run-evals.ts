import { MockAdvisorResponseProvider } from "../providers/mock/mock-advisor-response-provider.js";
import { MockTurnGenerationProvider } from "../providers/mock/mock-turn-generation-provider.js";
import type {
  AdvisorResponseProvider,
  TurnGenerationProvider
} from "../providers/types.js";
import {
  evaluateAdvisorResponse,
  evaluateTurnArtifacts,
  type EvalResult
} from "./checks.js";
import {
  createAdvisorEvalFixtures,
  createTurnEvalFixtures
} from "./fixtures.js";

type EvalSummary = {
  results: EvalResult[];
  errorCount: number;
  warningCount: number;
};

async function runAdvisorEvals(
  provider: AdvisorResponseProvider
): Promise<EvalResult[]> {
  const fixtures = createAdvisorEvalFixtures();

  return Promise.all(
    fixtures.map(async (fixture) => {
      const candidate = await provider.generateAdvisorResponse(fixture.input);
      return evaluateAdvisorResponse(fixture, candidate);
    })
  );
}

async function runTurnEvals(
  provider: TurnGenerationProvider
): Promise<EvalResult[]> {
  const fixtures = createTurnEvalFixtures();

  return Promise.all(
    fixtures.map(async (fixture) => {
      const candidate = await provider.generateTurnArtifacts(fixture.input);
      return evaluateTurnArtifacts(fixture, candidate);
    })
  );
}

function summarize(results: EvalResult[]): EvalSummary {
  const findings = results.flatMap((result) => result.findings);

  return {
    results,
    errorCount: findings.filter((finding) => finding.severity === "error").length,
    warningCount: findings.filter((finding) => finding.severity === "warn").length
  };
}

function printSummary(title: string, summary: EvalSummary) {
  console.log(`\n${title}`);

  for (const result of summary.results) {
    const errors = result.findings.filter((finding) => finding.severity === "error");
    const warnings = result.findings.filter((finding) => finding.severity === "warn");

    console.log(`- ${result.fixtureName}`);

    if (errors.length === 0 && warnings.length === 0) {
      console.log("  PASS");
      continue;
    }

    if (errors.length > 0) {
      console.log("  Deterministic issues:");
      for (const finding of errors) {
        console.log(`  - ${finding.message}`);
      }
    }

    if (warnings.length > 0) {
      console.log("  Qualitative notes:");
      for (const finding of warnings) {
        console.log(`  - ${finding.message}`);
      }
    }
  }

  console.log(
    `Summary: ${summary.results.length} fixture(s), ${summary.errorCount} deterministic issue(s), ${summary.warningCount} qualitative note(s).`
  );
}

async function main() {
  const advisorProvider = new MockAdvisorResponseProvider();
  const turnProvider = new MockTurnGenerationProvider();

  const advisorSummary = summarize(await runAdvisorEvals(advisorProvider));
  const turnSummary = summarize(await runTurnEvals(turnProvider));

  printSummary("Advisor evals", advisorSummary);
  printSummary("Turn evals", turnSummary);

  if (advisorSummary.errorCount > 0 || turnSummary.errorCount > 0) {
    process.exitCode = 1;
    return;
  }
}

void main();
