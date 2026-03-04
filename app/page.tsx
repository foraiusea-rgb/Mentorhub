"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import useAgentStore, { LogEntry, Issue, Suggestion, RepoScore } from "@/lib/store";

// ─── FREE MODELS LIST ────────────────────────────────────────────
const FREE_MODELS = [
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

// ─── ICONS ───────────────────────────────────────────────────────
const Icons = {
  Scan: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 012-2h2" /><path d="M17 3h2a2 2 0 012 2v2" />
      <path d="M21 17v2a2 2 0 01-2 2h-2" /><path d="M7 21H5a2 2 0 01-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  ),
  Brain: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A5.5 5.5 0 005 7.5c0 .96.246 1.863.678 2.65L4 12l1.678 1.85A5.478 5.478 0 005 16.5 5.5 5.5 0 009.5 22h1a5.5 5.5 0 004.5-8.65L16.678 11.5 15 9.65A5.5 5.5 0 0010.5 2h-1z" />
    </svg>
  ),
  Zap: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Shield: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Terminal: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  ),
  Key: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  ),
  Github: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  ),
  Play: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Loader: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  ),
  Router: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="14" width="20" height="8" rx="2" /><path d="M6 18h.01" /><path d="M10 18h.01" />
      <path d="M15 14v-2a4 4 0 00-8 0" /><path d="M19 14v-4a8 8 0 00-16 0" />
    </svg>
  ),
};

// ─── SCORE RING ──────────────────────────────────────────────────
function ScoreRing({ score, label, size = 80 }: { score: number; label: string; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#00ff88" : score >= 60 ? "#ffaa00" : "#ff4466";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="absolute transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1e1e2e" strokeWidth="4" />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 1s ease-out" }} />
        </svg>
        <span className="text-lg font-bold font-mono" style={{ color }}>{score}</span>
      </div>
      <span className="text-[10px] text-agent-muted uppercase tracking-wider">{label}</span>
    </div>
  );
}

// ─── LOG ENTRY ───────────────────────────────────────────────────
function LogEntryView({ log }: { log: LogEntry }) {
  const typeConfig: Record<string, { color: string; label: string }> = {
    thought: { color: "#a78bfa", label: "THINK" },
    action: { color: "#00ff88", label: "ACT" },
    observation: { color: "#60a5fa", label: "OBSERVE" },
    decision: { color: "#fbbf24", label: "DECIDE" },
    error: { color: "#ff4466", label: "ERROR" },
    system: { color: "#6b6b80", label: "SYSTEM" },
  };
  const config = typeConfig[log.type] || typeConfig.system;

  return (
    <div className="flex gap-3 py-2 px-3 rounded-lg hover:bg-agent-surface/50 transition-colors animate-fade-in">
      <div className="flex-shrink-0 mt-0.5">
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded" style={{ color: config.color, background: `${config.color}15` }}>
          {config.label}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-agent-text/90 leading-relaxed whitespace-pre-wrap break-words">{log.content}</p>
        <span className="text-[10px] text-agent-muted font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}

// ─── ISSUE CARD ──────────────────────────────────────────────────
function IssueCard({ issue, index }: { issue: Issue; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const sevColors: Record<string, string> = { critical: "#ff4466", error: "#ff6b6b", warning: "#ffaa00", info: "#60a5fa" };
  const color = sevColors[issue.severity] || sevColors.info;

  return (
    <div className="action-card p-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
      <div className="flex items-start gap-2">
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0" style={{ color, background: `${color}20` }}>
          {issue.severity.toUpperCase()}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-agent-text">{issue.message}</p>
          {issue.file && <p className="text-[11px] text-agent-muted font-mono mt-1">{issue.file}</p>}
          {expanded && issue.fix && (
            <div className="mt-2 p-2 rounded bg-[#0d0d14] border border-agent-border">
              <p className="text-[11px] text-agent-muted uppercase tracking-wider mb-1">Fix:</p>
              <p className="text-xs text-agent-accent font-mono whitespace-pre-wrap">{issue.fix}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SUGGESTION CARD ─────────────────────────────────────────────
function SuggestionCard({ suggestion, onAct }: { suggestion: Suggestion; onAct: (s: Suggestion) => void }) {
  const catColors: Record<string, string> = {
    performance: "#00ff88", accessibility: "#a78bfa", security: "#ff4466", dx: "#60a5fa",
    architecture: "#fbbf24", styling: "#f472b6", testing: "#34d399", seo: "#fb923c",
  };
  const color = catColors[suggestion.category] || "#6b6b80";

  return (
    <div className="action-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ color, background: `${color}20` }}>
              {suggestion.category.toUpperCase()}
            </span>
            <span className="text-[10px] text-agent-muted">Impact: {suggestion.impact} · Effort: {suggestion.effort}</span>
          </div>
          <h4 className="text-sm font-medium text-agent-text mb-1">{suggestion.title}</h4>
          <p className="text-xs text-agent-muted leading-relaxed">{suggestion.description}</p>
          {suggestion.codeSnippet && (
            <pre className="mt-2 p-2 rounded bg-[#0d0d14] border border-agent-border text-[11px] text-agent-accent font-mono overflow-x-auto">
              {suggestion.codeSnippet}
            </pre>
          )}
        </div>
        {suggestion.actionable && (
          <button onClick={() => onAct(suggestion)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-agent-accent/10 text-agent-accent border border-agent-accent/20 hover:bg-agent-accent/20 transition-colors">
            Act on this →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────
export default function AgentDashboard() {
  const store = useAgentStore();
  const [activeTab, setActiveTab] = useState<"logs" | "issues" | "suggestions" | "scores">("logs");
  const [taskInput, setTaskInput] = useState("");
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [showSetup, setShowSetup] = useState(true);

  // Setup fields
  const [localApiKey, setLocalApiKey] = useState("");
  const [localGithubToken, setLocalGithubToken] = useState("");
  const [localRepoUrl, setLocalRepoUrl] = useState("");
  const [selectedModel, setSelectedModel] = useState(FREE_MODELS[0].id);

  useEffect(() => {
    if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [store.logs]);

  const addLog = useCallback((type: LogEntry["type"], content: string) => {
    store.addLog({
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(), type, content,
    });
  }, [store]);

  // ─── CONNECT & SCAN ──────────────────────────────────────────
  const handleConnect = async () => {
    if (!localApiKey || !localRepoUrl) return;

    store.setApiKey(localApiKey);
    store.setGithubToken(localGithubToken);
    store.setRepoUrl(localRepoUrl);
    store.setConnected(true);
    setShowSetup(false);
    store.setRunning(true);
    store.setPhase("scanning");
    store.clearLogs();

    addLog("system", `APEX Agent initialized. Model: ${FREE_MODELS.find(m => m.id === selectedModel)?.name || selectedModel}`);
    addLog("action", `Connecting to repository: ${localRepoUrl}`);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl: localRepoUrl,
          apiKey: localApiKey,
          githubToken: localGithubToken,
          model: selectedModel,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");

      store.setAnalysis({
        framework: data.analysis.framework,
        techStack: data.analysis.techStack,
        score: data.analysis.score,
        issues: data.analysis.issues,
        suggestions: data.analysis.suggestions,
        dependencies: data.analysis.dependencies,
      });

      if (data.logs) {
        for (const log of data.logs) store.addLog(log);
      }

      addLog("system", `Scan complete. Framework: ${data.analysis.framework}. Score: ${data.analysis.score?.overall}/100`);
      addLog("decision", `Found ${data.analysis.issues?.length || 0} issues and ${data.analysis.suggestions?.length || 0} actionable suggestions.`);
      store.setPhase("idle");
      setActiveTab("scores");
    } catch (err: any) {
      addLog("error", `Scan failed: ${err.message}`);
      store.setPhase("idle");
    } finally {
      store.setRunning(false);
    }
  };

  // ─── RUN AGENT TASK ──────────────────────────────────────────
  const handleRunTask = async (task: string) => {
    if (!task.trim() || store.isRunning) return;

    store.setRunning(true);
    store.setPhase("planning");
    addLog("system", `New task received: "${task}"`);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task,
          apiKey: store.apiKey,
          githubToken: store.githubToken,
          model: selectedModel,
          repoContext: {
            repoUrl: store.repoUrl,
            framework: store.framework,
            techStack: store.techStack,
            score: store.score,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Agent execution failed");

      if (data.logs) {
        for (const log of data.logs) store.addLog(log);
      }

      store.setPhase("idle");
      setActiveTab("logs");
    } catch (err: any) {
      addLog("error", `Agent error: ${err.message}`);
      store.setPhase("idle");
    } finally {
      store.setRunning(false);
      setTaskInput("");
    }
  };

  const handleActOnSuggestion = (suggestion: Suggestion) => {
    handleRunTask(`Implement this suggestion: ${suggestion.title}. Details: ${suggestion.description}. Category: ${suggestion.category}. ${suggestion.codeSnippet ? `Reference code: ${suggestion.codeSnippet}` : ""}`);
  };

  const quickActions = [
    { label: "Full Audit", task: "Run a comprehensive frontend audit covering performance, accessibility, security, SEO, and code quality. Provide specific fixes for every issue found.", icon: <Icons.Shield /> },
    { label: "Fix All Issues", task: "Fix every issue found in the scan. Provide exact code changes with before/after for each fix.", icon: <Icons.Zap /> },
    { label: "Optimize Performance", task: "Analyze and optimize all performance bottlenecks. Implement code splitting, lazy loading, image optimization, and bundle size reduction.", icon: <Icons.Zap /> },
    { label: "Improve Architecture", task: "Review codebase architecture. Identify god components, prop drilling, missing patterns, and restructure for scalability.", icon: <Icons.Brain /> },
  ];

  const phaseLabels: Record<string, string> = {
    idle: "READY", scanning: "SCANNING REPO", analyzing: "DEEP ANALYSIS",
    planning: "CREATING PLAN", executing: "EXECUTING", reviewing: "REVIEWING",
  };

  // ─── RENDER ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-agent-bg grid-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-agent-border bg-agent-bg/80 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-agent-accent/10 border border-agent-accent/30 flex items-center justify-center">
                <span className="text-agent-accent font-bold text-sm font-mono">A</span>
              </div>
              <div className={`status-dot absolute -bottom-0.5 -right-0.5 ${store.isRunning ? "active" : ""}`}
                style={{ background: store.isRunning ? "var(--agent-accent)" : "var(--agent-muted)" }} />
            </div>
            <div>
              <h1 className="text-sm font-bold font-display tracking-wide text-agent-text">
                APEX <span className="text-agent-muted font-normal text-xs">v1.0</span>
              </h1>
              <p className="text-[10px] text-agent-muted uppercase tracking-widest">Frontend Agent · OpenRouter</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-agent-surface border border-agent-border">
              {store.isRunning && <Icons.Loader />}
              <span className={`text-xs font-mono font-bold tracking-wider ${store.isRunning ? "text-agent-accent glow-text" : "text-agent-muted"}`}>
                {phaseLabels[store.phase] || "READY"}
              </span>
            </div>

            {store.isConnected && store.framework && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-agent-surface border border-agent-border">
                <span className="text-[10px] text-agent-muted">STACK:</span>
                <span className="text-xs font-mono text-agent-accent">{store.framework}</span>
              </div>
            )}

            {store.isConnected && (
              <button onClick={() => { store.reset(); setShowSetup(true); store.setConnected(false); }}
                className="text-xs text-agent-muted hover:text-agent-error transition-colors">
                Disconnect
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─── SETUP SCREEN ──────────────────────────────────────── */}
      {showSetup && (
        <div className="max-w-xl mx-auto mt-20 px-6 animate-fade-in">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-agent-accent/10 border border-agent-accent/30 flex items-center justify-center mx-auto mb-6 glow-accent">
              <span className="text-2xl font-bold text-agent-accent font-mono">A</span>
            </div>
            <h1 className="text-3xl font-bold font-display text-agent-text mb-2">APEX Agent</h1>
            <p className="text-sm text-agent-muted max-w-md mx-auto">
              Autonomous frontend development agent powered by free models via OpenRouter. Scan, analyze, plan, and execute.
            </p>
          </div>

          <div className="space-y-4">
            {/* OpenRouter API Key */}
            <div>
              <label className="text-xs text-agent-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Icons.Router /> OpenRouter API Key *
                <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer"
                  className="text-agent-accent hover:underline ml-auto text-[10px] normal-case tracking-normal">
                  Get free key →
                </a>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-agent-muted"><Icons.Key /></div>
                <input type="password" value={localApiKey} onChange={(e) => setLocalApiKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-agent-surface border border-agent-border text-sm text-agent-text font-mono placeholder:text-agent-muted/40 focus:border-agent-accent/50 focus:outline-none transition-colors" />
              </div>
            </div>

            {/* Model Selector */}
            <div>
              <label className="text-xs text-agent-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Icons.Brain /> Free Model
                <span className="text-[10px] text-agent-accent ml-auto normal-case tracking-normal">All models are FREE</span>
              </label>
              <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-agent-surface border border-agent-border text-sm text-agent-text font-mono focus:border-agent-accent/50 focus:outline-none transition-colors appearance-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236b6b80' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" }}>
                {FREE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} — {m.id}</option>
                ))}
              </select>
            </div>

            {/* GitHub Token */}
            <div>
              <label className="text-xs text-agent-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Icons.Github /> GitHub Token <span className="text-agent-muted/60 text-[10px] normal-case tracking-normal ml-1">(optional, for private repos)</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-agent-muted"><Icons.Github /></div>
                <input type="password" value={localGithubToken} onChange={(e) => setLocalGithubToken(e.target.value)}
                  placeholder="ghp_..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-agent-surface border border-agent-border text-sm text-agent-text font-mono placeholder:text-agent-muted/40 focus:border-agent-accent/50 focus:outline-none transition-colors" />
              </div>
            </div>

            {/* Repo URL */}
            <div>
              <label className="text-xs text-agent-muted uppercase tracking-wider mb-1.5 block">GitHub Repository URL *</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-agent-muted"><Icons.Github /></div>
                <input type="text" value={localRepoUrl} onChange={(e) => setLocalRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-agent-surface border border-agent-border text-sm text-agent-text font-mono placeholder:text-agent-muted/40 focus:border-agent-accent/50 focus:outline-none transition-colors" />
              </div>
            </div>

            <button onClick={handleConnect} disabled={!localApiKey || !localRepoUrl}
              className="w-full py-3.5 rounded-xl bg-agent-accent text-agent-bg font-bold text-sm uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:bg-agent-accent/90 transition-all glow-accent mt-2">
              <span className="flex items-center justify-center gap-2">
                <Icons.Scan /> Initialize Agent & Scan Repository
              </span>
            </button>
          </div>

          <p className="text-[10px] text-agent-muted/60 text-center mt-6">
            Keys are stored in-memory only, never persisted or sent to any server except OpenRouter & GitHub APIs.
          </p>
        </div>
      )}

      {/* ─── MAIN DASHBOARD ────────────────────────────────────── */}
      {!showSetup && store.isConnected && (
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          {/* Quick Actions */}
          {!store.isRunning && store.score && (
            <div className="grid grid-cols-4 gap-3 mb-6 animate-slide-up">
              {quickActions.map((action, i) => (
                <button key={i} onClick={() => handleRunTask(action.task)} className="action-card p-4 text-left group">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-agent-accent opacity-60 group-hover:opacity-100 transition-opacity">{action.icon}</span>
                    <span className="text-xs font-bold text-agent-text">{action.label}</span>
                  </div>
                  <p className="text-[11px] text-agent-muted line-clamp-2">{action.task.slice(0, 80)}...</p>
                </button>
              ))}
            </div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-[1fr_380px] gap-6">
            {/* Left: Tabs & Content */}
            <div className="space-y-4">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-agent-surface border border-agent-border">
                {[
                  { id: "logs", label: "Agent Logs", count: store.logs.length },
                  { id: "issues", label: "Issues", count: store.issues.length },
                  { id: "suggestions", label: "Suggestions", count: store.suggestions.length },
                  { id: "scores", label: "Scores" },
                ].map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? "bg-agent-accent/10 text-agent-accent border border-agent-accent/20" : "text-agent-muted hover:text-agent-text"}`}>
                    {tab.label}{tab.count !== undefined && <span className="ml-1.5 text-[10px] opacity-60">({tab.count})</span>}
                  </button>
                ))}
              </div>

              <div className="rounded-xl bg-agent-surface border border-agent-border overflow-hidden" style={{ minHeight: "500px", maxHeight: "calc(100vh - 300px)" }}>
                {activeTab === "logs" && (
                  <div className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 340px)" }}>
                    {store.logs.length === 0 ? (
                      <div className="flex items-center justify-center h-64 text-agent-muted text-sm">Agent logs will appear here...</div>
                    ) : store.logs.map((log) => <LogEntryView key={log.id} log={log} />)}
                    <div ref={logsEndRef} />
                  </div>
                )}
                {activeTab === "issues" && (
                  <div className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 340px)" }}>
                    {store.issues.length === 0
                      ? <div className="flex items-center justify-center h-64 text-agent-muted text-sm">No issues found. Run a scan first.</div>
                      : store.issues.map((issue, i) => <IssueCard key={i} issue={issue} index={i} />)}
                  </div>
                )}
                {activeTab === "suggestions" && (
                  <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 340px)" }}>
                    {store.suggestions.length === 0
                      ? <div className="flex items-center justify-center h-64 text-agent-muted text-sm">No suggestions yet. Run a scan first.</div>
                      : store.suggestions.map((s, i) => <SuggestionCard key={s.id || i} suggestion={s} onAct={handleActOnSuggestion} />)}
                  </div>
                )}
                {activeTab === "scores" && store.score && (
                  <div className="p-8">
                    <div className="flex items-center justify-center mb-8">
                      <ScoreRing score={store.score.overall} label="Overall" size={140} />
                    </div>
                    <div className="grid grid-cols-3 gap-6 justify-items-center">
                      <ScoreRing score={store.score.performance} label="Performance" size={90} />
                      <ScoreRing score={store.score.accessibility} label="A11y" size={90} />
                      <ScoreRing score={store.score.bestPractices} label="Best Practices" size={90} />
                      <ScoreRing score={store.score.security} label="Security" size={90} />
                      <ScoreRing score={store.score.dx} label="DX" size={90} />
                      <ScoreRing score={store.score.maintainability} label="Maintainability" size={90} />
                    </div>
                  </div>
                )}
              </div>

              {/* Task Input */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-agent-muted"><Icons.Terminal /></div>
                  <input type="text" value={taskInput} onChange={(e) => setTaskInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRunTask(taskInput)}
                    placeholder="Give APEX a task... (e.g., 'Add dark mode toggle with system preference detection')"
                    disabled={store.isRunning}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-agent-surface border border-agent-border text-sm text-agent-text font-mono placeholder:text-agent-muted/40 focus:border-agent-accent/50 focus:outline-none transition-colors disabled:opacity-50" />
                </div>
                <button onClick={() => handleRunTask(taskInput)} disabled={!taskInput.trim() || store.isRunning}
                  className="px-5 py-3 rounded-xl bg-agent-accent text-agent-bg font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-agent-accent/90 transition-all flex items-center gap-2">
                  {store.isRunning ? <Icons.Loader /> : <Icons.Play />} Execute
                </button>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4">
              {/* Active Model */}
              <div className="rounded-xl bg-agent-surface border border-agent-border p-4 animate-slide-up">
                <h3 className="text-xs font-bold text-agent-muted uppercase tracking-wider mb-2">Active Model</h3>
                <p className="text-sm font-mono text-agent-accent">{FREE_MODELS.find(m => m.id === selectedModel)?.name}</p>
                <p className="text-[10px] text-agent-muted font-mono mt-1 break-all">{selectedModel}</p>
                <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded bg-agent-accent/10 text-agent-accent border border-agent-accent/20">FREE</span>
              </div>

              {store.techStack.length > 0 && (
                <div className="rounded-xl bg-agent-surface border border-agent-border p-4 animate-slide-up">
                  <h3 className="text-xs font-bold text-agent-muted uppercase tracking-wider mb-3">Detected Stack</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {store.techStack.map((tech, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-agent-accent/10 text-agent-accent text-[11px] font-mono border border-agent-accent/10">{tech}</span>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(store.dependencies).length > 0 && (
                <div className="rounded-xl bg-agent-surface border border-agent-border p-4 animate-slide-up">
                  <h3 className="text-xs font-bold text-agent-muted uppercase tracking-wider mb-3">Dependencies ({Object.keys(store.dependencies).length})</h3>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {Object.entries(store.dependencies).slice(0, 30).map(([name, version]) => (
                      <div key={name} className="flex items-center justify-between py-1 px-2 rounded hover:bg-agent-border/30 transition-colors">
                        <span className="text-xs font-mono text-agent-text truncate">{name}</span>
                        <span className="text-[10px] font-mono text-agent-muted flex-shrink-0 ml-2">{version as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {store.issues.length > 0 && (
                <div className="rounded-xl bg-agent-surface border border-agent-border p-4 animate-slide-up">
                  <h3 className="text-xs font-bold text-agent-muted uppercase tracking-wider mb-3">Issue Breakdown</h3>
                  <div className="space-y-2">
                    {["critical", "error", "warning", "info"].map((sev) => {
                      const count = store.issues.filter((i) => i.severity === sev).length;
                      if (count === 0) return null;
                      const colors: Record<string, string> = { critical: "#ff4466", error: "#ff6b6b", warning: "#ffaa00", info: "#60a5fa" };
                      return (
                        <div key={sev} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: colors[sev] }} />
                            <span className="text-xs text-agent-text capitalize">{sev}</span>
                          </div>
                          <span className="text-xs font-mono font-bold" style={{ color: colors[sev] }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-agent-surface border border-agent-border p-4 animate-slide-up">
                <h3 className="text-xs font-bold text-agent-muted uppercase tracking-wider mb-3">Agent Capabilities</h3>
                <div className="space-y-2 text-[11px] text-agent-muted">
                  <div className="flex items-center gap-2"><Icons.Check /><span>Autonomous repo scanning & analysis</span></div>
                  <div className="flex items-center gap-2"><Icons.Check /><span>Think → Plan → Act → Observe → Reflect loop</span></div>
                  <div className="flex items-center gap-2"><Icons.Check /><span>Auto-fix issues with exact code changes</span></div>
                  <div className="flex items-center gap-2"><Icons.Check /><span>Performance, A11y, Security, SEO audits</span></div>
                  <div className="flex items-center gap-2"><Icons.Check /><span>Dynamic skill loading from skills.sh</span></div>
                  <div className="flex items-center gap-2"><Icons.Check /><span>17 free models via OpenRouter</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
