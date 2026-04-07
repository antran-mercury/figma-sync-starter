# Tailwind and Styling Instructions

Use these instructions for Tailwind CSS, styling architecture, component variants, theming, and responsive layout work.

## Styling principles

- Prefer semantic structure first, utility styling second.
- Keep utility usage readable and consistent.
- Extract repeated utility groups into helpers or component variants when repetition becomes noisy.
- Avoid fragile class stacks that are difficult to reason about.

## Responsive design

- Design mobile-first unless the product constraints require otherwise.
- Check spacing, overflow, wrapping, and touch targets.
- Ensure layouts degrade gracefully on narrow screens and large zoom levels.

## Component variants

- Prefer consistent variant systems for buttons, inputs, badges, alerts, and cards.
- Avoid ad hoc styling drift across similar UI elements.

## Accessibility and visual quality

- Preserve visible focus states.
- Maintain sufficient color contrast.
- Avoid relying on color alone to communicate meaning.
- Ensure hover-only affordances also have keyboard or touch-friendly alternatives.

## Review focus

- class readability
- responsive correctness
- consistency across variants
- theming compatibility
- focus visibility and contrast
