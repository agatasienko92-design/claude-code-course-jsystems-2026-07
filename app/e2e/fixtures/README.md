# E2E fixtures

Synthetic (generated) files used by Playwright E2E specs. None depict real
equipment — all are programmatically produced stand-ins so fixtures can live
in the repo without external assets. They were generated once with a
throwaway Node + `sharp` script (not kept in the repo, to avoid clutter) —
the 4 files below are the checked-in artifacts.

| File | Purpose | Format | Actual size |
|---|---|---|---|
| `damaged-device.jpg` | Stand-in "damaged device" photo — valid upload used by happy-path complaint scenarios (later phases). | JPEG, 800x600 | ~19.6 KB |
| `clean-device.jpg` | Stand-in "clean/undamaged device" photo — valid upload used by happy-path return scenarios (later phases). | JPEG, 800x600 | ~20.2 KB |
| `oversized-14mb.jpg` | File larger than the 10 MB upload limit (PRD AC-07) — used to assert client-side size rejection. Valid JPEG content (2600x2000, high-entropy random pixels so it does not compress back under 10 MB). | JPEG | ~14.5 MB (15,180,842 bytes) |
| `unsupported.gif` | File with an unsupported MIME type (PRD AC-06 only allows JPEG/PNG/WebP) — used to assert client-side type rejection. A real, valid GIF89a file (not a renamed JPEG). | GIF | 44 bytes |

None of these fixtures are wired into runnable specs yet beyond the form
smoke test — the case form itself lands in a later phase. They exist now so
that phase can drop in file-upload E2E scenarios (ADR-002 §8) without
needing to also produce test assets at that time.
