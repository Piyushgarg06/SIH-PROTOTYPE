# MISR Demo — Ink-Black Mission Control Design System

## Color Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#0B0C0E` | Page background |
| `bg-secondary` | `#111214` | Section backgrounds |
| `surface` | `#17181B` | Panel surface |
| `border` | `#2A2C30` | 1px hairline borders |
| `grid` | `#232529` | Grid/divider lines |
| `accent` | `#D97840` | Primary accent (terracotta) |
| `accent-secondary` | `#E8A33D` | Secondary accent (amber, sparse) |
| `olive` | `#7A9B6E` | Selected/positive state |
| `brick` | `#B5544A` | Rejected/negative state |
| `text-primary` | `#E7E5E1` | Primary text (off-white) |
| `text-secondary` | `#8C8A85` | Secondary text (warm gray) |

## Typography

- **Monospace** (JetBrains Mono): All numeric/telemetry — coordinates, scores, band values, dates
- **Sans** (Inter): Headings, labels, body text

## Layout Rules

- Max border radius: `rounded-md` (6px)
- Dense instrument-panel information density
- Thin-border grid segmentation (no floating cards, no drop shadows)
- Uppercase monospace section labels: `RANKING · TILE_00482`
- Transitions: 150–200ms, ease-out (no bounce/spring)

## Badge System

- `DATA` badge: olive outline, solid fill
- `SIMULATED` badge: terracotta outline, hatch/dotted texture
- `CONCEPTUAL` badge: terracotta outline, dotted border

## Banned Elements

- Default Tailwind blue/indigo/violet
- Glassmorphism blur
- `rounded-3xl` shadow cards
- Emoji as icons
- AI sparkle iconography
- Centered gradient-text hero sections
- Particle/glow effects
- Bounce/spring easing
