import { describe, expect, it } from "vitest";

// Trivial smoke test confirming the Vitest test infrastructure is wired up
// correctly (config, TS, jsdom environment). Real unit tests for lib/*
// arrive in later phases.
describe("smoke", () => {
  it("adds numbers", () => {
    expect(1 + 1).toBe(2);
  });
});
