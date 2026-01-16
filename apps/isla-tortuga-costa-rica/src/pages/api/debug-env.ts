export const prerender = false;

export async function GET({ request }) {
    const vars = {
        KEYSTATIC_GITHUB_CLIENT_ID: import.meta.env.KEYSTATIC_GITHUB_CLIENT_ID || process.env.KEYSTATIC_GITHUB_CLIENT_ID ? 'Set ✅' : 'Missing ❌',
        KEYSTATIC_GITHUB_CLIENT_SECRET: import.meta.env.KEYSTATIC_GITHUB_CLIENT_SECRET || process.env.KEYSTATIC_GITHUB_CLIENT_SECRET ? 'Set ✅' : 'Missing ❌',
        KEYSTATIC_SECRET: import.meta.env.KEYSTATIC_SECRET || process.env.KEYSTATIC_SECRET ? 'Set ✅' : 'Missing ❌',
        // Check if they are accidentally typically short/wrong
        CLIENT_ID_Length: (import.meta.env.KEYSTATIC_GITHUB_CLIENT_ID || process.env.KEYSTATIC_GITHUB_CLIENT_ID)?.length || 0,
        CLIENT_SECRET_Length: (import.meta.env.KEYSTATIC_GITHUB_CLIENT_SECRET || process.env.KEYSTATIC_GITHUB_CLIENT_SECRET)?.length || 0,
    };

    return new Response(JSON.stringify(vars, null, 2), {
        headers: { 'Content-Type': 'application/json' },
    });
}
