import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { MONOREPO_ROOT } from '../../../lib/file-system';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
    try {
        const site = url.searchParams.get('site');
        if (!site) {
            return new Response(JSON.stringify({ error: 'Site parameter required' }), { status: 400 });
        }

        const toursDir = path.join(MONOREPO_ROOT, 'apps', site, 'src', 'content', 'tours');

        if (!fs.existsSync(toursDir)) {
            return new Response(JSON.stringify([]), { status: 200 });
        }

        const files = fs.readdirSync(toursDir).filter(f => f.endsWith('.md'));

        const tours = files.map(file => {
            const filePath = path.join(toursDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const { data } = matter(content);
            return {
                id: file.replace('.md', ''),
                ...data
            };
        });

        return new Response(JSON.stringify(tours), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: message }), { status: 500 });
    }
}
