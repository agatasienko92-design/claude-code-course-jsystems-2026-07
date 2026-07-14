# Design Guidelines — Play (play.pl)

Design system extracted from the live [play.pl](https://www.play.pl) homepage on 2026-07-14 (Playwright: computed styles, `@font-face` rules, brand assets). Use these tokens when building UIs consistent with the Play brand.

## Assets

| Asset | Path (relative to `docs/`) | Notes |
|---|---|---|
| Design tokens (JSON) | [`../assets/design-tokens.json`](../assets/design-tokens.json) | Machine-readable source of truth |
| Logo (SVG) | [`../assets/logo.svg`](../assets/logo.svg) | Play wordmark, white letters on brand rectangle |
| Favicon | [`../assets/favicon.ico`](../assets/favicon.ico) | 48×48 ICO |
| Homepage screenshot | [`../assets/homepage.png`](../assets/homepage.png) | Visual reference of the extracted state |

## Colors

| Token | Hex | Usage |
|---|---|---|
| `brand.primary` | `#6C43BF` | Primary purple: buttons, active nav item, hero panels, icon accents |
| `brand.primaryDark` | `#3A2A78` | Darker purple: logo background, deep hero gradients |
| `brand.accent` | `#E6144B` | Play pink/red: "Nasz HIT" badges, promo highlights, price accents |
| `brand.link` | `#266DD9` | Inline text links |
| `background.default` | `#FFFFFF` | Page and card background |
| `background.light` | `#F5F5F5` | Alternate card / section background |
| `background.subtle` | `#FAFAFA` | Subtle section separation |
| `text.primary` | `#1F1F1F` | Default text (near-black, not pure black) |
| `text.secondary` | `#707070` | Secondary/muted text, captions |
| `text.onDark` | `#FFFFFF` | Text on purple/pink surfaces |
| `border.default` | `#D6D6D6` | Hairline borders (circle icon buttons, outlined cards) |

Rules of thumb: purple is the *action* color, pink is the *promotion* color — do not swap them. Text links are blue; buttons are never blue.

## Typography

- **Font:** `Manrope, Arial, sans-serif` — loaded via `@font-face` (woff2) in three weights:
  - 500 (`Manrope-Regular.woff2`) — body default ("regular" on this site is 500)
  - 600 (`Manrope-SemiBold.woff2`) — emphasis
  - 700 (`Manrope-Bold.woff2`) — headings' bold spans, badges, active nav
- **Scale (computed on desktop):** body `12px/18px`; small nav `9–10.5px`; section headings (h2) `40px/60px` weight 500; card headings (h3) `18px`; display prices very large (60px+) weight 700.
- Headlines mix weight 500 with bold 700 spans for emphasis (e.g. "Smartfony **do 50% taniej**").

## Spacing

4px base unit. Common values: 4 / 8 / 12 / 16 / 20 / 24 / 32. Buttons use `0 18px` horizontal padding with height controlling the vertical size.

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `xs` | `3px` | Small badges ("Nasz HIT") |
| `sm` | `5px` | Small controls, carousel dots |
| `md` | `6px` | Buttons (primary and secondary) |
| `lg` | `12px` | Cards, hero panels, promo tiles |
| `circle` | `50%` | Icon buttons (carousel arrows, phone/chat FABs) |

## Components

- **Primary button:** purple `#6C43BF` background, white text, radius 6px, padding `0 18px`, weight 500, no border.
- **Secondary button:** white background, purple `#6C43BF` text and 1px purple border, radius 6px (same geometry as primary).
- **Icon circle button:** white background, `1px solid #D6D6D6` border, `50%` radius (carousel navigation); floating action buttons (phone, chat) use solid purple circles.
- **Promo badge:** pink `#E6144B` background, white bold text, radius 3px, small caps-height label ("Nasz HIT").
- **Header:** white background; top utility nav in very small type; main nav dark text weight 500, active item purple weight 700; logo at left.
- **Cards/tiles:** white or `#F5F5F5` background, radius 12px, generous padding; hero tiles use full purple background with white text.
- **Links:** blue `#266DD9`, no underline by default.

## Logo Usage

- `assets/logo.svg` is the Play wordmark: white "PLAY" letters on a dark-purple rectangle. It carries its own background — place it directly on light backgrounds without modification.
- On dark/purple surfaces keep the logo's own rectangle; do not recolor the letters.
- Favicon (`assets/favicon.ico`) for browser tabs.

## Visual Style Summary

Play's design is bright, high-contrast, and commercially energetic: a white canvas with light-gray cards, dominated by a saturated purple used for every actionable element and hero surface, punctuated by pink promo badges and price accents. Typography is a single friendly geometric sans (Manrope) at a compact base size, jumping to very large bold numerals for prices and offers. Corners are consistently soft (6px controls, 12px cards, full circles for icon actions), giving a rounded, approachable feel despite dense promotional content. The overall impression: consumer-telecom retail — loud offers kept tidy by a strict two-accent palette and disciplined component geometry.
