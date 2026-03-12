import type { Env, AgentApiKey } from './types';
import { err, hashKey } from './utils';

export type AuthResult =
  | { ok: true; agent: AgentApiKey }
  | { ok: false; response: Response };

/**
 * Authenticate an agent request via Bearer API key.
 * Looks up the SHA-256 hash of the key in agent_api_keys.
 * Updates last_used_at non-blocking (fire and forget).
 */
export async function authenticateAgent(
  request: Request,
  env: Env
): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization') ?? '';
  const key = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!key) {
    return {
      ok: false,
      response: err('Missing Authorization header. Use: Bearer <api-key>', 401),
    };
  }

  const hash = await hashKey(key);

  const agent = await env.DB
    .prepare('SELECT * FROM agent_api_keys WHERE key_hash = ? AND is_active = 1')
    .bind(hash)
    .first<AgentApiKey>();

  if (!agent) {
    return { ok: false, response: err('Invalid or inactive API key', 401) };
  }

  // Update last_used_at non-blocking
  env.DB
    .prepare('UPDATE agent_api_keys SET last_used_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), agent.id)
    .run();

  return { ok: true, agent };
}

/**
 * Authenticate an admin request via ADMIN_KEY secret.
 */
export function authenticateAdmin(request: Request, env: Env): boolean {
  const authHeader = request.headers.get('Authorization') ?? '';
  const key = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  return key === env.ADMIN_KEY;
}
