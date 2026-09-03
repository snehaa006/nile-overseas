/**
 * Minimal test runner: bundles every *.test.ts under src/ with esbuild and
 * runs it on node. The payroll maths is the one place in this app where a
 * quiet mistake becomes someone's wrong wages, so it gets checked on every
 * build rather than by hand.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function findTests(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return findTests(path);
    return entry.endsWith(".test.ts") ? [path] : [];
  });
}

const tests = findTests("src");
if (tests.length === 0) {
  console.log("No tests found.");
  process.exit(0);
}

const out = mkdtempSync(join(tmpdir(), "nile-tests-"));
let failed = 0;
for (const test of tests) {
  const bundle = join(out, `${test.replace(/[/\\.]/g, "_")}.cjs`);
  try {
    execFileSync(
      "npx",
      ["esbuild", test, "--bundle", "--platform=node", "--format=cjs",
       "--alias:@=./src", `--outfile=${bundle}`, "--log-level=warning"],
      { stdio: "inherit" },
    );
    console.log(`\n${test}`);
    execFileSync("node", [bundle], { stdio: "inherit" });
  } catch {
    failed += 1;
  }
}
process.exit(failed === 0 ? 0 : 1);
