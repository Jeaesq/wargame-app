import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { spawn } from "node:child_process";

const projectRoot = process.cwd();
const sourceRoot = join(projectRoot, "src");
const fileTimeoutMs = Number(process.env.WARGAME_TEST_FILE_TIMEOUT_MS ?? "30000");

async function main() {
  const testFiles = await collectTestFiles(sourceRoot);

  if (testFiles.length === 0) {
    console.error("No test files were found.");
    process.exitCode = 1;
    return;
  }

  for (const [index, file] of testFiles.entries()) {
    const label = relative(projectRoot, file);
    console.log(`[test-runner] [${index + 1}/${testFiles.length}] ${label}`);
    const result = await runTestFile(file, fileTimeoutMs);

    if (result.exitCode !== 0) {
      process.exitCode = result.exitCode;
      return;
    }
  }

  console.log(`[test-runner] Completed ${testFiles.length} test files.`);
}

async function collectTestFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectTestFiles(fullPath);
      }

      if (entry.isFile() && entry.name.endsWith(".test.ts")) {
        return [fullPath];
      }

      return [];
    })
  );

  return files.flat().sort((left, right) => left.localeCompare(right));
}

function runTestFile(
  filePath: string,
  timeoutMs: number
): Promise<{
  exitCode: number;
}> {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ["--import", "tsx", "--test-force-exit", "--test", filePath],
      {
        cwd: projectRoot,
        env: {
          ...process.env,
          WARGAME_LOG_LEVEL: process.env.WARGAME_LOG_LEVEL ?? "silent"
        },
        stdio: "inherit"
      }
    );

    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      child.kill("SIGKILL");
      console.error(
        `[test-runner] Timed out after ${timeoutMs}ms while running ${relative(projectRoot, filePath)}`
      );
      resolve({ exitCode: 1 });
    }, timeoutMs);

    child.once("exit", (code, signal) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);

      if (signal) {
        console.error(
          `[test-runner] ${relative(projectRoot, filePath)} exited via signal ${signal}.`
        );
        resolve({ exitCode: 1 });
        return;
      }

      resolve({ exitCode: code ?? 1 });
    });

    child.once("error", (error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      console.error(
        `[test-runner] Failed to start ${relative(projectRoot, filePath)}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      resolve({ exitCode: 1 });
    });
  });
}

void main();
