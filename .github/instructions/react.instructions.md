# React Instructions

Use these instructions for React components, hooks, rendering patterns, and composition decisions.

## Preferred patterns

- Use function components and hooks.
- Keep hooks top-level and deterministic.
- Use custom hooks to encapsulate reusable behavior and side-effect orchestration.
- Prefer composition over inheritance and over-configured abstractions.
- Keep JSX readable; extract subcomponents when a render block becomes dense.

## Hooks guidance

- Use `useMemo` and `useCallback` only when they provide measurable or structural value.
- Do not use memoization as a reflex.
- Keep effect dependencies correct.
- Avoid effects for purely derived computations.
- Prefer event handlers or derived variables over effect-driven state synchronization.

## Rendering guidance

- Minimize unnecessary parent-driven re-renders.
- Use stable keys.
- Avoid inline object and array creation in performance-sensitive trees unless harmless.
- Guard expensive rendering paths.

## Forms and events

- Keep form flows predictable and typed.
- Normalize event handling and validation paths.
- Ensure keyboard interactions work correctly.

## Review focus

- hook correctness
- stale closure risks
- effect misuse
- component reusability
- memoization misuse
- render cost hotspots
