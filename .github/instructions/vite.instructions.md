# Vite Instructions

Use these instructions for Vite-based applications, tooling, development workflow, and build configuration.

## Build and tooling principles

- Keep Vite configuration minimal and purposeful.
- Introduce plugins only when they provide clear value.
- Avoid configuration sprawl for simple needs.

## Performance guidance

- Watch bundle growth and vendor chunking behavior.
- Review large dependencies before adding them.
- Favor tree-shakeable libraries.

## DX guidance

- Keep aliases, environment variables, and test integration consistent.
- Ensure TypeScript, Vitest, and path resolution stay aligned.

## Review focus

- config clarity
- unnecessary plugin usage
- env handling safety
- build performance
- compatibility with Vitest and path aliases
