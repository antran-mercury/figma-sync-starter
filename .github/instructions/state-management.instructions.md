# State Management Instructions

Use these instructions for local state, Redux, Zustand, and shared state architecture.

## Decision rules

- Use component state for local interaction concerns.
- Use context sparingly for stable cross-tree dependencies.
- Use Zustand for lightweight shared client state when ergonomics matter.
- Use Redux when predictable event-driven state transitions, middleware, or large-scale debugging justify it.

## Store design

- Keep stores focused by domain.
- Normalize complex entity collections when it reduces duplication and update complexity.
- Keep async state explicit.
- Avoid overly generic action names and ambiguous mutations.

## Selectors and subscriptions

- Use selectors to isolate consumption.
- Avoid subscribing broad component trees to large store slices.
- Derive data near the selector boundary when helpful.

## Review focus

- unnecessary global state
- duplicated state
- selector granularity
- mutation safety
- action naming clarity
- coupling between store and UI
