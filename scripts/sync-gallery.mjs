#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const appsDir = path.join(rootDir, 'apps');

const templateGalleryPath = path.join(appsDir, 'template', 'src', 'components', 'Gallery.astro');

if (!fs.existsSync(templateGalleryPath)) {
    console.error('❌ Template Gallery component not found!');
    process.exit(1);
}

// Get all directories in apps/
const sites = fs.readdirSync(appsDir).filter(file => {
    return fs.statSync(path.join(appsDir, file)).isDirectory() && file !== 'template' && !file.startsWith('.');
});

console.log(`🔄 Syncing Gallery.astro to ${sites.length} sites...`);

sites.forEach(site => {
    const targetPath = path.join(appsDir, site, 'src', 'components', 'Gallery.astro');
    try {
        // Ensure dir exists
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        fs.copyFileSync(templateGalleryPath, targetPath);
        console.log(`✅ Updated: ${site}`);
    } catch (err) {
        console.error(`❌ Failed to update ${site}:`, err.message);
    }
});

console.log('🎉 Done!');
