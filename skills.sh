#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# APEX Agent Skills Registry — skills.sh
# Each skill defines expertise the agent can pull and apply dynamically.
# Format: # SKILL: <name> followed by instructions
# ═══════════════════════════════════════════════════════════════════════

# SKILL: Performance Optimization
# Trigger: bundle size, slow load, performance, lighthouse, core web vitals
# Priority: HIGH

## Analysis Steps
1. Check bundle size with `npx next build` or `npx webpack-bundle-analyzer`
2. Identify largest chunks and dependencies
3. Look for missing code splitting (React.lazy, dynamic imports)
4. Check image formats (prefer WebP/AVIF with next/image)
5. Verify font loading strategy (display: swap, preload critical fonts)
6. Check for unnecessary polyfills
7. Audit third-party scripts (defer/async, loading strategy)

## Auto-Fix Actions
- Add dynamic() imports for heavy components not in critical path
- Convert images to next/image with proper sizing and formats
- Add `loading="lazy"` to below-fold images
- Implement route-based code splitting
- Add resource hints: preconnect, prefetch, preload
- Configure compression (gzip/brotli in next.config.js)
- Enable ISR or SSG where applicable

## Code Templates
```typescript
// Dynamic import pattern
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false,
});

// Image optimization
<Image
  src="/hero.jpg"
  alt="Descriptive alt text"
  width={1200}
  height={600}
  priority // only for above-fold
  placeholder="blur"
  blurDataURL={shimmer(1200, 600)}
/>
```

# SKILL: Accessibility Audit
# Trigger: accessibility, a11y, wcag, screen reader, aria
# Priority: CRITICAL

## Analysis Steps
1. Check all img elements have alt attributes
2. Verify all interactive elements are keyboard-accessible
3. Check heading hierarchy (h1 → h2 → h3, no skips)
4. Verify form inputs have associated <label> elements
5. Check color contrast ratios (4.5:1 text, 3:1 large text)
6. Verify focus indicators are visible
7. Check for proper ARIA roles and live regions
8. Verify skip-to-content link exists
9. Check all modals trap focus correctly
10. Verify language attribute on <html>

## Auto-Fix Actions
- Add missing alt attributes (contextual, not "image of")
- Add aria-label to icon buttons
- Fix heading hierarchy
- Add focus-visible styles
- Add skip-to-content link
- Add aria-live regions for dynamic content
- Wrap form inputs with proper labels
- Add role="alert" to error messages

## Code Templates
```tsx
// Skip to content
<a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded">
  Skip to main content
</a>

// Icon button with label
<button aria-label="Close menu" onClick={onClose}>
  <XIcon aria-hidden="true" />
</button>

// Live region for updates
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>
```

# SKILL: Security Hardening
# Trigger: security, xss, csrf, csp, vulnerability, auth, token
# Priority: CRITICAL

## Analysis Steps
1. Scan for hardcoded API keys, secrets, tokens in source
2. Check for proper CSP headers in next.config.js or middleware
3. Verify dangerouslySetInnerHTML usage is sanitized
4. Check authentication token storage (cookies > localStorage)
5. Verify CORS configuration
6. Check dependency vulnerabilities (npm audit)
7. Verify rate limiting on API routes
8. Check for SQL injection vectors (if applicable)
9. Verify proper HTTPS enforcement

## Auto-Fix Actions
- Move secrets to environment variables
- Add .env to .gitignore
- Configure CSP headers
- Add DOMPurify for any HTML rendering
- Switch token storage to httpOnly cookies
- Add rate limiting middleware
- Enable strict CORS policy

## Code Templates
```typescript
// next.config.js security headers
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline';" },
];

// Middleware rate limiting pattern
const rateLimit = new Map();
export function rateLimiter(ip: string, limit = 10, window = 60000) {
  const now = Date.now();
  const record = rateLimit.get(ip) || { count: 0, start: now };
  if (now - record.start > window) { record.count = 0; record.start = now; }
  record.count++;
  rateLimit.set(ip, record);
  return record.count <= limit;
}
```

# SKILL: Modern Architecture Patterns
# Trigger: architecture, refactor, component, pattern, state management, prop drilling
# Priority: HIGH

## Analysis Steps
1. Identify god components (>300 lines, >5 responsibilities)
2. Check for prop drilling (>2 levels deep)
3. Verify error boundary placement
4. Assess state management approach
5. Check for proper separation of concerns
6. Verify custom hook extraction patterns
7. Check for barrel exports and module boundaries
8. Assess API layer abstraction

## Auto-Fix Actions
- Break god components into composable pieces
- Extract shared logic into custom hooks
- Implement compound component patterns
- Add error boundaries at route and feature levels
- Introduce proper state management if needed
- Create proper API abstraction layer

# SKILL: Testing Strategy
# Trigger: test, testing, jest, vitest, playwright, cypress, coverage
# Priority: HIGH

## Analysis Steps
1. Check test runner configuration (jest.config / vitest.config)
2. Verify test file co-location with source
3. Check for testing utilities (render helpers, mock factories)
4. Assess coverage thresholds
5. Verify E2E test setup
6. Check for CI test pipeline

## Auto-Fix Actions
- Set up Vitest with React Testing Library
- Add test templates for common patterns
- Configure coverage thresholds (80% branches, 90% lines)
- Add Playwright for critical path E2E
- Add test scripts to package.json

# SKILL: SEO Optimization
# Trigger: seo, meta tags, og, sitemap, structured data, robots
# Priority: MEDIUM

## Analysis Steps
1. Check for proper meta tags (title, description, viewport)
2. Verify OpenGraph and Twitter card tags
3. Check for sitemap.xml generation
4. Verify robots.txt configuration
5. Check for structured data (JSON-LD)
6. Verify proper semantic HTML usage
7. Check for canonical URLs

## Auto-Fix Actions
- Add comprehensive meta tags
- Generate dynamic OG images
- Create sitemap.xml
- Add JSON-LD structured data
- Fix semantic HTML issues

# SKILL: DX Enhancement
# Trigger: developer experience, dx, lint, format, typescript, prettier, husky
# Priority: MEDIUM

## Analysis Steps
1. Check TypeScript configuration (strict mode)
2. Verify ESLint setup and rules
3. Check Prettier configuration
4. Verify git hooks (husky + lint-staged)
5. Check for .env documentation
6. Verify README completeness
7. Check for proper VS Code settings

## Auto-Fix Actions
- Enable TypeScript strict mode
- Add/fix ESLint configuration
- Add Prettier with team conventions
- Set up husky + lint-staged
- Add .env.example with documentation
- Generate comprehensive README
