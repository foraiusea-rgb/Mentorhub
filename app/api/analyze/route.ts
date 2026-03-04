import { NextRequest, NextResponse } from "next/server";
import FrontendAgent from "@/lib/agent-engine";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { repoUrl, apiKey, githubToken, model } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: "OpenRouter API key required" }, { status: 400 });
    }
    if (!repoUrl) {
      return NextResponse.json({ error: "Repository URL required" }, { status: 400 });
    }

    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/\s#?]+)/);
    if (!match) {
      return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 });
    }

    const [, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, "");

    const agent = new FrontendAgent(apiKey, model || "deepseek/deepseek-r1-0528:free");

    const defaultSkills = `
# SKILL: Performance Optimization
Analyze bundle sizes, implement code splitting with React.lazy and dynamic imports.
Check for unnecessary re-renders with React DevTools profiler patterns.
Implement virtualization for long lists using react-window or react-virtuoso.
Add image optimization with next/image or responsive srcset.

# SKILL: Accessibility Audit
Check all interactive elements have proper ARIA labels.
Verify keyboard navigation works for all focusable elements.
Ensure color contrast ratios meet WCAG 2.1 AA (4.5:1 for text, 3:1 for large text).
Check for proper heading hierarchy (h1 > h2 > h3, no skips).
Verify form inputs have associated labels.

# SKILL: Security Hardening
Scan for exposed API keys or secrets in source code.
Check for proper CSP headers configuration.
Verify all user inputs are sanitized (XSS prevention).
Check dependency vulnerabilities with npm audit patterns.
Ensure authentication tokens are stored securely (httpOnly cookies, not localStorage).

# SKILL: Modern Architecture
Evaluate component composition patterns (compound components, render props, hooks).
Check for proper state management (avoid prop drilling > 2 levels).
Verify error boundary implementation at route and feature levels.
Assess data fetching patterns (SWR/React Query for client, RSC for server).

# SKILL: Testing Coverage
Check for unit test files alongside components.
Verify integration test patterns for critical user flows.
Assess E2E testing setup (Playwright/Cypress).
Check for proper mock patterns and test utilities.

# SKILL: DX Enhancement
Verify TypeScript strict mode and proper type coverage.
Check for ESLint + Prettier configuration.
Assess git hooks (husky/lint-staged) for pre-commit checks.
Verify proper .env handling and documentation.
`;

    agent.loadSkills(defaultSkills);

    const analysis = await agent.scanRepository(owner, cleanRepo, githubToken);
    const state = agent.getState();

    return NextResponse.json({
      success: true,
      analysis,
      logs: state.logs,
      skills: state.skills.map((s: any) => ({ name: s.name, description: s.description })),
    });
  } catch (error: any) {
    console.error("Scan error:", error);
    return NextResponse.json({ error: error.message || "Scan failed" }, { status: 500 });
  }
}
