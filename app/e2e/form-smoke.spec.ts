import { test, expect } from "@playwright/test";

/**
 * Phase 2 (Q1) smoke test.
 *
 * The app currently renders only the view-shell "form" state placeholder
 * (ADR-002 §3 state machine) — the real CaseForm and chat screens land in
 * later phases. This spec intentionally asserts only what exists today:
 * the page loads, shows the Polish app title, and the form-state
 * placeholder with its submit control is present. No LLM-dependent or
 * unimplemented-form assertions belong here (see AGENTS.md — E2E mocks
 * nothing, so we only assert against what is actually running).
 */
test.describe("Form page smoke test", () => {
  test("renders the Polish app title and the form-state placeholder", async ({
    page,
  }) => {
    await page.goto("/");

    // Document title (next/metadata) is in Polish.
    await expect(page).toHaveTitle("Asystent Decyzji Serwisowych");

    // Header brand text (also Polish, per docs/design-guidelines.md).
    await expect(
      page.getByRole("banner").getByText("Asystent Decyzji Serwisowych"),
    ).toBeVisible();

    // View shell starts in the "form" state (ADR-002 §7 state diagram).
    const shell = page.getByTestId("shell-view");
    await expect(shell).toHaveAttribute("data-shell-state", "form");

    // Form-state placeholder heading + submit button are present.
    const formPlaceholder = page.getByTestId("form-placeholder");
    await expect(formPlaceholder).toBeVisible();
    await expect(
      formPlaceholder.getByRole("heading", { name: "Formularz zgłoszenia" }),
    ).toBeVisible();

    const submitButton = page.getByTestId("demo-submit");
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
    await expect(submitButton).toHaveText("Wyślij zgłoszenie (dane testowe)");
  });
});
