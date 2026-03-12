import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { MONOREPO_ROOT } from '../../../lib/file-system';

export const prerender = false;

function getTourPath(site: string, id: string) {
    return path.join(MONOREPO_ROOT, 'apps', site, 'src', 'content', 'tours', `${id}.md`);
}

export const GET: APIRoute = async ({ url }) => {
    try {
        const site = url.searchParams.get('site');
        const id = url.searchParams.get('id');

        if (!site || !id) {
            return new Response(JSON.stringify({ error: 'Site and ID parameters required' }), { status: 400 });
        }

        const filePath = getTourPath(site, id);
        if (!fs.existsSync(filePath)) {
            return new Response(JSON.stringify({ error: 'Tour not found' }), { status: 404 });
        }

        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = matter(content);

        return new Response(JSON.stringify({
            data: parsed.data,
            content: parsed.content
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: message }), { status: 500 });
    }
}

export const POST: APIRoute = async ({ request, url }) => {
    try {
        const site = url.searchParams.get('site');
        const id = url.searchParams.get('id');

        if (!site || !id) {
            return new Response(JSON.stringify({ error: 'Site and ID parameters required' }), { status: 400 });
        }

        const body = await request.json();
        const { data, content } = body;

        const filePath = getTourPath(site, id);
        const fileContent = matter.stringify(content || '', data);

        fs.writeFileSync(filePath, fileContent);

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: message }), { status: 500 });
    }
}
