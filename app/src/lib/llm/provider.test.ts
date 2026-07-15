// Tests for OpenRouter provider construction and model-ID resolution
// (ADR-001 §3.6, ADR-000 §7, TAC-001-07). Env vars are stubbed per test via
// `vi.stubEnv` (and always unstubbed afterwards) so these tests are
// independent of whatever is actually configured on the host machine —
// this course VM has `OPENROUTER_API_KEY` set as a real env var, so every
// test must explicitly override every var it cares about rather than
// relying on it being unset.

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createConfiguredOpenRouterProvider,
  LlmConfigError,
  resolveModelIds,
} from "./provider";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolveModelIds", () => {
  it("resolves the text model to OPENROUTER_MODEL when OPENROUTER_TEXT_MODEL is unset (TAC-001-07)", () => {
    vi.stubEnv("OPENROUTER_TEXT_MODEL", "");
    vi.stubEnv("OPENROUTER_VISION_MODEL", "");
    vi.stubEnv("OPENROUTER_MODEL", "openai/gpt-5.4-mini");

    const { textModelId, visionModelId } = resolveModelIds();

    expect(textModelId).toBe("openai/gpt-5.4-mini");
    expect(visionModelId).toBe("openai/gpt-5.4-mini");
  });

  it("prefers the split model vars over the fallback when both are set", () => {
    vi.stubEnv("OPENROUTER_TEXT_MODEL", "openai/text-model");
    vi.stubEnv("OPENROUTER_VISION_MODEL", "openai/vision-model");
    vi.stubEnv("OPENROUTER_MODEL", "openai/fallback-model");

    const { textModelId, visionModelId } = resolveModelIds();

    expect(textModelId).toBe("openai/text-model");
    expect(visionModelId).toBe("openai/vision-model");
  });

  it("throws a typed CONFIG_ERROR when both the split vars and OPENROUTER_MODEL are unset", () => {
    vi.stubEnv("OPENROUTER_TEXT_MODEL", "");
    vi.stubEnv("OPENROUTER_VISION_MODEL", "");
    vi.stubEnv("OPENROUTER_MODEL", "");

    expect(() => resolveModelIds()).toThrow(LlmConfigError);
    try {
      resolveModelIds();
      expect.unreachable("resolveModelIds should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(LlmConfigError);
      expect((error as LlmConfigError).code).toBe("CONFIG_ERROR");
    }
  });

  it("does not leak the API key value into the missing-model-vars error message", () => {
    vi.stubEnv("OPENROUTER_API_KEY", "sk-or-v1-super-secret-abcdef");
    vi.stubEnv("OPENROUTER_TEXT_MODEL", "");
    vi.stubEnv("OPENROUTER_VISION_MODEL", "");
    vi.stubEnv("OPENROUTER_MODEL", "");

    try {
      resolveModelIds();
      expect.unreachable("resolveModelIds should have thrown");
    } catch (error) {
      expect((error as Error).message).not.toContain("sk-or-v1-super-secret-abcdef");
    }
  });
});

describe("createConfiguredOpenRouterProvider", () => {
  it("throws a typed CONFIG_ERROR when OPENROUTER_API_KEY is missing", () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");

    expect(() => createConfiguredOpenRouterProvider()).toThrow(LlmConfigError);
    try {
      createConfiguredOpenRouterProvider();
      expect.unreachable("createConfiguredOpenRouterProvider should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(LlmConfigError);
      expect((error as LlmConfigError).code).toBe("CONFIG_ERROR");
    }
  });

  it("succeeds and returns a callable provider when OPENROUTER_API_KEY is set", () => {
    vi.stubEnv("OPENROUTER_API_KEY", "sk-or-v1-test-key");

    const provider = createConfiguredOpenRouterProvider();

    expect(typeof provider).toBe("function");
  });

  it("does not leak other env values into the missing-API-key error message", () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    vi.stubEnv("OPENROUTER_MODEL", "acme/should-not-leak-12345");

    try {
      createConfiguredOpenRouterProvider();
      expect.unreachable("createConfiguredOpenRouterProvider should have thrown");
    } catch (error) {
      expect((error as Error).message).not.toContain("should-not-leak-12345");
    }
  });
});
