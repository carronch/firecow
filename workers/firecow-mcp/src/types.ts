export interface Env {
  DB: D1Database;
  MCP_AGENT: DurableObjectNamespace;
  ENVIRONMENT?: string;
}

export interface AgentSession {
  agent_key_id: string;
  agent_name: string;
  markup_pct: number | null;
  markup_fixed_cents: number | null;
}
