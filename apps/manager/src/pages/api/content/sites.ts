import type { APIRoute } from 'astro';
import { getSites } from '../../../lib/file-system';

export const prerender = false;

export const GET: APIRoute = async () => {
    try {
        const sites = getSites();
        return new Response(JSON.stringify(sites), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: message }), { status: 500 });
    }
}
