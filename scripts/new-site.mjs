import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Get arguments
const args = process.argv.slice(2);
const siteName = args[0];
const referenceUrl = args[1];

if (!siteName) {
    console.error('❌ Please provide a site name.');
    console.error('Usage: pnpm new-site <site-name> [reference-url]');
    process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const templateDir = path.join(rootDir, 'apps', 'template');
const newSiteDir = path.join(rootDir, 'apps', siteName);

// 1. Validation
if (fs.existsSync(newSiteDir)) {
    console.error(`❌ Site "${siteName}" already exists at: ${newSiteDir}`);
    process.exit(1);
}

if (!fs.existsSync(templateDir)) {
    console.error(`❌ Template not found at: ${templateDir}`);
    process.exit(1);
}

console.log(`🚀 Creating new site: ${siteName}...`);

// 2. Scaffold (Copy Template)
console.log('📂 Copying template...');
fs.cpSync(templateDir, newSiteDir, { recursive: true });

// 3. Customize
console.log('⚙️  Configuring project...');

// Update package.json
const packageJsonPath = path.join(newSiteDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
packageJson.name = `@firecow/${siteName}`;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4));

// Update astro.config.mjs (Optional customization could go here)
// For now, we leave it as is, or we could set the site URL if known.

// 4. Fetch Reference (if provided)
if (referenceUrl) {
    console.log(`🌍 Fetching reference content from: ${referenceUrl}`);
    try {
        const response = await fetch(referenceUrl);
        const html = await response.text();

        const referencePath = path.join(newSiteDir, 'REFERENCE.md');
        const content = `
# Reference Content for ${siteName}
Source: ${referenceUrl}
Date: ${new Date().toISOString()}

---

${html}
`;
        fs.writeFileSync(referencePath, content.trim());
        console.log('✅ Reference content saved to REFERENCE.md');
    } catch (error) {
        console.error('⚠️  Failed to fetch reference URL:', error.message);
    }
}

// 5. Install Dependencies
console.log('📦 Installing dependencies (linking workspace)...');
try {
    execSync('pnpm install', { stdio: 'inherit', cwd: rootDir });
} catch (e) {
    console.error('⚠️  pnpm install failed, please run it manually.');
}

console.log('\n✅ Site created successfully!');
console.log(`👉 To start development:`);
console.log(`   pnpm --filter @firecow/${siteName} dev`);
