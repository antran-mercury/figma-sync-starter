# Frontend Architecture Instructions

Apply these instructions for general frontend implementation, code review, and refactoring tasks.

## Architecture principles

- Separate UI rendering, state orchestration, and data access concerns.
- Prefer feature-oriented folders when the application is large.
- Keep shared UI primitives independent from domain-specific business logic.
- Prefer container and presentational separation when it meaningfully reduces complexity.
- Extract hooks for reusable stateful behavior.
- Extract utilities for deterministic, pure transformations.

## Component design

- Build components around a single responsibility.
- Keep prop APIs minimal and predictable.
- Prefer controlled components for form-heavy flows when state synchronization matters.
- Avoid boolean prop explosions; prefer variants or composition.
- Co-locate small styles, tests, and stories with the component when the project allows it.

## State guidance

- Keep local UI state local.
- Move cross-page or cross-feature state into a dedicated store only when necessary.
- Avoid mirroring server data into global state unless there is a clear need.
- Derive display values rather than storing them redundantly.

## Async UX

Every data-driven screen should consider:

- loading state
- error state
- empty state
- retry path
- optimistic or pessimistic updates when relevant

## Review focus

When reviewing frontend code, inspect:

- component complexity
- state ownership
- event flow clarity
- rendering performance
- accessibility semantics
- responsive layout behavior
- testability
