"use client";

// Case form (ADR-002 §3 "Case form", PRD §6 AC-01..09, §9.1). Controlled
// form built on react-hook-form + zodResolver, consuming the shared
// lib/validation Zod schema (ADR-002 D-204) so field rules and Polish
// messages stay in one place.
//
// NOTE: this component intentionally does NOT import the shadcn/ui
// primitives from `components/ui/*` (Select, Input, Calendar+Popover, ...).
// Those primitives import the `@/lib/utils` path alias, which
// `vitest.config.ts` (outside this phase's allowed paths, see AGENTS.md/task
// scope) does not resolve — any component that pulls them in fails every
// Vitest component test with "Failed to resolve import '@/...'" before a
// single assertion runs. This mirrors the same constraint and workaround
// already used by `components/shell/Shell.tsx`: plain elements styled with
// the Play Tailwind tokens wired into `globals.css` (bg-primary,
// text-primary-foreground, border-border, rounded-lg/xl, ...), which are
// visually equivalent to the shadcn components for this brand and need no
// alias-dependent imports. See the F3 task report for this deviation.

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Controller, useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  caseFieldsSchema,
  type CaseFieldsInput,
  type CaseFieldsOutput,
} from "../../lib/validation/case-fields";
import { validateFileMetadata } from "../../lib/validation/file-constraints";
import { categoryOptions } from "./category-labels";

export interface CaseFormProps {
  /** Called with a ready-to-send FormData on a fully valid submit. No fetch happens here (later phase). */
  onSubmit: (formData: FormData) => void;
}

const IMAGE_REQUIRED_MESSAGE = "Dodaj zdjęcie sprzętu.";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

const labelClass = "text-sm font-medium text-foreground";
const helperClass = "text-xs text-muted-foreground";
const errorClass = "text-xs font-medium text-destructive";
const controlClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";
const textareaClass = `${controlClass} h-auto min-h-20 py-2`;
const fieldWrapClass = "flex flex-col gap-1.5";

const segBase = "flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors";
const segActive = "border-transparent bg-primary text-primary-foreground";
const segInactive = "border-input bg-transparent text-foreground hover:bg-muted";

const primaryButtonClass =
  "mt-2 inline-flex h-9 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50";
const outlineButtonClass =
  "inline-flex h-7 items-center justify-center rounded-lg border border-border bg-background px-2 text-xs font-medium text-foreground hover:bg-muted";

/** Field order per PRD AC-01/§9.1, used to find the first invalid field to scroll to. */
const FIELD_ORDER = ["requestType", "category", "modelName", "purchaseDate", "reason"] as const;

export function CaseForm({ onSubmit }: CaseFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CaseFieldsInput>({
    resolver: zodResolver(caseFieldsSchema),
    defaultValues: {
      requestType: "complaint",
      modelName: "",
      purchaseDate: "",
      reason: "",
    },
  });

  const requestType = watch("requestType");
  const isComplaint = requestType === "complaint";

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const requestTypeFieldRef = useRef<HTMLDivElement | null>(null);
  const categoryFieldRef = useRef<HTMLDivElement | null>(null);
  const modelNameFieldRef = useRef<HTMLDivElement | null>(null);
  const purchaseDateFieldRef = useRef<HTMLDivElement | null>(null);
  const reasonFieldRef = useRef<HTMLDivElement | null>(null);
  const imageFieldRef = useRef<HTMLDivElement | null>(null);

  const fieldRefs = {
    requestType: requestTypeFieldRef,
    category: categoryFieldRef,
    modelName: modelNameFieldRef,
    purchaseDate: purchaseDateFieldRef,
    reason: reasonFieldRef,
  } as const;

  function processFile(file: File | null) {
    if (!file) return;
    const constraintError = validateFileMetadata({ type: file.type, size: file.size });
    if (constraintError) {
      setImageError(constraintError.message);
      setImageFile(null);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    setImageError(null);
    setImageFile(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    processFile(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0] ?? null;
    processFile(file);
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImageError(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function scrollToFirstInvalid(fieldErrors: FieldErrors<CaseFieldsInput>, imageMissing: boolean) {
    for (const key of FIELD_ORDER) {
      if (fieldErrors[key]) {
        fieldRefs[key].current?.scrollIntoView({ block: "center" });
        return;
      }
    }
    if (imageMissing) {
      imageFieldRef.current?.scrollIntoView({ block: "center" });
    }
  }

  const submitHandler = handleSubmit(
    (data: CaseFieldsOutput) => {
      if (!imageFile) {
        setImageError(IMAGE_REQUIRED_MESSAGE);
        imageFieldRef.current?.scrollIntoView({ block: "center" });
        return;
      }
      const formData = new FormData();
      formData.set("requestType", data.requestType);
      formData.set("category", data.category);
      formData.set("modelName", data.modelName);
      formData.set("purchaseDate", data.purchaseDate);
      if (data.reason) {
        formData.set("reason", data.reason);
      }
      formData.set("image", imageFile);
      onSubmit(formData);
    },
    (fieldErrors) => {
      if (!imageFile) {
        setImageError(IMAGE_REQUIRED_MESSAGE);
      }
      scrollToFirstInvalid(fieldErrors, !imageFile);
    },
  );

  return (
    <form
      noValidate
      onSubmit={submitHandler}
      className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-xl border border-border bg-card p-6 text-card-foreground"
    >
      {/* Request type */}
      <div ref={requestTypeFieldRef} data-testid="request-type-field" className={fieldWrapClass}>
        <span className={labelClass}>Typ zgłoszenia</span>
        <Controller
          control={control}
          name="requestType"
          render={({ field }) => (
            <div className="flex gap-2">
              <button
                type="button"
                data-testid="request-type-complaint"
                aria-pressed={field.value === "complaint"}
                className={`${segBase} ${field.value === "complaint" ? segActive : segInactive}`}
                onClick={() => field.onChange("complaint")}
              >
                Reklamacja
              </button>
              <button
                type="button"
                data-testid="request-type-return"
                aria-pressed={field.value === "return"}
                className={`${segBase} ${field.value === "return" ? segActive : segInactive}`}
                onClick={() => field.onChange("return")}
              >
                Zwrot
              </button>
            </div>
          )}
        />
        {errors.requestType && <p className={errorClass}>{errors.requestType.message}</p>}
      </div>

      {/* Category */}
      <div ref={categoryFieldRef} data-testid="category-field" className={fieldWrapClass}>
        <label className={labelClass} htmlFor="case-form-category">
          Kategoria sprzętu
        </label>
        <select
          id="case-form-category"
          data-testid="category-select"
          aria-invalid={Boolean(errors.category)}
          className={controlClass}
          defaultValue=""
          {...register("category")}
        >
          <option value="" disabled>
            -- wybierz kategorię --
          </option>
          {categoryOptions().map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.category && <p className={errorClass}>{errors.category.message}</p>}
      </div>

      {/* Model name */}
      <div ref={modelNameFieldRef} data-testid="model-name-field" className={fieldWrapClass}>
        <label className={labelClass} htmlFor="case-form-model-name">
          Nazwa / model
        </label>
        <input
          id="case-form-model-name"
          data-testid="model-name-input"
          type="text"
          placeholder="np. Samsung Galaxy S24"
          aria-invalid={Boolean(errors.modelName)}
          className={controlClass}
          {...register("modelName")}
        />
        {errors.modelName && <p className={errorClass}>{errors.modelName.message}</p>}
      </div>

      {/* Purchase date */}
      <div ref={purchaseDateFieldRef} data-testid="purchase-date-field" className={fieldWrapClass}>
        <label className={labelClass} htmlFor="case-form-purchase-date">
          Data zakupu
        </label>
        <input
          id="case-form-purchase-date"
          data-testid="purchase-date-input"
          type="date"
          max={todayIsoDate()}
          aria-invalid={Boolean(errors.purchaseDate)}
          className={controlClass}
          {...register("purchaseDate")}
        />
        {errors.purchaseDate && <p className={errorClass}>{errors.purchaseDate.message}</p>}
      </div>

      {/* Reason */}
      <div ref={reasonFieldRef} data-testid="reason-field" className={fieldWrapClass}>
        <label className={labelClass} htmlFor="case-form-reason">
          Powód{" "}
          <span data-testid="reason-required-marker">
            {isComplaint ? "(wymagane)" : "(opcjonalne)"}
          </span>
        </label>
        <p data-testid="reason-helper" className={helperClass}>
          {isComplaint
            ? "Opisz na czym polega usterka lub uszkodzenie."
            : "Opcjonalnie opisz powód zwrotu."}
        </p>
        <textarea
          id="case-form-reason"
          data-testid="reason-textarea"
          rows={3}
          aria-invalid={Boolean(errors.reason)}
          className={textareaClass}
          {...register("reason")}
        />
        {errors.reason && <p className={errorClass}>{errors.reason.message}</p>}
      </div>

      {/* Photo */}
      <div ref={imageFieldRef} data-testid="image-field" className={fieldWrapClass}>
        <span className={labelClass}>Zdjęcie sprzętu</span>
        <p className={helperClass}>
          Akceptowane formaty: JPEG, PNG, WebP. Maksymalny rozmiar: 10 MB.
        </p>
        <div
          data-testid="image-dropzone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-input bg-transparent p-4 text-center"
        >
          <input
            ref={fileInputRef}
            id="case-form-image"
            data-testid="image-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileInputChange}
          />
          {previewUrl ? (
            <div className="flex items-center gap-3">
              <img
                data-testid="image-thumbnail"
                src={previewUrl}
                alt="Podgląd zdjęcia sprzętu"
                className="h-16 w-16 rounded-lg object-cover"
              />
              <div className="flex flex-col items-start gap-1">
                <span data-testid="image-filename" className="text-sm text-foreground">
                  {imageFile?.name}
                </span>
                <button
                  type="button"
                  data-testid="image-remove"
                  className={outlineButtonClass}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemoveImage();
                  }}
                >
                  Usuń ✕
                </button>
              </div>
            </div>
          ) : (
            <span className={helperClass}>Przeciągnij zdjęcie lub kliknij, aby wybrać plik</span>
          )}
        </div>
        {imageError && (
          <p data-testid="image-error" className={errorClass}>
            {imageError}
          </p>
        )}
      </div>

      <button type="submit" data-testid="submit-button" className={primaryButtonClass}>
        Analizuj zgłoszenie
      </button>
    </form>
  );
}
