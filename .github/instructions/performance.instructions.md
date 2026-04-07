# Frontend Performance Instructions

Use these instructions when reviewing or implementing performance-sensitive frontend code.

## Performance mindset

- Optimize based on likely bottlenecks, not folklore.
- Prefer measuring critical paths when possible.
- Focus on rendering cost, bundle size, network waterfalls, and interaction responsiveness.

## Common targets

- avoid unnecessary re-renders
- reduce large client bundles
- defer non-critical code
- optimize lists and expensive trees
- minimize layout shifts
- optimize images and assets

## Implementation guidance

- Use code splitting where it improves real user experience.
- Avoid shipping server-safe logic to the client.
- Virtualize long lists when necessary.
- Memoize expensive calculations only when the cost is real.
- Keep data transformations outside hot render paths when possible.

## Review focus

- rerender triggers
- over-bundling
- oversized dependencies
- layout thrashing risks
- image optimization gaps
- blocking work during user interactions
