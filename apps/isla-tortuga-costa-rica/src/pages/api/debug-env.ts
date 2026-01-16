export const prerender = false;

export async function GET(context) {
    const runtimeEnv = context.locals?.runtime?.env || {};

    // Check various sources
    const vars = {
        // Source 1: import.meta.env (Vite build injection)
        'import.meta.env': {
            KEYSTATIC_GITHUB_CLIENT_ID: import.meta.env.KEYSTATIC_GITHUB_CLIENT_ID ? 'Set ✅' : 'Missing ❌',
        },
        // Source 2: process.env (Node compatibility shim)
        'process.env': {
            KEYSTATIC_GITHUB_CLIENT_ID: process?.env?.KEYSTATIC_GITHUB_CLIENT_ID ? 'Set ✅' : 'Missing ❌',
        },
        // Source 3: context.locals.runtime.env (Cloudflare native)
        'context.locals.runtime.env': {
            KEYSTATIC_GITHUB_CLIENT_ID: runtimeEnv.KEYSTATIC_GITHUB_CLIENT_ID ? 'Set ✅' : 'Missing ❌',
            KEYSTATIC_GITHUB_CLIENT_SECRET: runtimeEnv.KEYSTATIC_GITHUB_CLIENT_SECRET ? 'Set ✅' : 'Missing ❌',
            KEYSTATIC_SECRET: runtimeEnv.KEYSTATIC_SECRET ? 'Set ✅' : 'Missing ❌',
        }
    };

    return new Response(JSON.stringify(vars, null, 2), {
        headers: { 'Content-Type': 'application/json' },
    });
}
