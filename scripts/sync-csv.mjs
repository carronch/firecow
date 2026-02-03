#!/usr/bin/env node
/**
 * CSV to Site Config Sync Script
 * Reads sites-content.csv and generates site.config.ts for each site
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, '..', 'sites-content.csv');
const APPS_DIR = path.join(__dirname, '..', 'apps');

// Parse CSV with auto-detect delimiter
function parseCSV(csvText) {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim());

    // Auto-detect delimiter (comma or semicolon)
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';

    const headers = firstLine.split(delimiter).map(h => h.trim());
    const sites = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Handle quoted fields
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());

        const site = {};
        headers.forEach((header, index) => {
            site[header.trim()] = values[index]?.trim() || '';
        });

        sites.push(site);
    }

    return sites;
}

// Generate TypeScript config content
function generateConfigContent(site) {
    const activities = site.daily_activities
        .split('|')
        .map(a => a.trim())
        .filter(a => a);

    const schedule = site.tour_schedule
        .split('|')
        .map(s => s.trim())
        .filter(s => s);

    const galleryImages = [
        site.gallery_img_01,
        site.gallery_img_02,
        site.gallery_img_03,
        site.gallery_img_04,
        site.gallery_img_05,
        site.gallery_img_06,
    ].filter(img => img);

    const reviews = [
        {
            image: site.review_1_image,
            text: site.review_1_text,
            author: site.review_1_author
        },
        {
            image: site.review_2_image,
            text: site.review_2_text,
            author: site.review_2_author
        },
        {
            image: site.review_3_image,
            text: site.review_3_text,
            author: site.review_3_author
        }
    ].filter(r => r.image && r.text && r.author);

    return `// Auto-generated from sites-content.csv
// Last synced: ${new Date().toISOString().split('T')[0]}

export interface SiteConfig {
  siteId: string;
  siteName: string;
  siteEmoji: string;
  heroImageUrl: string;
  dailyActivities: string[];
  tourSchedule: string[];
  gallery: {
    images: string[];
  };
  reviews: Array<{
    image: string;
    text: string;
    author: string;
  }>;
  contact: {
    googleBusinessUrl: string;
    phoneNumber: string;
  };
}

export const siteConfig: SiteConfig = {
  siteId: "${site.site_id}",
  siteName: "${site.site_name}",
  siteEmoji: "${site.site_emoji}",
  heroImageUrl: "${site.hero_image_url}",
  dailyActivities: ${JSON.stringify(activities, null, 4)},
  tourSchedule: ${JSON.stringify(schedule, null, 4)},
  gallery: {
    images: ${JSON.stringify(galleryImages, null, 6)}
  },
  reviews: [
${reviews.map(r => `    {
      image: "${r.image}",
      text: "${r.text}",
      author: "${r.author}"
    }`).join(',\n')}
  ],
  contact: {
    googleBusinessUrl: "${site.google_business_url}",
    phoneNumber: "${site.phone_number}"
  }
};
`;
}

// Main sync function
function syncCSV() {
    console.log('🔄 Starting CSV sync...\n');

    // Read CSV
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const sites = parseCSV(csvContent);

    console.log(`📊 Found ${sites.length} sites in CSV\n`);

    let successCount = 0;
    let errorCount = 0;

    // Generate config for each site
    for (const site of sites) {
        const siteId = site.site_id;
        if (!siteId) continue;

        const sitePath = path.join(APPS_DIR, siteId);
        const configDir = path.join(sitePath, 'src', 'config');
        const configPath = path.join(configDir, 'site.config.ts');
        const templatePath = path.join(APPS_DIR, 'template');

        try {
            // 1. Check if site exists, if not create it from template
            if (!fs.existsSync(path.join(sitePath, 'package.json'))) {
                console.log(`✨ New site found: ${siteId}`);
                console.log(`   📂 Scaffolding from template...`);

                if (!fs.existsSync(templatePath)) {
                    throw new Error('Template directory not found! Cannot scaffold new site.');
                }

                // Copy template
                fs.cpSync(templatePath, sitePath, { recursive: true });

                // Update package.json name
                const pkgPath = path.join(sitePath, 'package.json');
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
                pkg.name = `@firecow/${siteId}`;
                fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 4));

                console.log(`   📦 Created new site structure`);
            }

            // 2. Create config directory if it doesn't exist
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }

            // 3. Generate and write config
            const configContent = generateConfigContent(site);
            fs.writeFileSync(configPath, configContent);

            console.log(`✅ ${siteId} - Config synced`);
            successCount++;
        } catch (error) {
            console.error(`❌ ${siteId} - Error: ${error.message}`);
            errorCount++;
        }
    }

    console.log(`\n🎉 Sync complete!`);
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
}

// Run sync
syncCSV();
