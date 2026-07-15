// Policy document loader (ADR-001 D-104, §3.4). Resolves a scenario
// ("return" | "complaint") to its markdown policy file and reads it at
// request time — no caching, so editing a policy file changes agent
// behavior on the very next `/api/chat` request (course-demo requirement).

import { promises as fs } from "node:fs";
import path from "node:path";

export type PolicyScenario = "return" | "complaint";

/**
 * Base directory containing the policy markdown files, resolved relative to
 * the app's working directory (`app/`), one level up to the repo root's
 * `docs/policies/`. A single configurable constant so deployments that
 * change the repo layout only need to update this one value (ADR-001 D-104
 * consequence: runtime dependency on repo layout outside `app/`).
 */
export const DEFAULT_POLICIES_BASE_PATH = path.resolve(process.cwd(), "..", "docs", "policies");

const POLICY_FILENAMES: Record<PolicyScenario, string> = {
  return: "return-policy.md",
  complaint: "complaint-policy.md",
};

/** Typed configuration error for a missing/unreadable policy document (maps to `ApiError` code `CONFIG_ERROR`). */
export class PolicyConfigError extends Error {
  readonly code = "CONFIG_ERROR" as const;

  constructor(message: string) {
    super(message);
    this.name = "PolicyConfigError";
  }
}

/**
 * Reads the policy document markdown for `scenario`. Reads from disk on
 * every call (no caching). `basePath` defaults to
 * {@link DEFAULT_POLICIES_BASE_PATH} and is overridable (e.g. in tests, or
 * for deployments with a different layout).
 *
 * @throws {PolicyConfigError} when the file cannot be read (missing file,
 * permissions, etc.) — a typed error the route layer maps to the
 * `CONFIG_ERROR` `ApiError` response.
 */
export async function loadPolicy(
  scenario: PolicyScenario,
  basePath: string = DEFAULT_POLICIES_BASE_PATH,
): Promise<string> {
  const filePath = path.join(basePath, POLICY_FILENAMES[scenario]);

  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    throw new PolicyConfigError(
      `Nie udało się wczytać dokumentu polityki dla scenariusza "${scenario}". Skontaktuj się z administratorem systemu.`,
    );
  }
}
