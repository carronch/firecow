/**
 * FireCow MCP Server — Cloudflare Worker
 *
 * Exposes FireCow tour inventory as MCP tools and resources for AI agents.
 * Auth: Authorization: Bearer <agent-api-key>
 *
 * MCP endpoint: POST /mcp (SSE transport)
 * Claude Desktop config:
 *   {
 *     "mcpServers": {
 *       "firecow-tours": {
 *         "url": "https://firecow-mcp.firecowbooking.workers.dev/mcp",
 *         "headers": { "Authorization": "Bearer fc_live_xxxx" }
 *       }
 *     }
 *   }
 */

import type { Env } from './types';
import { FireCowMcpAgent } from './agent';

export { FireCowMcpAgent };

async function hashKey(raw: string): Promise<string> {
  const buf = new TextEncoder().encode(raw);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const method = request.method;
    const url = new URL(request.url);

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Health check
    if (method === 'GET' && url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'firecow-mcp' }), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    // MCP endpoint
    if (url.pathname === '/mcp') {
      // Authenticate via agent_api_keys
      const authHeader = request.headers.get('Authorization') ?? '';
      const rawKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

      if (!rawKey) {
        return new Response(JSON.stringify({ error: 'Missing Authorization header. Use: Bearer <api-key>' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        });
      }

      const hash = await hashKey(rawKey);
      const agent = await env.DB
        .prepare('SELECT id, agent_name, markup_pct, markup_fixed_cents FROM agent_api_keys WHERE key_hash = ? AND is_active = 1')
        .bind(hash)
        .first<{ id: string; agent_name: string; markup_pct: number | null; markup_fixed_cents: number | null }>();

      if (!agent) {
        return new Response(JSON.stringify({ error: 'Invalid or inactive API key' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        });
      }

      // Update last_used_at non-blocking
      env.DB
        .prepare('UPDATE agent_api_keys SET last_used_at = ? WHERE id = ?')
        .bind(new Date().toISOString(), agent.id)
        .run();

      // Route to MCP agent Durable Object with session props
      return FireCowMcpAgent.serve('/mcp', {
        binding: env.MCP_AGENT,
        props: {
          agent_key_id: agent.id,
          agent_name: agent.agent_name,
          markup_pct: agent.markup_pct,
          markup_fixed_cents: agent.markup_fixed_cents,
        },
      }).fetch(request, env);
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  },
};
