import type { APIRoute } from 'astro';
import fs from 'node:fs';
import { getCsvPath } from '../../../lib/file-system';

export const prerender = false;

export const GET: APIRoute = async () => {
    try {
        const csvPath = getCsvPath();
        if (!fs.existsSync(csvPath)) {
            return new Response(JSON.stringify({ error: 'CSV file not found' }), { status: 404 });
        }
        const content = fs.readFileSync(csvPath, 'utf8');
        // Simple CSV parser
        const rows = content.trim().split('\n').map(line => line.split(';'));

        return new Response(JSON.stringify({ content, rows }), {
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
        const { content } = body;

        if (typeof content !== 'string') {
            return new Response(JSON.stringify({ error: 'Invalid content' }), { status: 400 });
        }

        const csvPath = getCsvPath();
        fs.writeFileSync(csvPath, content, 'utf8');

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: message }), { status: 500 });
    }
}
