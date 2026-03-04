import { create } from "zustand";

export interface LogEntry {
  id: string;
  timestamp: number;
  type: "thought" | "action" | "observation" | "decision" | "error" | "system";
  content: string;
  metadata?: Record<string, any>;
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

export interface Issue {
  severity: string;
  category: string;
  file?: string;
  message: string;
  fix?: string;
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: number;
  effort: string;
  impact: string;
  actionable: boolean;
  codeSnippet?: string;
}

export interface AgentStore {
  // Connection
  apiKey: string;
  githubToken: string;
  repoUrl: string;
  isConnected: boolean;

  // Agent State
  phase: "idle" | "scanning" | "analyzing" | "planning" | "executing" | "reviewing";
  logs: LogEntry[];
  isRunning: boolean;

  // Repo Data
  framework: string;
  techStack: string[];
  score: RepoScore | null;
  issues: Issue[];
  suggestions: Suggestion[];
  dependencies: Record<string, string>;
  files: string[];

  // Actions
  setApiKey: (key: string) => void;
  setGithubToken: (token: string) => void;
  setRepoUrl: (url: string) => void;
  setConnected: (v: boolean) => void;
  setPhase: (phase: AgentStore["phase"]) => void;
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
  setRunning: (v: boolean) => void;
  setAnalysis: (data: any) => void;
  reset: () => void;
}

const useAgentStore = create<AgentStore>((set) => ({
  apiKey: "",
  githubToken: "",
  repoUrl: "",
  isConnected: false,
  phase: "idle",
  logs: [],
  isRunning: false,
  framework: "",
  techStack: [],
  score: null,
  issues: [],
  suggestions: [],
  dependencies: {},
  files: [],

  setApiKey: (key) => set({ apiKey: key }),
  setGithubToken: (token) => set({ githubToken: token }),
  setRepoUrl: (url) => set({ repoUrl: url }),
  setConnected: (v) => set({ isConnected: v }),
  setPhase: (phase) => set({ phase }),
  addLog: (log) => set((s) => ({ logs: [...s.logs, log] })),
  clearLogs: () => set({ logs: [] }),
  setRunning: (v) => set({ isRunning: v }),
  setAnalysis: (data) =>
    set({
      framework: data.framework || "",
      techStack: data.techStack || [],
      score: data.score || null,
      issues: data.issues || [],
      suggestions: data.suggestions || [],
      dependencies: data.dependencies || {},
      files: data.files || [],
    }),
  reset: () =>
    set({
      phase: "idle",
      logs: [],
      isRunning: false,
      framework: "",
      techStack: [],
      score: null,
      issues: [],
      suggestions: [],
      dependencies: {},
      files: [],
    }),
}));

export default useAgentStore;
