#!/usr/bin/env node
/**
 * Unified Site Deployment Script
 * Creates, builds, and deploys a new site to Cloudflare Pages in one command
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Get arguments
const args = process.argv.slice(2);
const siteName = args[0];
const referenceUrl = args[1];
const tourType = args[2];

if (!siteName) {
    console.error('❌ Please provide a site name.');
    console.error('Usage: pnpm deploy-site <site-name> [reference-url] [tour-type]');
    console.error('\nExample: pnpm deploy-site fishing-jaco https://example.com fishing');
    process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const templateDir = path.join(rootDir, 'apps', 'template');
const newSiteDir = path.join(rootDir, 'apps', siteName);
const cloudflareProjectName = siteName; // Use site name as project name

console.log('\n🚀 ========================================');
console.log(`   DEPLOYING: ${siteName}`);
console.log('========================================\n');

// STEP 1: Create Site
console.log('📦 STEP 1/5: Creating site...');
if (fs.existsSync(newSiteDir)) {
    console.log(`   ⚠️  Site "${siteName}" already exists, skipping creation...`);
} else {
    if (!fs.existsSync(templateDir)) {
        console.error(`❌ Template not found at: ${templateDir}`);
        process.exit(1);
    }

    console.log('   📂 Copying template...');
    fs.cpSync(templateDir, newSiteDir, { recursive: true });

    // Update package.json
    const packageJsonPath = path.join(newSiteDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.name = `@firecow/${siteName}`;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4));
    console.log('   ✅ Site scaffolded');
}

// STEP 2: Fetch Reference Content
if (referenceUrl && !fs.existsSync(path.join(newSiteDir, 'REFERENCE.md'))) {
    console.log('\n🌍 STEP 2/5: Fetching reference content...');
    try {
        const response = await fetch(referenceUrl);
        const html = await response.text();
        const referencePath = path.join(newSiteDir, 'REFERENCE.md');
        const content = `# Reference Content for ${siteName}\nSource: ${referenceUrl}\nDate: ${new Date().toISOString()}\n\n---\n\n${html}`;
        fs.writeFileSync(referencePath, content.trim());
        console.log(`   ✅ Reference saved from ${referenceUrl}`);
    } catch (error) {
        console.error('   ⚠️  Failed to fetch reference:', error.message);
    }
} else {
    console.log('\n⏭️  STEP 2/5: Skipping reference fetch (already exists or not provided)');
}

// STEP 3: Set Placeholder Images
if (tourType) {
    console.log(`\n🖼️  STEP 3/5: Setting placeholder images for "${tourType}" tours...`);
    try {
        const images = await findPlaceholderImages(tourType, siteName);
        const settingsPath = path.join(newSiteDir, 'src', 'content', 'homepage', 'settings.yaml');
        let settingsContent = fs.readFileSync(settingsPath, 'utf8');

        settingsContent = settingsContent.replace(/heroImage: ".*"/, `heroImage: "${images.heroImage}"`);
        settingsContent = settingsContent.replace(/testimonialImage1: ".*"/, `testimonialImage1: "${images.testimonialImages[0]}"`);
        settingsContent = settingsContent.replace(/testimonialImage2: ".*"/, `testimonialImage2: "${images.testimonialImages[1]}"`);
        settingsContent = settingsContent.replace(/testimonialImage3: ".*"/, `testimonialImage3: "${images.testimonialImages[2]}"`);

        fs.writeFileSync(settingsPath, settingsContent);
        console.log('   ✅ Images configured');
    } catch (error) {
        console.error('   ⚠️  Failed to set images:', error.message);
    }
} else {
    console.log('\n⏭️  STEP 3/5: Skipping image selection (no tour type provided)');
}

// STEP 4: Build
console.log('\n🔨 STEP 4/5: Building site...');
try {
    execSync(`pnpm --filter @firecow/${siteName} build`, {
        stdio: 'inherit',
        cwd: rootDir
    });
    console.log('   ✅ Build successful');
} catch (error) {
    console.error('\n❌ Build failed!');
    console.error('   Please fix the errors above and try again.');
    process.exit(1);
}

// STEP 5: Deploy to Cloudflare
console.log('\n☁️  STEP 5/5: Deploying to Cloudflare Pages...');
try {
    const distPath = path.join('apps', siteName, 'dist');
    execSync(`npx wrangler pages deploy ${distPath} --project-name=${cloudflareProjectName}`, {
        stdio: 'inherit',
        cwd: rootDir
    });
    console.log('\n   ✅ Deployment successful!');
} catch (error) {
    console.error('\n❌ Deployment failed!');
    console.error('   Make sure you are logged in to Cloudflare:');
    console.error('   npx wrangler login');
    process.exit(1);
}

// SUCCESS!
console.log('\n✅ ========================================');
console.log('   DEPLOYMENT COMPLETE!');
console.log('========================================');
console.log(`\n🌐 Your site should be live at:`);
console.log(`   https://${cloudflareProjectName}.pages.dev\n`);
console.log(`📝 To run locally:`);
console.log(`   pnpm --filter @firecow/${siteName} dev\n`);

/**
 * Helper functions for image selection
 */
async function findPlaceholderImages(tourType, siteName) {
    const heroImageId = await searchUnsplashImage(tourType, 'hero');
    const testimonialImageIds = await searchUnsplashImages(tourType, 'portrait', 3);

    return {
        heroImage: `https://images.unsplash.com/photo-${heroImageId}?w=1920&q=80`,
        testimonialImages: testimonialImageIds.map(id =>
            `https://images.unsplash.com/photo-${id}?w=600&q=80`
        ),
    };
}

async function searchUnsplashImage(tourType, imageType) {
    const imageMap = {
        fishing: { hero: '1544252890-a1e74f714247' },
        catamaran: { hero: '1559827260-797a72d2a598' },
        snorkeling: { hero: '1559827291-72ee739d0d9a' },
        diving: { hero: '1544551763-46a013bb70d5' },
        surfing: { hero: '1502680390469-be75c86b636f' },
        default: { hero: '1506905925346-21bda4d32df4' }
    };

    return imageMap[tourType]?.[imageType] || imageMap.default.hero;
}

async function searchUnsplashImages(tourType, style, count) {
    const portraitImages = [
        '1539571696357-5a69c17a67c6',
        '1527631746610-bca00a040d60',
        '1507003211169-0a1dd7228f2d',
        '1500648767791-00dcc994a43e',
        '1506794778202-cad84cf45f1d',
    ];

    return portraitImages.slice(0, count);
}
