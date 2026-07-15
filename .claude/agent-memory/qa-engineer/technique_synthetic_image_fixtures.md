---
name: technique-synthetic-image-fixtures
description: How to generate valid JPEG/oversized/invalid-type image fixtures for Playwright upload tests without checking in a generator script or external assets.
metadata:
  type: feedback
---

For Playwright file-upload E2E fixtures that need to be real, valid files
(per AGENTS.md — E2E mocks nothing, so fixtures must be genuine, not just
correctly-named), this approach worked well and is worth repeating:

- **Valid small photo stand-ins**: `sharp(svgBuffer).jpeg({quality: 85})`,
  where `svgBuffer` is a hand-written SVG string (solid background + border
  + `<text>` label) piped through sharp's SVG rasterizer. No external image
  assets needed; ~20 KB output.
- **A file that must exceed a size limit (e.g. >10 MB) while still being a
  genuinely valid image**: generate high-entropy raw pixels
  (`crypto.randomBytes(width*height*3)`), feed to
  `sharp(raw, {raw:{width,height,channels:3}})`, encode as
  `.jpeg({quality: 100, chromaSubsampling: "4:4:4"})`. Random noise resists
  JPEG's DCT compression even at max quality, so a modest resolution
  (2600x2000 gave ~14.5 MB) reliably clears a 10 MB threshold — no need to
  pad the file with garbage bytes that would make it an invalid JPEG.
- **A file with a real-but-unsupported type (e.g. `.gif`)**: sharp does not
  reliably encode GIF output across versions — instead hardcode a minimal
  valid GIF89a as a base64 literal (`R0lGODlhAgACAPAAAP8AAAAAACH5BAEAAAAALAAAAAACAAIAAAIDhI9WADs=`
  decodes to a real 2x2 GIF, 44 bytes) and `writeFileSync` the decoded
  buffer. Guarantees the file is genuinely parseable as GIF, not just
  renamed.

**Why:** the project's E2E policy explicitly forbids mocking, which extends
to fixtures — a fake/corrupted file could pass a naive "reject non-image"
check for the wrong reason (parse failure vs. real type/size rejection
logic), producing a false-positive test.

**How to apply:** write the generator as a temporary script (e.g.
`e2e/fixtures/_generate.mjs`), run it once with `node` from the app dir (so
`sharp` resolves from local `node_modules`), then delete the script and
commit only the produced fixture files + a README documenting each one's
purpose/size/format. Related: [[project-course-worktree-phasing]].
