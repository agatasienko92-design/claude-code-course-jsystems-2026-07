// @vitest-environment node
// Tests for the policy document loader (ADR-001 D-104, §3.4). Reads the
// real repository policy files at `docs/policies/` (resolved relative to
// the repo root, one level above `app/`) at request time, no caching.

import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadPolicy, PolicyConfigError, DEFAULT_POLICIES_BASE_PATH } from "./loader";

describe("loadPolicy", () => {
  it("loads the return policy document for the return scenario", async () => {
    const text = await loadPolicy("return");

    expect(text).toContain("Return Policy");
    expect(text).toContain("R-1");
  });

  it("loads the complaint policy document for the complaint scenario", async () => {
    const text = await loadPolicy("complaint");

    expect(text).toContain("Complaint");
    expect(text).toContain("C-1");
  });

  it("throws a typed CONFIG_ERROR when the resolved policy file does not exist", async () => {
    const missingBasePath = path.join(DEFAULT_POLICIES_BASE_PATH, "does-not-exist");
    expect.assertions(3);

    try {
      await loadPolicy("return", missingBasePath);
    } catch (error) {
      expect(error).toBeInstanceOf(PolicyConfigError);
      expect((error as PolicyConfigError).code).toBe("CONFIG_ERROR");
      expect((error as PolicyConfigError).message.length).toBeGreaterThan(0);
    }
  });

  it("keeps return and complaint content isolated (no cross-contamination)", async () => {
    const returnText = await loadPolicy("return");
    const complaintText = await loadPolicy("complaint");

    expect(returnText).not.toBe(complaintText);
    expect(returnText).not.toContain("C-1");
    expect(complaintText).not.toContain("R-1");
  });
});
