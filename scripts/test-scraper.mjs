#!/usr/bin/env node
/**
 * Test the image scraper on a URL
 */

import { scrapeImagesFromWebsite, selectBestImages } from './image-scraper.mjs';

const url = process.argv[2] || 'http://mavericksportfish.com/';
const tourType = process.argv[3] || 'fishing';

console.log(`\n🧪 Testing Image Scraper`);
console.log(`URL: ${url}`);
console.log(`Tour Type: ${tourType}\n`);

try {
    const scrapedImages = await scrapeImagesFromWebsite(url, 'test-site');

    console.log(`\n📊 Results:`);
    console.log(`   Total images found: ${scrapedImages.allImages.length}`);
    console.log(`   Hero candidates: ${scrapedImages.heroImages.length}`);
    console.log(`   Testimonial candidates: ${scrapedImages.testimonialImages.length}\n`);

    if (scrapedImages.heroImages.length > 0) {
        console.log(`🎯 Hero Images Found:`);
        scrapedImages.heroImages.slice(0, 3).forEach((img, i) => {
            console.log(`   ${i + 1}. ${img}`);
        });
        console.log('');
    }

    if (scrapedImages.testimonialImages.length > 0) {
        console.log(`👥 Testimonial Images Found:`);
        scrapedImages.testimonialImages.slice(0, 3).forEach((img, i) => {
            console.log(`   ${i + 1}. ${img}`);
        });
        console.log('');
    }

    console.log(`\n✨ Selecting Best Images...\n`);
    const selected = await selectBestImages(scrapedImages, tourType);

    console.log(`📸 Final Selection:`);
    console.log(`   Hero: ${selected.heroImage}`);
    console.log(`   Testimonial 1: ${selected.testimonialImages[0]}`);
    console.log(`   Testimonial 2: ${selected.testimonialImages[1]}`);
    console.log(`   Testimonial 3: ${selected.testimonialImages[2]}\n`);

} catch (error) {
    console.error(`\n❌ Error:`, error.message);
    console.error(error.stack);
}
