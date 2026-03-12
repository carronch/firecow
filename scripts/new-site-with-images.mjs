import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Get arguments
const args = process.argv.slice(2);
const siteName = args[0];
const referenceUrl = args[1];
const tourType = args[2]; // e.g., "fishing", "catamaran", "snorkeling"

if (!siteName) {
    console.error('❌ Please provide a site name.');
    console.error('Usage: pnpm new-site <site-name> [reference-url] [tour-type]');
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

// 5. Find and Set Placeholder Images
if (tourType) {
    console.log(`🖼️  Searching for placeholder images for "${tourType}" tours...`);
    try {
        const images = await findPlaceholderImages(tourType, siteName);

        // Update settings.yaml with the found images
        const settingsPath = path.join(newSiteDir, 'src', 'content', 'homepage', 'settings.yaml');
        let settingsContent = fs.readFileSync(settingsPath, 'utf8');

        // Replace hero image
        settingsContent = settingsContent.replace(
            /heroImage: ".*"/,
            `heroImage: "${images.heroImage}"`
        );

        // Replace testimonial images
        settingsContent = settingsContent.replace(
            /testimonialImage1: ".*"/,
            `testimonialImage1: "${images.testimonialImages[0]}"`
        );
        settingsContent = settingsContent.replace(
            /testimonialImage2: ".*"/,
            `testimonialImage2: "${images.testimonialImages[1]}"`
        );
        settingsContent = settingsContent.replace(
            /testimonialImage3: ".*"/,
            `testimonialImage3: "${images.testimonialImages[2]}"`
        );

        fs.writeFileSync(settingsPath, settingsContent);
        console.log('✅ Placeholder images set in settings.yaml');
        console.log(`   Hero: ${images.heroImage}`);
        console.log(`   Testimonials: ${images.testimonialImages.join(', ')}`);
    } catch (error) {
        console.error('⚠️  Failed to set placeholder images:', error.message);
        console.log('   You can manually update images later in settings.yaml');
    }
}

// 6. Install Dependencies
console.log('📦 Installing dependencies (linking workspace)...');
try {
    execSync('pnpm install', { stdio: 'inherit', cwd: rootDir });
} catch (e) {
    console.error('⚠️  pnpm install failed, please run it manually.');
}

console.log('\n✅ Site created successfully!');
console.log(`👉 To start development:`);
console.log(`   pnpm --filter @firecow/${siteName} dev`);

/**
 * Find placeholder images for a new site based on tour type
 * @param {string} tourType - Type of tour (e.g., "fishing", "catamaran", "snorkeling")
 * @param {string} siteName - Name of the site for context
 * @returns {Promise<{heroImage: string, testimonialImages: string[]}>}
 */
async function findPlaceholderImages(tourType, siteName) {
    // Search terms based on tour type
    const searchTerms = {
        hero: `${tourType} costa rica adventure`,
        testimonials: `happy tourists ${tourType}`,
    };

    // For now, we'll use Unsplash with specific search queries
    // In production, you might want to use the Unsplash API for better results
    const heroQuery = encodeURIComponent(searchTerms.hero);
    const testimonialQuery = encodeURIComponent(searchTerms.testimonials);

    // These are example Unsplash URLs - in a real implementation,
    // you'd want to use the Unsplash API to get specific image IDs
    const heroImageId = await searchUnsplashImage(tourType, 'hero');
    const testimonialImageIds = await searchUnsplashImages(tourType, 'portrait', 3);

    return {
        heroImage: `https://images.unsplash.com/photo-${heroImageId}?w=1920&q=80`,
        testimonialImages: testimonialImageIds.map(id =>
            `https://images.unsplash.com/photo-${id}?w=600&q=80`
        ),
    };
}

/**
 * Search Unsplash for a hero image
 * This is a placeholder - in production, implement actual Unsplash API calls
 */
async function searchUnsplashImage(tourType, imageType) {
    // Map tour types to specific high-quality Unsplash image IDs
    const imageMap = {
        fishing: {
            hero: '1544252890-a1e74f714247', // Fishing boat
        },
        catamaran: {
            hero: '1559827260-797a72d2a598', // Catamaran sailing
        },
        snorkeling: {
            hero: '1559827291-72ee739d0d9a', // Snorkeling underwater
        },
        diving: {
            hero: '1544551763-46a013bb70d5', // Scuba diving
        },
        default: {
            hero: '1506905925346-21bda4d32df4', // Tropical beach
        }
    };

    return imageMap[tourType]?.[imageType] || imageMap.default.hero;
}

/**
 * Search Unsplash for testimonial images (portrait style)
 */
async function searchUnsplashImages(tourType, style, count) {
    // High-quality portrait images that look like real travelers
    const portraitImages = [
        '1539571696357-5a69c17a67c6', // Man smiling
        '1527631746610-bca00a040d60', // Woman happy
        '1507003211169-0a1dd7228f2d', // Man portrait
        '1500648767791-00dcc994a43e', // Woman portrait
        '1506794778202-cad84cf45f1d', // Man casual
    ];

    // Return the requested number of images
    return portraitImages.slice(0, count);
}
