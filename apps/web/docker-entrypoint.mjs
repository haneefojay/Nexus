import { spawn } from "node:child_process";

const child = spawn(
  process.execPath,
  [
    "apps/web/node_modules/next/dist/bin/next",
    "start",
    "apps/web",
    "-H",
    "0.0.0.0",
    "-p",
    process.env.PORT ?? "3000",
  ],
  { stdio: "inherit" },
);

let shutdownSignal;
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    shutdownSignal ??= signal;
    child.kill(signal);
  });
}

child.once("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.once("exit", (code) => {
  if (shutdownSignal) {
    process.exitCode = 0;
    return;
  }
  process.exitCode = code ?? 1;
});
