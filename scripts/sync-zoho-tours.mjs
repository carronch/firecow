
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const appsDir = path.join(rootDir, 'apps');

const templatePath = path.join(appsDir, 'template');

const filesToSync = [
    { src: 'src/pages/api/tours.ts', dest: 'src/pages/api/tours.ts' },
    { src: 'src/components/ExperiencesGrid.astro', dest: 'src/components/ExperiencesGrid.astro' }
];

// Get all directories in apps/
const sites = fs.readdirSync(appsDir).filter(file => {
    return fs.statSync(path.join(appsDir, file)).isDirectory() && file !== 'template' && !file.startsWith('.');
});

console.log(`🔄 Syncing Zoho Tours integration to ${sites.length} sites...`);

sites.forEach(site => {
    filesToSync.forEach(file => {
        const sourcePath = path.join(templatePath, file.src);
        const targetPath = path.join(appsDir, site, file.dest);

        try {
            if (!fs.existsSync(sourcePath)) {
                console.error(`❌ Source not found: ${sourcePath}`);
                return;
            }

            // Ensure dir exists
            const targetDir = path.dirname(targetPath);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            fs.copyFileSync(sourcePath, targetPath);
            console.log(`✅ Updated ${file.dest} in ${site}`);
        } catch (err) {
            console.error(`❌ Failed to update ${site}:`, err.message);
        }
    });
});

console.log('🎉 Done!');
