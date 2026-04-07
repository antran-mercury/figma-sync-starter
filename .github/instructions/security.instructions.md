# Frontend Security Instructions

Use these instructions when handling authentication-aware UI, browser storage, user-generated content, forms, and client-server interaction patterns.

## Security principles

- Treat all client-side data as untrusted.
- Never rely on the frontend as the sole enforcement layer for authorization.
- Minimize exposure of secrets and sensitive tokens.
- Avoid unsafe HTML rendering unless content is sanitized by a trusted pipeline.

## Common frontend risks

- XSS through unsanitized HTML or dangerous interpolation
- insecure token storage choices
- leaking sensitive data in logs or URLs
- open redirects
- unsafe file handling flows
- CSRF assumptions in browser-based auth flows
- overly permissive client-side feature gating

## Implementation guidance

- Prefer secure defaults for forms and links.
- Review any `dangerouslySetInnerHTML` usage critically.
- Be careful with query parameters and redirect targets.
- Do not expose internal errors or sensitive payloads unnecessarily.

## Review focus

- XSS surfaces
- unsafe HTML rendering
- auth and session handling assumptions
- sensitive data exposure
- redirect validation
- file upload UX and validation gaps
