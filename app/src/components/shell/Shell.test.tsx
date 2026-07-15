import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { Shell } from "./Shell";

/**
 * Component-level tests for the view shell (ADR-002 §3, §7). These drive
 * the reducer through the placeholder slots' demo controls to prove the
 * wiring (Shell -> reducer -> placeholder) behaves per the state diagram,
 * on top of the exhaustive pure-reducer tests in reducer.test.ts.
 */

afterEach(() => {
  cleanup();
});

describe("Shell", () => {
  it("renders the form placeholder as the initial state", () => {
    render(<Shell />);

    const root = screen.getByTestId("shell-view");
    expect(root.getAttribute("data-shell-state")).toBe("form");
    expect(screen.getByTestId("form-placeholder")).toBeTruthy();
  });

  it("goes form -> analyzing -> chat on the happy path", () => {
    render(<Shell />);

    fireEvent.click(screen.getByTestId("demo-submit"));
    expect(screen.getByTestId("shell-view").getAttribute("data-shell-state")).toBe("analyzing");
    expect(screen.getByTestId("analyzing-placeholder")).toBeTruthy();

    fireEvent.click(screen.getByTestId("demo-success"));
    expect(screen.getByTestId("shell-view").getAttribute("data-shell-state")).toBe("chat");
    expect(screen.getByTestId("chat-placeholder")).toBeTruthy();
  });

  it("goes form -> analyzing -> analysisError, retry returns to analyzing", () => {
    render(<Shell />);

    fireEvent.click(screen.getByTestId("demo-submit"));
    fireEvent.click(screen.getByTestId("demo-error"));

    expect(screen.getByTestId("shell-view").getAttribute("data-shell-state")).toBe("analysisError");
    expect(screen.getByTestId("analysis-error-placeholder")).toBeTruthy();

    fireEvent.click(screen.getByTestId("retry-button"));
    expect(screen.getByTestId("shell-view").getAttribute("data-shell-state")).toBe("analyzing");
  });

  it("analysisError -> form on back", () => {
    render(<Shell />);

    fireEvent.click(screen.getByTestId("demo-submit"));
    fireEvent.click(screen.getByTestId("demo-error"));
    fireEvent.click(screen.getByTestId("back-button"));

    expect(screen.getByTestId("shell-view").getAttribute("data-shell-state")).toBe("form");
  });

  it('"Nowe zgloszenie" without confirmation does not reset the chat state (TAC-002-06)', () => {
    render(<Shell />);

    fireEvent.click(screen.getByTestId("demo-submit"));
    fireEvent.click(screen.getByTestId("demo-success"));
    fireEvent.click(screen.getByTestId("new-case-button"));
    fireEvent.click(screen.getByTestId("cancel-new-case"));

    expect(screen.getByTestId("shell-view").getAttribute("data-shell-state")).toBe("chat");
  });

  it('"Nowe zgloszenie" with confirmation resets to form (TAC-002-06)', () => {
    render(<Shell />);

    fireEvent.click(screen.getByTestId("demo-submit"));
    fireEvent.click(screen.getByTestId("demo-success"));
    fireEvent.click(screen.getByTestId("new-case-button"));
    fireEvent.click(screen.getByTestId("confirm-new-case"));

    expect(screen.getByTestId("shell-view").getAttribute("data-shell-state")).toBe("form");
  });
});
