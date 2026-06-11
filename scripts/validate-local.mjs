#!/usr/bin/env node

import { spawn } from "node:child_process";

const steps = [
  { label: "Compile backend Python", command: "python3", args: ["-m", "compileall", "backend"] },
  { label: "Run backend smoke tests", command: "python3", args: ["-m", "backend.tests"] },
  { label: "Install frontend dependencies", command: "npm", args: ["install"], cwd: "frontend" },
  { label: "Typecheck frontend", command: "npm", args: ["run", "typecheck"], cwd: "frontend" },
  { label: "Build frontend", command: "npm", args: ["run", "build"], cwd: "frontend" },
  { label: "Run frontend Playwright smoke tests", command: "npm", args: ["run", "test:smoke"], cwd: "frontend" },
];

function runStep(step) {
  return new Promise((resolve, reject) => {
    console.log(`\n==> ${step.label}`);
    const child = spawn(step.command, step.args, {
      cwd: step.cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${step.label} failed with exit code ${code}`));
      }
    });
  });
}

for (const step of steps) {
  await runStep(step);
}

console.log("\nLocal validation passed.");
