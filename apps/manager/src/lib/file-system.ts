import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(process.cwd(), '../../../'); // Escape out of apps/manager/src/pages/api... actually process.cwd in Astro is the project root usually? 
// In Astro SSR, process.cwd() is usually the project root (apps/manager). 
// So we need to go up to the monorepo root.

export const MONOREPO_ROOT = path.resolve(process.cwd(), '../../');

export function getSites() {
    const appsDir = path.join(MONOREPO_ROOT, 'apps');
    if (!fs.existsSync(appsDir)) return [];

    const items = fs.readdirSync(appsDir, { withFileTypes: true });
    return items
        .filter(item => item.isDirectory())
        .filter(item => !['template', 'manager', '.turbo', 'node_modules'].includes(item.name))
        .map(item => item.name);
}

export function getCsvPath() {
    return path.join(MONOREPO_ROOT, 'sites-content.csv');
}
