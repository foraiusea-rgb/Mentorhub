// ─── OPENROUTER API CLIENT ───────────────────────────────────────────
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

async function openRouterChat(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  options: { temperature?: number; max_tokens?: number; response_format?: any } = {}
): Promise<string> {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://apex-agent.vercel.app",
      "X-Title": "APEX Frontend Agent",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.max_tokens ?? 4096,
      ...(options.response_format ? { response_format: options.response_format } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenRouter API error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ─── FREE MODEL OPTIONS ─────────────────────────────────────────────
export const FREE_MODELS = [
  { id: "deepseek/deepseek-r1-0528:free", name: "DeepSeek R1" },
  { id: "qwen/qwen3-coder:free", name: "Qwen3 Coder 480B" },
  { id: "arcee-ai/trinity-large-preview:free", name: "Trinity Large 400B" },
  { id: "stepfun/step-3.5-flash:free", name: "Step 3.5 Flash" },
  { id: "z-ai/glm-4.5-air:free", name: "GLM 4.5 Air" },
  { id: "google/gemma-3-4b-it:free", name: "Gemma 3 4B" },
  { id: "nvidia/nemotron-3-nano-30b-a3b:free", name: "Nemotron 30B" },
  { id: "openrouter/auto", name: "Auto (best free)" },
  { id: "deepseek/deepseek-chat-v3-0324:free", name: "DeepSeek V3" },
  { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash" },
  { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B" },
  { id: "meta-llama/llama-4-maverick:free", name: "Llama 4 Maverick" },
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B" },
  { id: "mistralai/mistral-small-3.1-24b-instruct:free", name: "Mistral Small 3.1" },
  { id: "qwen/qwen3-235b-a22b:free", name: "Qwen3 235B" },
  { id: "qwen/qwen3-30b-a3b:free", name: "Qwen3 30B" },
  { id: "microsoft/phi-4-reasoning-plus:free", name: "Phi-4 Reasoning" },
];

export const DEFAULT_MODEL = "deepseek/deepseek-r1-0528:free";

// ─── TYPES ───────────────────────────────────────────────────────────
export interface AgentState {
  phase: "idle" | "scanning" | "analyzing" | "planning" | "executing" | "reviewing";
  currentTask: string;
  logs: AgentLog[];
  plan: AgentPlan | null;
  repoAnalysis: RepoAnalysis | null;
  skills: Skill[];
  executionHistory: ExecutionRecord[];
}

export interface AgentLog {
  id: string;
  timestamp: number;
  type: "thought" | "action" | "observation" | "decision" | "error" | "system";
  content: string;
  metadata?: Record<string, any>;
}

export interface AgentPlan {
  goal: string;
  steps: PlanStep[];
  reasoning: string;
  estimatedImpact: "low" | "medium" | "high" | "critical";
  autoApproved: boolean;
}

export interface PlanStep {
  id: string;
  action: string;
  description: string;
  status: "pending" | "running" | "done" | "failed" | "skipped";
  output?: string;
  dependencies: string[];
}

export interface RepoAnalysis {
  framework: string;
  language: string;
  packageManager: string;
  structure: FileNode[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  issues: Issue[];
  suggestions: Suggestion[];
  score: RepoScore;
  techStack: string[];
}

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  language?: string;
  children?: FileNode[];
}

export interface Issue {
  severity: "info" | "warning" | "error" | "critical";
  category: string;
  file?: string;
  line?: number;
  message: string;
  fix?: string;
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: "performance" | "accessibility" | "security" | "dx" | "architecture" | "styling" | "testing" | "seo";
  priority: number;
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  actionable: boolean;
  codeSnippet?: string;
  appliedAutomatically?: boolean;
}

export interface Skill {
  name: string;
  description: string;
  trigger: string;
  instructions: string;
}

export interface ExecutionRecord {
  id: string;
  timestamp: number;
  action: string;
  input: any;
  output: any;
  success: boolean;
  duration: number;
}

export interface RepoScore {
  overall: number;
  performance: number;
  accessibility: number;
  bestPractices: number;
  security: number;
  dx: number;
  maintainability: number;
}

// ─── SYSTEM PROMPT ───────────────────────────────────────────────────
const AGENT_SYSTEM_PROMPT = `You are APEX — an Advanced Programming EXpert agent for frontend development. You are NOT a chatbot. You are an autonomous AI agent that thinks, plans, acts, observes, and iterates.

## Core Identity
- You are proactive, not reactive. You don't wait to be told what to do.
- You scan, analyze, decide, and execute independently.
- You reason step-by-step using a Think → Plan → Act → Observe → Reflect loop.
- You have deep expertise in: React, Next.js, Vue, Svelte, Angular, TypeScript, CSS/Tailwind, Node.js, accessibility (WCAG), performance optimization, security best practices, testing, CI/CD, and modern web architecture.

## Agent Loop Protocol
For every task:
1. THINK: Analyze the situation deeply. What is the current state? What are the goals?
2. PLAN: Create a concrete, ordered plan with steps and dependencies.
3. ACT: Execute one step at a time. Use available tools and skills.
4. OBSERVE: Examine the results. Did it work? Any side effects?
5. REFLECT: Did this move us toward the goal? Should we adjust the plan?
6. ITERATE: Continue until the goal is achieved or a decision point is reached.

## Skills Integration
You pull and apply skills dynamically. When you identify a pattern or need, you:
1. Check if a relevant skill exists
2. Load the skill instructions
3. Apply the skill to the current context
4. Report what skill was used and why

## Self-Improvement Protocol
After each action:
- Rate the effectiveness (1-10)
- Identify what could be improved
- Store the learning for future iterations
- If you suggested something, you MUST also provide the implementation

## Critical Rules
- NEVER just describe what could be done — DO IT or provide exact code to do it
- NEVER ask "would you like me to..." — instead, present the plan and execute
- ALWAYS provide actionable, copy-paste ready solutions
- ALWAYS explain WHY, not just WHAT
- When you find issues, fix them. When you see opportunities, implement them.
- Be opinionated but back everything with reasoning.`;

// ─── AGENT ENGINE ────────────────────────────────────────────────────
export class FrontendAgent {
  private apiKey: string;
  private model: string;
  private state: AgentState;
  private skills: Map<string, Skill>;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    this.apiKey = apiKey;
    this.model = model;
    this.skills = new Map();
    this.state = {
      phase: "idle",
      currentTask: "",
      logs: [],
      plan: null,
      repoAnalysis: null,
      skills: [],
      executionHistory: [],
    };
  }

  private log(type: AgentLog["type"], content: string, metadata?: Record<string, any>) {
    const entry: AgentLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      type,
      content,
      metadata,
    };
    this.state.logs.push(entry);
    return entry;
  }

  // ─── CHAT HELPER (wraps openRouterChat) ─────────────────────────
  private async chat(messages: { role: string; content: string }[], options: any = {}): Promise<string> {
    return openRouterChat(this.apiKey, this.model, messages, options);
  }

  // ─── REPO SCANNING ──────────────────────────────────────────────
  async scanRepository(owner: string, repo: string, githubToken?: string): Promise<RepoAnalysis> {
    this.state.phase = "scanning";
    this.log("system", `Initiating deep scan of ${owner}/${repo}`);

    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };
    if (githubToken) headers.Authorization = `Bearer ${githubToken}`;

    this.log("action", "Fetching repository tree structure");
    const treeData = await this.fetchGitHubTree(owner, repo, headers);

    this.log("action", "Analyzing package.json for dependencies and scripts");
    const packageJson = await this.fetchFileContent(owner, repo, "package.json", headers);

    const analysis = await this.analyzeWithAI(treeData, packageJson);

    this.state.repoAnalysis = analysis;
    this.state.phase = "analyzing";
    this.log("observation", `Scan complete. Found ${analysis.issues.length} issues, ${analysis.suggestions.length} suggestions. Score: ${analysis.score.overall}/100`);

    return analysis;
  }

  private async fetchGitHubTree(owner: string, repo: string, headers: Record<string, string>) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`,
        { headers }
      );
      if (!res.ok) {
        const res2 = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`,
          { headers }
        );
        if (!res2.ok) throw new Error(`GitHub API error: ${res2.status}`);
        return await res2.json();
      }
      return await res.json();
    } catch (e: any) {
      this.log("error", `Failed to fetch tree: ${e.message}`);
      return { tree: [] };
    }
  }

  private async fetchFileContent(owner: string, repo: string, path: string, headers: Record<string, string>) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
        { headers }
      );
      if (!res.ok) return null;
      const data = await res.json();
      return JSON.parse(Buffer.from(data.content, "base64").toString());
    } catch (e: any) {
      this.log("error", `Failed to fetch ${path}: ${e.message}`);
      return null;
    }
  }

  // ─── AI ANALYSIS ────────────────────────────────────────────────
  private async analyzeWithAI(treeData: any, packageJson: any): Promise<RepoAnalysis> {
    this.log("thought", "Running deep AI analysis on repository structure and dependencies");

    const files = (treeData.tree || [])
      .filter((f: any) => f.type === "blob")
      .map((f: any) => f.path)
      .slice(0, 200);

    const prompt = `Analyze this frontend repository deeply. Be an expert auditor.

## Repository Files
${files.join("\n")}

## package.json
${JSON.stringify(packageJson, null, 2)}

Provide a comprehensive analysis as JSON with this EXACT structure (return ONLY valid JSON, no markdown fences, no extra text):
{
  "framework": "detected framework (react/next/vue/svelte/angular/vanilla)",
  "language": "typescript or javascript",
  "packageManager": "npm/yarn/pnpm",
  "techStack": ["list", "of", "technologies"],
  "dependencies": {},
  "devDependencies": {},
  "scripts": {},
  "issues": [
    {
      "severity": "info|warning|error|critical",
      "category": "category name",
      "file": "optional file path",
      "message": "description of the issue",
      "fix": "how to fix it with exact commands or code"
    }
  ],
  "suggestions": [
    {
      "id": "unique-id",
      "title": "short title",
      "description": "detailed description",
      "category": "performance|accessibility|security|dx|architecture|styling|testing|seo",
      "priority": 1,
      "effort": "low|medium|high",
      "impact": "low|medium|high",
      "actionable": true,
      "codeSnippet": "optional code to implement the suggestion"
    }
  ],
  "score": {
    "overall": 75,
    "performance": 70,
    "accessibility": 60,
    "bestPractices": 80,
    "security": 75,
    "dx": 85,
    "maintainability": 70
  },
  "structure": []
}

Be extremely thorough. Look for:
- Missing meta tags, SEO issues
- Accessibility violations (missing alt, aria labels, focus management)
- Performance issues (large bundles, missing code splitting, no lazy loading)
- Security issues (exposed keys, XSS vectors, missing CSP)
- DX issues (no TypeScript, missing linting, no testing)
- Architecture issues (prop drilling, god components, circular deps)
- Outdated dependencies with known vulnerabilities
- Missing error boundaries, loading states, 404 pages`;

    const raw = await this.chat(
      [
        { role: "system", content: AGENT_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      { temperature: 0.2, max_tokens: 4096 }
    );

    try {
      // Strip markdown fences if the model wraps in ```json
      const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return {
        framework: parsed.framework || "unknown",
        language: parsed.language || "javascript",
        packageManager: parsed.packageManager || "npm",
        structure: parsed.structure || [],
        dependencies: parsed.dependencies || packageJson?.dependencies || {},
        devDependencies: parsed.devDependencies || packageJson?.devDependencies || {},
        scripts: parsed.scripts || packageJson?.scripts || {},
        issues: parsed.issues || [],
        suggestions: parsed.suggestions || [],
        score: parsed.score || { overall: 0, performance: 0, accessibility: 0, bestPractices: 0, security: 0, dx: 0, maintainability: 0 },
        techStack: parsed.techStack || [],
      };
    } catch {
      this.log("error", "Failed to parse AI analysis, returning defaults");
      return this.getDefaultAnalysis(packageJson);
    }
  }

  private getDefaultAnalysis(packageJson: any): RepoAnalysis {
    return {
      framework: "unknown",
      language: "javascript",
      packageManager: "npm",
      structure: [],
      dependencies: packageJson?.dependencies || {},
      devDependencies: packageJson?.devDependencies || {},
      scripts: packageJson?.scripts || {},
      issues: [],
      suggestions: [],
      score: { overall: 0, performance: 0, accessibility: 0, bestPractices: 0, security: 0, dx: 0, maintainability: 0 },
      techStack: [],
    };
  }

  // ─── AUTONOMOUS AGENT LOOP ─────────────────────────────────────
  async *runAgentLoop(task: string, context?: any): AsyncGenerator<AgentLog> {
    this.state.phase = "planning";
    this.state.currentTask = task;

    yield this.log("thought", `Received task: "${task}". Initiating autonomous agent loop.`);

    // Phase 1: Understanding
    yield this.log("thought", "Phase 1: Understanding the request and current state...");
    const understanding = await this.thinkAboutTask(task, context);
    yield this.log("thought", understanding);

    // Phase 2: Planning
    yield this.log("system", "Phase 2: Creating execution plan...");
    this.state.phase = "planning";
    const plan = await this.createPlan(task, understanding, context);
    this.state.plan = plan;
    yield this.log("decision", `Plan created: ${plan.steps.length} steps. Impact: ${plan.estimatedImpact}. ${plan.autoApproved ? "Auto-approved." : "Awaiting approval."}`);

    // Phase 3: Execution
    this.state.phase = "executing";
    for (const step of plan.steps) {
      yield this.log("action", `Executing: ${step.description}`);
      step.status = "running";

      const result = await this.executeStep(step, context);
      step.output = result;
      step.status = result ? "done" : "failed";

      yield this.log("observation", `Result: ${step.status === "done" ? "✓" : "✗"} ${result?.slice(0, 200) || "No output"}`);

      const reflection = await this.reflect(step, result);
      yield this.log("thought", `Reflection: ${reflection}`);
    }

    // Phase 4: Review
    this.state.phase = "reviewing";
    yield this.log("system", "Phase 4: Reviewing results and generating final output...");
    const review = await this.reviewExecution(plan);
    yield this.log("decision", review);

    this.state.phase = "idle";
    yield this.log("system", "Agent loop complete.");
  }

  private async thinkAboutTask(task: string, context?: any): Promise<string> {
    return this.chat(
      [
        { role: "system", content: AGENT_SYSTEM_PROMPT },
        {
          role: "user",
          content: `THINK about this task deeply. What is being asked? What's the context? What are the constraints? What skills do we need?

Task: ${task}

Repository Context: ${JSON.stringify(this.state.repoAnalysis ? {
            framework: this.state.repoAnalysis.framework,
            techStack: this.state.repoAnalysis.techStack,
            issueCount: this.state.repoAnalysis.issues.length,
            score: this.state.repoAnalysis.score,
          } : "No repo scanned yet")}

Additional Context: ${JSON.stringify(context || "None")}

Respond with your detailed thinking process. Be thorough.`,
        },
      ],
      { temperature: 0.3, max_tokens: 1000 }
    );
  }

  private async createPlan(task: string, understanding: string, context?: any): Promise<AgentPlan> {
    const raw = await this.chat(
      [
        { role: "system", content: AGENT_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Create a detailed execution plan for this task.

Task: ${task}
Understanding: ${understanding}
Repo Analysis: ${JSON.stringify(this.state.repoAnalysis?.score || {})}

Return ONLY valid JSON (no markdown fences):
{
  "goal": "clear goal statement",
  "reasoning": "why this plan",
  "estimatedImpact": "low|medium|high|critical",
  "autoApproved": true,
  "steps": [
    {
      "id": "step_1",
      "action": "action type",
      "description": "what to do",
      "status": "pending",
      "dependencies": []
    }
  ]
}`,
        },
      ],
      { temperature: 0.2, max_tokens: 2000 }
    );

    try {
      const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const plan = JSON.parse(cleaned);
      return {
        goal: plan.goal || task,
        steps: plan.steps || [],
        reasoning: plan.reasoning || "",
        estimatedImpact: plan.estimatedImpact || "medium",
        autoApproved: plan.autoApproved !== false,
      };
    } catch {
      return {
        goal: task,
        steps: [{ id: "step_1", action: "analyze", description: "Analyze and respond to task", status: "pending" as const, dependencies: [] }],
        reasoning: "Fallback single-step plan",
        estimatedImpact: "medium" as const,
        autoApproved: true,
      };
    }
  }

  private async executeStep(step: PlanStep, context?: any): Promise<string> {
    const startTime = Date.now();

    const output = await this.chat(
      [
        { role: "system", content: AGENT_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Execute this step of the plan. Provide concrete, actionable output.

Step: ${step.description}
Action Type: ${step.action}
Full Plan Goal: ${this.state.plan?.goal || "Unknown"}
Repo Context: ${JSON.stringify({
            framework: this.state.repoAnalysis?.framework,
            techStack: this.state.repoAnalysis?.techStack,
            issues: this.state.repoAnalysis?.issues?.slice(0, 5),
          })}

If this step involves code generation, provide COMPLETE, WORKING code.
If this step involves analysis, provide SPECIFIC, ACTIONABLE findings.
If this step involves fixing issues, provide the EXACT fix with before/after.

Be thorough and precise.`,
        },
      ],
      { temperature: 0.3, max_tokens: 4096 }
    );

    const duration = Date.now() - startTime;

    this.state.executionHistory.push({
      id: step.id,
      timestamp: Date.now(),
      action: step.action,
      input: step.description,
      output,
      success: !!output,
      duration,
    });

    return output;
  }

  private async reflect(step: PlanStep, result: string | undefined): Promise<string> {
    return this.chat(
      [
        { role: "system", content: "You are a self-reflective AI agent. Evaluate the result of the last action briefly." },
        {
          role: "user",
          content: `Step: ${step.description}\nResult: ${result?.slice(0, 500) || "No output"}\n\nRate effectiveness (1-10), identify improvements, and state the learning. Be concise (2-3 sentences).`,
        },
      ],
      { temperature: 0.3, max_tokens: 200 }
    );
  }

  private async reviewExecution(plan: AgentPlan): Promise<string> {
    const completedSteps = plan.steps.filter((s) => s.status === "done").length;
    const failedSteps = plan.steps.filter((s) => s.status === "failed").length;
    return `Execution review: ${completedSteps}/${plan.steps.length} steps completed, ${failedSteps} failed. Goal "${plan.goal}" ${completedSteps === plan.steps.length ? "fully achieved" : "partially achieved"}.`;
  }

  // ─── SKILLS LOADING ────────────────────────────────────────────
  loadSkills(skillsContent: string) {
    this.log("system", "Loading skills from skills.sh");
    const skillBlocks = skillsContent.split(/#+\s*SKILL:/i);

    for (const block of skillBlocks) {
      if (!block.trim()) continue;
      const lines = block.trim().split("\n");
      const name = lines[0]?.trim() || "unnamed";
      const content = lines.slice(1).join("\n");

      const skill: Skill = {
        name,
        description: content.slice(0, 200),
        trigger: name.toLowerCase(),
        instructions: content,
      };

      this.skills.set(name, skill);
      this.state.skills.push(skill);
    }

    this.log("system", `Loaded ${this.skills.size} skills`);
  }

  getState(): AgentState {
    return { ...this.state };
  }
}

export default FrontendAgent;
