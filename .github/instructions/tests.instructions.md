# Testing Instructions

Use these instructions for unit, integration, component, and end-to-end testing with Vitest, Jest, Cypress, and Playwright.

## Testing strategy

- Test user-visible behavior and contract-critical logic.
- Prefer robust tests over implementation-coupled tests.
- Cover the highest-risk paths first.
- Keep the testing pyramid balanced across logic, components, and end-to-end flows.

## Unit and component tests

- Use Vitest or Jest for pure logic, hooks, and components.
- Test behavior, not internal implementation details.
- Prefer queries that resemble user interaction patterns.

## End-to-end tests

- Use Cypress or Playwright for critical user journeys.
- Keep tests deterministic and isolated.
- Avoid brittle selectors; prefer role, label, and stable test ids where necessary.

## Review focus

- missing critical-path coverage
- brittle assertions
- over-mocking
- poor test naming
- flaky async handling
- inadequate edge-case coverage
