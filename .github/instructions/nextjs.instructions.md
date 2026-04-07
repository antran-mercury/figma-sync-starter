# Next.js Instructions

Use these instructions for App Router or Pages Router implementations, routing, data fetching boundaries, metadata, and deployment-aware frontend decisions.

## Server and client boundaries

- Default to server-first thinking where appropriate.
- Add `use client` only when client-side interactivity is required.
- Do not accidentally move server-safe work into client bundles.
- Keep browser-only APIs inside client components.

## Data fetching

- Fetch data as close as practical to where it is needed while preserving cache and reuse opportunities.
- Avoid unnecessary client-side fetching for content that can be resolved on the server.
- Be explicit about caching, revalidation, and dynamic behavior.

## Routing and layouts

- Use nested layouts intentionally.
- Preserve route segment clarity.
- Keep route-level loading and error handling present for meaningful user feedback.

## SEO and metadata

- Use semantic headings.
- Set metadata intentionally.
- Consider Open Graph, canonical URLs, and crawlability for public pages.

## Review focus

- server/client boundary correctness
- hydration mismatch risks
- caching and revalidation correctness
- route-level UX completeness
- bundle size impact of client components
