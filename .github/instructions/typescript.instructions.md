# TypeScript Instructions

Use these instructions for all TypeScript code generation and review.

## Type safety principles

- Prefer precise types over broad ones.
- Model domain concepts explicitly.
- Use discriminated unions for state machines and status-driven UI flows.
- Prefer `unknown` over `any` at untrusted boundaries.
- Narrow types early and safely.

## API and model design

- Keep public types intentional and stable.
- Avoid leaking transport-layer shapes deep into UI code when a mapped domain model is clearer.
- Prefer readonly intent where it improves safety.

## Implementation guidance

- Let inference work when it remains clear.
- Add explicit annotations for exported APIs, complex return values, and reusable hooks.
- Avoid type assertions unless narrowing or interoperability requires them.
- Prefer utility types when they clarify intent instead of obscuring it.

## Review focus

- accidental `any`
- unsafe assertions
- nullable edge cases
- type drift between UI and data models
- weakly typed events and callbacks
