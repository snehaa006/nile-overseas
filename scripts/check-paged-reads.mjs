/**
 * Guards against the bug class that made August payroll pay half a month:
 * PostgREST caps a response at 1000 rows and says nothing, so a list read
 * that trusts one call starts silently losing rows the moment a table grows
 * past the cap. It surfaces as plausible-looking numbers, not an error.
 *
 * Every read in the API layer must therefore be one of:
 *   - a single row  — `.single()` / `.maybeSingle()`
 *   - a count only  — `head: true`
 *   - explicitly capped — `.limit(n)`
 *   - paged through `fetchAll(...)`, which ends in `.range(from, to)`
 *
 * Run by `npm run build`. If this fails on a new query, page it rather than
 * silencing the check.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const API_DIR = "src/shared/api";
const SAFE = [".single()", ".maybeSingle()", "head: true", ".range(", ".limit("];

/** Blanks out comments so prose about `.select()` isn't read as code. */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/\/\/[^\n]*/g, (m) => " ".repeat(m.length));
}

const offenders = [];
for (const file of readdirSync(API_DIR).filter((f) => f.endsWith(".ts"))) {
  const path = join(API_DIR, file);
  const source = stripComments(readFileSync(path, "utf8"));
  for (let i = source.indexOf(".select("); i !== -1; i = source.indexOf(".select(", i + 1)) {
    // A query can be built over several statements (`let query = …` then
    // `query.range(…)`), so look ahead to wherever the next query starts.
    const next = source.indexOf(".select(", i + 1);
    const scope = source.slice(i, next === -1 ? source.length : next);
    if (SAFE.some((marker) => scope.includes(marker))) continue;
    offenders.push(`${path}:${source.slice(0, i).split("\n").length}`);
  }
}

if (offenders.length > 0) {
  console.error(
    "Unbounded read(s) — the server caps a response and truncates silently.\n" +
      "Page these through fetchAll() (see src/shared/lib/supabase.ts):\n" +
      offenders.map((o) => `  ${o}`).join("\n"),
  );
  process.exit(1);
}
console.log(`All reads in ${API_DIR} are paged, capped or single-row.`);
