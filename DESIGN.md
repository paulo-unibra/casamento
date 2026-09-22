# Design System — Paulo & Priscila

## Direction

An editorial gallery programme: intimate, composed, and contemporary. The interface should feel authored for this couple, not assembled from a wedding template. Use strong typographic contrast, rectangular photography, asymmetric grids, fine rules, and generous negative space.

## Principles

1. Information first: date, place, RSVP, and gifts must scan quickly.
2. One expressive gesture per section: large type, a photograph, or a botanical accent—not all three competing.
3. Real photography carries emotion. Orchids are a signature, not a repeated decoration.
4. Prefer flat editorial surfaces and rules over cards, shadows, arches, pills, and gradients.
5. Keep language warm, direct, and specific.

## Tokens

| Role | Value | Use |
| --- | --- | --- |
| Paper | `#f1f2ee` | Main page ground |
| Paper light | `#fafbf8` | Hero and alternating editorial surfaces |
| Ink | `#273024` | Primary text and rules |
| Olive | `#344333` | RSVP and high-contrast sections |
| Olive soft | `#dfe2d6` | Celebration and secondary surfaces |
| Fuchsia | `#b72b6d` | Primary action and orchid-derived accent |
| Fuchsia dark | `#8f1f53` | Accessible accent text and hover states |
| Muted | `#50554e` | Secondary text |

Rules use `rgba(39, 48, 36, .22)`. Corners remain square unless a native control or compact payment-method tag benefits from another shape.

## Typography

- Display: **Bodoni Moda**, 400–500. Use for names, section titles, numerals, and short emotional statements.
- Interface/body: **Manrope**, 400–600. Use for navigation, details, forms, and long copy.
- Display headings use tight leading (`.84–.95`) and modest negative tracking.
- Functional text stays at 11px or larger; body copy is normally 16px.
- Avoid cursive wedding fonts, tracked all-caps paragraphs, and stacked micro-labels above every heading.

## Layout and spacing

- Desktop hero is a split composition: copy at roughly 36%, image in the remaining space.
- Main sections use asymmetric two-column grids and full-width rules instead of repeated containers.
- Section padding scales from 96px to 150px vertically and 24px to 108px horizontally.
- Mobile collapses to one column at 820px. Primary content comes before imagery where it improves scanning.
- Keep touch targets at least 44px high and preserve visible focus states.

## Imagery

- The main image is `assets/paulo-priscila-hero.webp` and must never be replaced by remote settings.
- Use `cover` with a centered mobile crop so both faces remain visible.
- The story image may be updated by site settings; its local fallback is `assets/paulo-priscila-historia.webp` and must remain a photograph of the couple.
- Use `assets/orquideas-hero.webp` only as the restrained hero signature.
- Do not introduce stock romantic photography, decorative arches, or repeated floral frames.

## Components and interaction

- Header: quiet horizontal navigation, monogram at left, RSVP at right; mobile menu replaces links below 820px.
- Buttons: rectangular, high-contrast, clear verb, restrained arrow cue.
- Event details: timeline-like rows separated by rules, not cards.
- Gifts: image-led catalog cells with dynamic loading, error, retry, and checkout states.
- RSVP: dark olive field section with inline validation and live feedback.
- FAQ: native `details` disclosure with visible focus and simple plus rotation.
- Checkout: accessible modal with focus trap, Escape close, background `inert`, and restored focus.
- Motion is brief and purposeful; respect `prefers-reduced-motion`.

## Avoid

Cream-template palettes, glassmorphism, gradients, floating countdown cards, excessive rounding, icon-heavy feature cards, centered sections repeated throughout, ornamental scripts, generic stock imagery, and decorative elements without hierarchy or meaning.
