"use client";

import { useReducer, useState, type Dispatch as ReactDispatch } from "react";

import { shellReducer } from "./reducer";
import { initialShellState, type ShellAction, type ShellApiError } from "./types";

/**
 * View shell — the single-page state machine from ADR-002 §3/§7.
 *
 * Each of the four states renders a placeholder slot component. The real
 * CaseForm and chat screens land in later phases and replace these
 * placeholders; for now the slots exist only to exercise and visually
 * confirm the state machine (demo controls use dummy data, no real
 * network calls).
 *
 * NOTE: this file intentionally avoids the `@/*` import alias and the
 * `components/ui/*` (shadcn) primitives — `vitest.config.ts` (outside this
 * phase's allowed paths) has no alias resolution configured yet, and
 * pulling those in breaks the component tests. Plain elements + Tailwind
 * utility classes (matching the Play tokens already wired into
 * `globals.css`) are used instead; the later phase that owns CaseForm/chat
 * can swap these placeholders for the real shadcn-based components.
 */
export function Shell() {
  const [shell, dispatch] = useReducer(shellReducer, initialShellState);

  return (
    <div
      data-testid="shell-view"
      data-shell-state={shell.state}
      className="flex flex-1 items-center justify-center p-6"
    >
      {shell.state === "form" && <FormPlaceholder dispatch={dispatch} />}
      {shell.state === "analyzing" && <AnalyzingPlaceholder dispatch={dispatch} />}
      {shell.state === "analysisError" && (
        <AnalysisErrorPlaceholder apiError={shell.apiError} dispatch={dispatch} />
      )}
      {shell.state === "chat" && <ChatPlaceholder dispatch={dispatch} />}
    </div>
  );
}

type Dispatch = ReactDispatch<ShellAction>;

const cardClass = "w-full max-w-md rounded-xl border border-border bg-card p-6 text-card-foreground";
const titleClass = "text-base font-semibold leading-snug";
const descriptionClass = "mt-1 text-sm text-muted-foreground";
const primaryButtonClass =
  "inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80";
const outlineButtonClass =
  "inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted";

function FormPlaceholder({ dispatch }: { dispatch: Dispatch }) {
  return (
    <div data-testid="form-placeholder" className={cardClass}>
      <h2 className={titleClass}>Formularz zgłoszenia</h2>
      <p className={descriptionClass}>
        Ten widok zostanie zaimplementowany w kolejnej fazie (formularz reklamacji/zwrotu).
      </p>
      <div className="mt-4">
        <button
          type="button"
          data-testid="demo-submit"
          className={primaryButtonClass}
          onClick={() =>
            dispatch({
              type: "SUBMIT_VALID",
              payload: { placeholder: true },
            })
          }
        >
          Wyślij zgłoszenie (dane testowe)
        </button>
      </div>
    </div>
  );
}

function AnalyzingPlaceholder({ dispatch }: { dispatch: Dispatch }) {
  return (
    <div data-testid="analyzing-placeholder" className={cardClass}>
      <h2 className={titleClass}>Analizowanie zgłoszenia…</h2>
      <p className={descriptionClass}>Trwa ocena zdjęcia i opisu przez asystenta.</p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          data-testid="demo-success"
          className={primaryButtonClass}
          onClick={() => dispatch({ type: "ANALYSIS_SUCCESS" })}
        >
          Symuluj wynik: sukces
        </button>
        <button
          type="button"
          data-testid="demo-error"
          className={outlineButtonClass}
          onClick={() =>
            dispatch({
              type: "ANALYSIS_ERROR",
              error: {
                code: "UPSTREAM_LLM_ERROR",
                message: "Usługa analizy jest chwilowo niedostępna.",
              },
            })
          }
        >
          Symuluj wynik: błąd
        </button>
      </div>
    </div>
  );
}

function AnalysisErrorPlaceholder({
  apiError,
  dispatch,
}: {
  apiError: ShellApiError | null;
  dispatch: Dispatch;
}) {
  return (
    <div data-testid="analysis-error-placeholder" className={cardClass}>
      <h2 className={titleClass}>Nie udało się przeanalizować zgłoszenia</h2>
      <p className={descriptionClass}>{apiError?.message ?? "Wystąpił nieznany błąd."}</p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          data-testid="retry-button"
          className={primaryButtonClass}
          onClick={() => dispatch({ type: "RETRY" })}
        >
          Spróbuj ponownie
        </button>
        <button
          type="button"
          data-testid="back-button"
          className={outlineButtonClass}
          onClick={() => dispatch({ type: "BACK_TO_FORM" })}
        >
          Wróć do formularza
        </button>
      </div>
    </div>
  );
}

function ChatPlaceholder({ dispatch }: { dispatch: Dispatch }) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div data-testid="chat-placeholder" className={cardClass}>
      <h2 className={titleClass}>Czat z asystentem</h2>
      <p className={descriptionClass}>
        Ten widok zostanie zaimplementowany w kolejnej fazie (rozmowa, decyzja, panel podsumowania).
      </p>
      <div className="mt-4">
        <button
          type="button"
          data-testid="new-case-button"
          className={outlineButtonClass}
          onClick={() => setConfirmOpen(true)}
        >
          Nowe zgłoszenie
        </button>
      </div>

      {confirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-case-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 p-4"
        >
          <div className="w-full max-w-sm rounded-xl bg-popover p-4 text-popover-foreground ring-1 ring-foreground/10">
            <h3 id="new-case-dialog-title" className={titleClass}>
              Rozpocząć nowe zgłoszenie?
            </h3>
            <p className={descriptionClass}>
              Bieżąca rozmowa i dane formularza zostaną utracone.
            </p>
            <div className="mt-4 flex flex-row-reverse gap-2">
              <button
                type="button"
                data-testid="confirm-new-case"
                className={primaryButtonClass}
                onClick={() => {
                  setConfirmOpen(false);
                  dispatch({ type: "NEW_CASE_CONFIRMED" });
                }}
              >
                Tak, zacznij od nowa
              </button>
              <button
                type="button"
                data-testid="cancel-new-case"
                className={outlineButtonClass}
                onClick={() => setConfirmOpen(false)}
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
