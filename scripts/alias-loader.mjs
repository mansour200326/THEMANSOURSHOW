/**
 * Lets `node --test` resolve imports written the way TypeScript writes them.
 *
 * Two things Node can't do on its own: "@/..." means the project root (the
 * tsconfig path the whole app uses), and "./engine" means "./engine.ts" —
 * TypeScript imports are extensionless and ESM insists on the extension. The
 * alternative was writing the test files' imports differently from every other
 * file in the project, which is exactly how tests rot.
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = process.cwd();

/** The first of these that's actually on disk. */
const onDisk = (base) =>
  [base, `${base}.ts`, `${base}.tsx`, `${base}.mts`, join(base, "index.ts")].find(
    existsSync,
  );

export function resolve(specifier, context, next) {
  const relative = specifier.startsWith("./") || specifier.startsWith("../");
  if (!specifier.startsWith("@/") && !relative) return next(specifier, context);

  const base = specifier.startsWith("@/")
    ? join(root, specifier.slice(2))
    : join(dirname(fileURLToPath(context.parentURL)), specifier);

  const found = onDisk(base);
  return found ? next(pathToFileURL(found).href, context) : next(specifier, context);
}
