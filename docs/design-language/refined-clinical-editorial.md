# Refined Clinical Editorial Design Language

## Intent

Stochi should feel precise, premium, and clinically trustworthy.
The UI should read like a scientific publication with fast operational controls,
not a gamer dashboard.

## Core Principles

- Dark-first, high-legibility surfaces with restrained contrast steps.
- Typography hierarchy drives clarity before color does.
- Semantic design tokens are the source of truth.
- Motion is purposeful and sparse.
- Status color is functional, never decorative.

## Token Contract

Primary semantic tokens live in `apps/web/src/styles/globals.css`:

- Surfaces: `--surface-0` to `--surface-3`
- Text: `--text-primary`, `--text-secondary`, `--text-tertiary`
- Accents: `--accent-data`, `--accent-info`, `--accent-warning`, `--accent-danger`
- Focus and elevation: `--focus-ring`, `--elevation-1`, `--elevation-2`
- Motion: `--motion-fast`, `--motion-base`, `--motion-slow`

All primitives should map through shadcn variables (`--background`, `--card`, `--muted`, etc.) rather than hardcoding colors.

## Typography

- Body: Manrope via `--font-body`
- Display: Cormorant Garamond via `--font-heading`
- Mono data: JetBrains Mono via `--font-mono`

Usage guidance:

- `.font-display` for key headlines and section anchors.
- `font-sans` for UI copy, labels, and controls.
- `font-mono` for numeric values, dosages, timestamps, and compact telemetry.
- `.text-editorial-kicker` for uppercase micro-headings.

## Component Rules

- Buttons: use tokenized states and consistent focus rings.
- Cards: use `bg-card`, `border-border`, and tokenized elevation.
- Inputs/dialogs/badges: no hardcoded black/white surfaces.
- Active navigation state must expose `aria-current="page"`.

## Motion and Accessibility

- Use tokenized durations and avoid ad-hoc easing values.
- Keep one clear entrance choreography per page section; avoid stacked micro-motion.
- Respect `prefers-reduced-motion: reduce` globally.
- Ensure keyboard users always get visible `:focus-visible` affordances.

## Do / Don't

Do:

- Build new UI from semantic tokens.
- Keep visual hierarchy through spacing + type scale first.
- Use status colors only for warning/info/critical meaning.

Don't:

- Reintroduce hardcoded `#0A0A0A` and `border-white/10` patterns in primitives.
- Use Inter/Arial/system defaults for primary UI.
- Add decorative gradients/glows without product meaning.
