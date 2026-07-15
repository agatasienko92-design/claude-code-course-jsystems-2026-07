import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { CaseForm } from "./CaseForm";

/**
 * Component tests for the case form (ADR-002 §3 "Case form", PRD §6 AC-01..08,
 * §9.1). Drives the real DOM via Testing Library; no shadcn/ui primitives are
 * used by CaseForm (see CaseForm.tsx header comment) so these tests run under
 * the project's current Vitest config without alias resolution.
 */

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function makeFile(name: string, type: string, sizeBytes: number): File {
  const file = new File(["stub-content"], name, { type });
  Object.defineProperty(file, "size", { value: sizeBytes, configurable: true });
  return file;
}

/** Fills every field with a valid value except the ones overridden. Skips
 * a field entirely when its override is explicitly `null`. */
async function fillValidForm(
  overrides: {
    requestType?: "complaint" | "return";
    category?: string;
    modelName?: string | null;
    purchaseDate?: string | null;
    reason?: string | null;
    file?: File | null;
  } = {},
) {
  if (overrides.requestType === "return") {
    fireEvent.click(screen.getByTestId("request-type-return"));
  }
  if (overrides.category !== null) {
    fireEvent.change(screen.getByTestId("category-select"), {
      target: { value: overrides.category ?? "smartphone" },
    });
  }
  if (overrides.modelName !== null) {
    fireEvent.change(screen.getByTestId("model-name-input"), {
      target: { value: overrides.modelName ?? "iPhone 13" },
    });
  }
  if (overrides.purchaseDate !== null) {
    fireEvent.change(screen.getByTestId("purchase-date-input"), {
      target: { value: overrides.purchaseDate ?? todayIso() },
    });
  }
  if (overrides.reason !== null && (overrides.requestType ?? "complaint") === "complaint") {
    fireEvent.change(screen.getByTestId("reason-textarea"), {
      target: { value: overrides.reason ?? "Ekran pęka po tygodniu użytkowania." },
    });
  }
  if (overrides.file !== null) {
    const file = overrides.file ?? makeFile("device.jpg", "image/jpeg", 1024);
    fireEvent.change(screen.getByTestId("image-input"), { target: { files: [file] } });
  }
}

beforeEach(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  // jsdom has no object URL implementation.
  URL.createObjectURL = vi.fn(() => "blob:mock-preview");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CaseForm", () => {
  it("defaults to Reklamacja with the reason marked required, and toggling to Zwrot marks it optional (AC-04)", () => {
    render(<CaseForm onSubmit={vi.fn()} />);

    expect(screen.getByTestId("reason-required-marker").textContent).toMatch(/wymagane/i);

    fireEvent.click(screen.getByTestId("request-type-return"));
    expect(screen.getByTestId("reason-required-marker").textContent).toMatch(/opcjonalne/i);

    fireEvent.click(screen.getByTestId("request-type-complaint"));
    expect(screen.getByTestId("reason-required-marker").textContent).toMatch(/wymagane/i);
  });

  it("blocks submission with a Polish error when Reklamacja has an empty reason", async () => {
    const onSubmit = vi.fn();
    render(<CaseForm onSubmit={onSubmit} />);

    await fillValidForm({ reason: null });
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(await screen.findByText(/Podaj powód reklamacji/i)).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("switching to Zwrot clears the reason requirement and allows submit without a reason", async () => {
    const onSubmit = vi.fn();
    render(<CaseForm onSubmit={onSubmit} />);

    await fillValidForm({ requestType: "return", reason: null });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it("rejects a future purchase date and blocks submission", async () => {
    const onSubmit = vi.fn();
    render(<CaseForm onSubmit={onSubmit} />);

    await fillValidForm({ purchaseDate: isoDaysFromNow(1) });
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(await screen.findByText(/nie może być datą przyszłą/i)).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("accepts today's date as the purchase date (boundary)", async () => {
    const onSubmit = vi.fn();
    render(<CaseForm onSubmit={onSubmit} />);

    await fillValidForm({ purchaseDate: todayIso() });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  it("rejects an unsupported file type before any submit (client pre-check, AC-06)", async () => {
    render(<CaseForm onSubmit={vi.fn()} />);

    const gif = makeFile("device.gif", "image/gif", 1024);
    fireEvent.change(screen.getByTestId("image-input"), { target: { files: [gif] } });

    expect(await screen.findByText(/Niedozwolony format pliku/i)).toBeTruthy();
    expect(screen.queryByTestId("image-thumbnail")).toBeNull();
  });

  it("rejects a file larger than 10 MB before any submit (AC-07)", async () => {
    render(<CaseForm onSubmit={vi.fn()} />);

    const tooBig = makeFile("device.jpg", "image/jpeg", 11 * 1024 * 1024);
    fireEvent.change(screen.getByTestId("image-input"), { target: { files: [tooBig] } });

    expect(await screen.findByText(/Maksymalny rozmiar to 10 MB/i)).toBeTruthy();
    expect(screen.queryByTestId("image-thumbnail")).toBeNull();
  });

  it("accepts a file exactly at the 10 MB boundary and shows a thumbnail, filename and remove control (AC-08)", async () => {
    render(<CaseForm onSubmit={vi.fn()} />);

    const exact = makeFile("device.jpg", "image/jpeg", 10 * 1024 * 1024);
    fireEvent.change(screen.getByTestId("image-input"), { target: { files: [exact] } });

    expect(await screen.findByTestId("image-thumbnail")).toBeTruthy();
    expect(screen.getByTestId("image-filename").textContent).toMatch(/device\.jpg/);
    expect(screen.getByTestId("image-remove")).toBeTruthy();
    expect(screen.queryByTestId("image-error")).toBeNull();
  });

  it("removes the selected file when the remove (X) control is clicked", async () => {
    render(<CaseForm onSubmit={vi.fn()} />);

    const file = makeFile("device.jpg", "image/jpeg", 1024);
    fireEvent.change(screen.getByTestId("image-input"), { target: { files: [file] } });
    expect(await screen.findByTestId("image-thumbnail")).toBeTruthy();

    fireEvent.click(screen.getByTestId("image-remove"));

    expect(screen.queryByTestId("image-thumbnail")).toBeNull();
    expect(screen.queryByTestId("image-filename")).toBeNull();
  });

  it("builds a FormData with CaseFields as strings plus the image file, and calls onSubmit (no fetch)", async () => {
    const onSubmit = vi.fn();
    render(<CaseForm onSubmit={onSubmit} />);

    const file = makeFile("uszkodzony.png", "image/png", 2048);
    await fillValidForm({
      requestType: "complaint",
      category: "laptop",
      modelName: "Dell XPS 13",
      purchaseDate: todayIso(),
      reason: "Klawiatura przestała działać po tygodniu.",
      file,
    });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    const formData = onSubmit.mock.calls[0][0] as FormData;
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get("requestType")).toBe("complaint");
    expect(formData.get("category")).toBe("laptop");
    expect(formData.get("modelName")).toBe("Dell XPS 13");
    expect(formData.get("purchaseDate")).toBe(todayIso());
    expect(formData.get("reason")).toBe("Klawiatura przestała działać po tygodniu.");
    const uploaded = formData.get("image");
    expect(uploaded).toBeInstanceOf(File);
    expect((uploaded as File).name).toBe("uszkodzony.png");
  });

  it("blocks submission and shows a Polish error when no image was selected (AC-03)", async () => {
    const onSubmit = vi.fn();
    render(<CaseForm onSubmit={onSubmit} />);

    await fillValidForm({ file: null });
    fireEvent.click(screen.getByTestId("submit-button"));

    expect(await screen.findByTestId("image-error")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("scrolls the first invalid field into view on failed submit, not later invalid fields", async () => {
    render(<CaseForm onSubmit={vi.fn()} />);

    // Everything left at its default/empty state: category (first invalid
    // field after requestType, which has a default) and modelName are both
    // invalid. Only the earlier field's container should be scrolled.
    const categoryField = screen.getByTestId("category-field");
    const modelNameField = screen.getByTestId("model-name-field");
    const categorySpy = vi.fn();
    const modelNameSpy = vi.fn();
    categoryField.scrollIntoView = categorySpy;
    modelNameField.scrollIntoView = modelNameSpy;

    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => expect(categorySpy).toHaveBeenCalled());
    expect(modelNameSpy).not.toHaveBeenCalled();
  });
});
