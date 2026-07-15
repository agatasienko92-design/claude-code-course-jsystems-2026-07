---
name: reference-openrouter-provider-overload-gotcha
description: "@openrouter/ai-sdk-provider@3.0.0: calling the provider as `openrouter(modelId)` with no settings resolves to the OpenRouterCompletionLanguageModel overload, not chat — breaks under `next build`'s stricter overload resolution even though vitest/tsc in isolation may not flag it. Use `provider.chat(modelId)` explicitly.
metadata:
  type: reference
---

`OpenRouterProvider` (from `@openrouter/ai-sdk-provider`, verified v3.0.0
installed in `app/node_modules`) has an overloaded call signature:

```ts
interface OpenRouterProvider extends ProviderV4 {
  (modelId: OpenRouterChatModelId, settings?: OpenRouterCompletionSettings): OpenRouterCompletionLanguageModel;
  (modelId: OpenRouterChatModelId, settings?: OpenRouterChatSettings): OpenRouterChatLanguageModel;
  chat(modelId, settings?): OpenRouterChatLanguageModel;
  completion(modelId, settings?): OpenRouterCompletionLanguageModel;
  ...
}
```

Calling `provider(modelId)` with only one argument picks the **first**
matching overload (completion), not chat. This compiled fine under a bare
`ReturnType<OpenRouterProvider>` annotation but failed `next build`'s
TypeScript check with `Type 'OpenRouterCompletionLanguageModel' is not
assignable to type 'OpenRouterChatLanguageModel'` when the two call sites
were assigned to differently-inferred fields.

**How to apply:** always call `provider.chat(modelId)` explicitly for
chat/generateText/streamText use (which is virtually always what an AI-SDK
integration wants, including multimodal file-part messages), never the bare
`provider(modelId)` form. Type the result as `ReturnType<OpenRouterProvider["chat"]>`
if you need an explicit type, not `ReturnType<OpenRouterProvider>`. Applied
in `app/src/lib/llm/provider.ts` ([[project-poc-phase2-backend-worktree]]).
Also: `npm test`/`vitest` did NOT catch this — only `next build`'s
TypeScript pass did, because vitest here doesn't typecheck. Always run the
build step, not just tests, before considering a task done.
