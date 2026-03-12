import type { APIRoute } from 'astro';
import { getLeads, updateLeadStatus } from '../../../lib/zoho';

export const prerender = false;

export const GET: APIRoute = async () => {
    try {
        const leads = await getLeads();
        return new Response(JSON.stringify(leads), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: message }), { status: 500 });
    }
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return new Response(JSON.stringify({ error: 'ID and Status required' }), { status: 400 });
        }

        await updateLeadStatus(id, status);
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: message }), { status: 500 });
    }
}
