import { spawn } from "node:child_process";

const children = [
  ["npm", ["run", "dev:api"]],
  ["npm", ["run", "dev:web"]]
].map(([command, args]) =>
  spawn(command, args, {
    stdio: "inherit",
    shell: true
  })
);

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGINT");
    }
  }

  setTimeout(() => process.exit(code), 50);
}

for (const child of children) {
  child.on("exit", (code) => {
    if (!shuttingDown && code && code !== 0) {
      shutdown(code);
    }
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
