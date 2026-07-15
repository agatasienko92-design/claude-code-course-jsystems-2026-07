// OpenRouter provider construction and model-ID resolution (ADR-001 §3.6,
// ADR-000 §7). Builds the OpenRouter provider from env (`OPENROUTER_API_KEY`,
// `OPENROUTER_BASE_URL`) and resolves the text/vision model IDs
// (`OPENROUTER_TEXT_MODEL`/`OPENROUTER_VISION_MODEL`, falling back to
// `OPENROUTER_MODEL`). A missing API key, or all model vars missing, throws
// a typed `CONFIG_ERROR` — error messages never include any env var value.

import { createOpenRouter, type OpenRouterProvider } from "@openrouter/ai-sdk-provider";

/** Typed configuration error for missing/invalid LLM provider config (maps to `ApiError` code `CONFIG_ERROR`). */
export class LlmConfigError extends Error {
  readonly code = "CONFIG_ERROR" as const;

  constructor(message: string) {
    super(message);
    this.name = "LlmConfigError";
  }
}

/** Reads an env var, treating an unset or blank (whitespace-only) value as "not configured". */
function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return value !== undefined && value.trim().length > 0 ? value : undefined;
}

export interface ResolvedModelIds {
  textModelId: string;
  visionModelId: string;
}

/**
 * Resolves the text and vision model IDs: `OPENROUTER_TEXT_MODEL` /
 * `OPENROUTER_VISION_MODEL`, each falling back to `OPENROUTER_MODEL` when
 * unset (ADR-000 §7, TAC-001-07).
 *
 * @throws {LlmConfigError} when a model ID cannot be resolved for either
 * role (i.e. the split var AND the fallback are both unset for that role).
 * The error message never includes any env var name or value.
 */
export function resolveModelIds(): ResolvedModelIds {
  const fallback = readEnv("OPENROUTER_MODEL");
  const textModelId = readEnv("OPENROUTER_TEXT_MODEL") ?? fallback;
  const visionModelId = readEnv("OPENROUTER_VISION_MODEL") ?? fallback;

  if (!textModelId || !visionModelId) {
    throw new LlmConfigError(
      "Brak konfiguracji modelu językowego. Skontaktuj się z administratorem systemu.",
    );
  }

  return { textModelId, visionModelId };
}

/**
 * Builds the OpenRouter provider from env (`OPENROUTER_API_KEY`,
 * `OPENROUTER_BASE_URL`). The base URL is left to the provider's own
 * default (`https://openrouter.ai/api/v1`, matching ADR-000 §7) when unset.
 *
 * @throws {LlmConfigError} when `OPENROUTER_API_KEY` is missing. The error
 * message never includes any env var name or value.
 */
export function createConfiguredOpenRouterProvider(): OpenRouterProvider {
  const apiKey = readEnv("OPENROUTER_API_KEY");
  if (!apiKey) {
    throw new LlmConfigError(
      "Brak konfiguracji dostawcy modeli językowych. Skontaktuj się z administratorem systemu.",
    );
  }

  const baseURL = readEnv("OPENROUTER_BASE_URL");
  return createOpenRouter(baseURL ? { apiKey, baseURL } : { apiKey });
}

export interface ResolvedLlm {
  textModel: ReturnType<OpenRouterProvider["chat"]>;
  visionModel: ReturnType<OpenRouterProvider["chat"]>;
}

/**
 * Convenience helper combining provider construction and model-ID
 * resolution: returns the ready-to-use text and vision chat language
 * models. Uses `provider.chat(...)` explicitly (rather than the provider's
 * overloaded call signature) so both models resolve to
 * `OpenRouterChatLanguageModel` unambiguously — the overloaded call
 * signature otherwise resolves to the completion-model overload when
 * called without settings.
 */
export function resolveLlm(): ResolvedLlm {
  const provider = createConfiguredOpenRouterProvider();
  const { textModelId, visionModelId } = resolveModelIds();

  return {
    textModel: provider.chat(textModelId),
    visionModel: provider.chat(visionModelId),
  };
}
