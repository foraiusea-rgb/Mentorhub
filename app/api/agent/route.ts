import { NextRequest, NextResponse } from "next/server";
import FrontendAgent from "@/lib/agent-engine";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { task, apiKey, repoContext, githubToken, model } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: "OpenRouter API key required" }, { status: 400 });
    }
    if (!task) {
      return NextResponse.json({ error: "Task description required" }, { status: 400 });
    }

    const agent = new FrontendAgent(apiKey, model || "deepseek/deepseek-r1-0528:free");

    if (repoContext?.repoUrl) {
      const match = repoContext.repoUrl.match(/github\.com\/([^/]+)\/([^/\s#?]+)/);
      if (match) {
        const [, owner, repo] = match;
        await agent.scanRepository(owner, repo.replace(/\.git$/, ""), githubToken);
      }
    }

    const logs: any[] = [];
    for await (const log of agent.runAgentLoop(task, repoContext)) {
      logs.push(log);
    }

    const state = agent.getState();

    return NextResponse.json({
      success: true,
      logs,
      plan: state.plan,
      executionHistory: state.executionHistory,
    });
  } catch (error: any) {
    console.error("Agent error:", error);
    return NextResponse.json({ error: error.message || "Agent execution failed" }, { status: 500 });
  }
}
