#!/usr/bin/env node
/**
 * Intelligent Image Scraper
 * Extracts high-quality images from reference websites and review platforms
 */

import { JSDOM } from 'jsdom';

/**
 * Extract images from a reference website
 * @param {string} url - Website URL to scrape
 * @returns {Promise<{heroImages: string[], testimonialImages: string[]}>}
 */
export async function scrapeImagesFromWebsite(url, siteName) {
    console.log(`   🔍 Analyzing ${url} for images...`);

    try {
        const response = await fetch(url);
        const html = await response.text();
        const dom = new JSDOM(html);
        const document = dom.window.document;

        const images = {
            heroImages: [],
            testimonialImages: [],
            allImages: []
        };

        // Find all images in the page
        const imgElements = document.querySelectorAll('img');

        for (const img of imgElements) {
            const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy');
            if (!src) continue;

            // Convert relative URLs to absolute
            let imageUrl = src;
            if (src.startsWith('/')) {
                const urlObj = new URL(url);
                imageUrl = `${urlObj.origin}${src}`;
            } else if (!src.startsWith('http')) {
                const urlObj = new URL(url);
                imageUrl = `${urlObj.origin}/${src}`;
            }

            // Skip common non-content images
            if (isValidContentImage(imageUrl, img)) {
                const imageInfo = {
                    url: imageUrl,
                    alt: img.alt || '',
                    width: parseInt(img.width) || 0,
                    height: parseInt(img.height) || 0,
                    isHero: isLikelyHeroImage(img, imageUrl),
                    isTestimonial: isLikelyTestimonialImage(img, imageUrl)
                };

                images.allImages.push(imageInfo);

                if (imageInfo.isHero) {
                    images.heroImages.push(imageUrl);
                }
                if (imageInfo.isTestimonial) {
                    images.testimonialImages.push(imageUrl);
                }
            }
        }

        console.log(`   ✓ Found ${images.allImages.length} potential images`);
        console.log(`   ✓ ${images.heroImages.length} hero candidates, ${images.testimonialImages.length} testimonial candidates`);

        return images;

    } catch (error) {
        console.error(`   ⚠️  Failed to scrape website:`, error.message);
        return { heroImages: [], testimonialImages: [], allImages: [] };
    }
}

/**
 * Try to find Google Maps review images
 * @param {string} businessName - Name of the business
 * @returns {Promise<string[]>}
 */
export async function findGoogleMapsImages(businessName) {
    console.log(`   🗺️  Searching Google Maps for "${businessName}"...`);

    // Note: Google Maps scraping requires complex authentication and is against ToS
    // For production, use the official Google Places API
    // This is a placeholder for the concept

    console.log(`   ℹ️  Google Maps API integration recommended (requires API key)`);
    return [];
}

/**
 * Try to find TripAdvisor review images
 * @param {string} referenceUrl - Reference website URL
 * @returns {Promise<string[]>}
 */
export async function findTripAdvisorImages(referenceUrl) {
    console.log(`   🎫 Searching for TripAdvisor reviews...`);

    try {
        const response = await fetch(referenceUrl);
        const html = await response.text();

        // Look for TripAdvisor widget or links
        const tripAdvisorLinks = html.match(/https?:\/\/[^"'\s]*tripadvisor[^"'\s]*/gi) || [];

        if (tripAdvisorLinks.length > 0) {
            console.log(`   ✓ Found ${tripAdvisorLinks.length} TripAdvisor references`);
            // In production, would scrape the TripAdvisor page
            // Note: TripAdvisor has strict anti-scraping measures
            return [];
        }

        console.log(`   ℹ️  No TripAdvisor integration found`);
        return [];

    } catch (error) {
        console.error(`   ⚠️  TripAdvisor search failed:`, error.message);
        return [];
    }
}

/**
 * Check if an image is likely valid content
 */
function isValidContentImage(url, imgElement) {
    const urlLower = url.toLowerCase();

    // Skip common non-content images
    const skipPatterns = [
        'logo', 'icon', 'sprite', 'banner-ad', 'pixel',
        'tracking', 'analytics', '1x1', 'spacer',
        'button', 'arrow', 'social', 'badge'
    ];

    for (const pattern of skipPatterns) {
        if (urlLower.includes(pattern)) return false;
    }

    // Skip very small images (likely icons)
    const width = parseInt(imgElement.width) || 0;
    const height = parseInt(imgElement.height) || 0;
    if (width > 0 && height > 0 && (width < 200 || height < 150)) {
        return false;
    }

    // Skip data URIs
    if (url.startsWith('data:')) return false;

    return true;
}

/**
 * Determine if an image is likely a hero/banner image
 */
function isLikelyHeroImage(imgElement, url) {
    const urlLower = url.toLowerCase();
    const altLower = (imgElement.alt || '').toLowerCase();
    const classNames = (imgElement.className || '').toLowerCase();

    // Check for hero-related keywords
    const heroKeywords = ['hero', 'banner', 'header', 'cover', 'featured', 'main', 'slider'];

    for (const keyword of heroKeywords) {
        if (urlLower.includes(keyword) || altLower.includes(keyword) || classNames.includes(keyword)) {
            return true;
        }
    }

    // Check size - hero images are typically large
    const width = parseInt(imgElement.width) || 0;
    const height = parseInt(imgElement.height) || 0;

    if (width >= 1200 || height >= 600) {
        return true;
    }

    return false;
}

/**
 * Determine if an image is likely a testimonial/person photo
 */
function isLikelyTestimonialImage(imgElement, url) {
    const urlLower = url.toLowerCase();
    const altLower = (imgElement.alt || '').toLowerCase();
    const classNames = (imgElement.className || '').toLowerCase();

    // Check for testimonial/people-related keywords
    const testimonialKeywords = [
        'testimonial', 'review', 'customer', 'client',
        'people', 'person', 'guest', 'traveler',
        'avatar', 'profile', 'user', 'team'
    ];

    for (const keyword of testimonialKeywords) {
        if (urlLower.includes(keyword) || altLower.includes(keyword) || classNames.includes(keyword)) {
            return true;
        }
    }

    // Testimonial images are typically square or portrait
    const width = parseInt(imgElement.width) || 0;
    const height = parseInt(imgElement.height) || 0;

    if (width > 0 && height > 0) {
        const aspectRatio = width / height;
        // Square to portrait (0.5 to 1.2 aspect ratio)
        if (aspectRatio >= 0.5 && aspectRatio <= 1.2 && width >= 200) {
            return true;
        }
    }

    return false;
}

/**
 * Select the best images for hero and testimonials
 * @param {Object} scrapedImages - Images from website scraping
 * @param {string} tourType - Type of tour for fallback images
 * @returns {Promise<{heroImage: string, testimonialImages: string[]}>}
 */
export async function selectBestImages(scrapedImages, tourType) {
    const selected = {
        heroImage: '',
        testimonialImages: []
    };

    // Select hero image
    if (scrapedImages.heroImages.length > 0) {
        // Pick the first high-quality hero image
        selected.heroImage = scrapedImages.heroImages[0];
        console.log(`   ✓ Using scraped hero image`);
    } else if (scrapedImages.allImages.length > 0) {
        // Pick the largest image as hero
        const largest = scrapedImages.allImages.reduce((prev, current) => {
            const prevSize = (prev.width || 0) * (prev.height || 0);
            const currentSize = (current.width || 0) * (current.height || 0);
            return currentSize > prevSize ? current : prev;
        });
        selected.heroImage = largest.url;
        console.log(`   ✓ Using largest image as hero`);
    } else {
        // Fallback to Unsplash
        const fallbackId = await getFallbackHeroImage(tourType);
        selected.heroImage = `https://images.unsplash.com/photo-${fallbackId}?w=1920&q=80`;
        console.log(`   ℹ️  Using fallback Unsplash hero image`);
    }

    // Select testimonial images
    if (scrapedImages.testimonialImages.length >= 3) {
        selected.testimonialImages = scrapedImages.testimonialImages.slice(0, 3);
        console.log(`   ✓ Using scraped testimonial images`);
    } else if (scrapedImages.allImages.length >= 3) {
        // Pick 3 smallest/square images (likely to be people)
        const sorted = [...scrapedImages.allImages]
            .filter(img => {
                const aspectRatio = (img.width || 1) / (img.height || 1);
                return aspectRatio >= 0.5 && aspectRatio <= 1.5;
            })
            .sort((a, b) => {
                const sizeA = (a.width || 0) * (a.height || 0);
                const sizeB = (b.width || 0) * (b.height || 0);
                return sizeA - sizeB;
            });

        selected.testimonialImages = sorted.slice(0, 3).map(img => img.url);

        if (selected.testimonialImages.length < 3) {
            // Fill with fallbacks
            const fallbacks = await getFallbackTestimonialImages();
            while (selected.testimonialImages.length < 3) {
                const fallbackId = fallbacks[selected.testimonialImages.length];
                selected.testimonialImages.push(`https://images.unsplash.com/photo-${fallbackId}?w=600&q=80`);
            }
        }
        console.log(`   ✓ Using mixed testimonial images (${sorted.length} scraped, ${3 - sorted.length} fallback)`);
    } else {
        // All fallback
        const fallbacks = await getFallbackTestimonialImages();
        selected.testimonialImages = fallbacks.map(id =>
            `https://images.unsplash.com/photo-${id}?w=600&q=80`
        );
        console.log(`   ℹ️  Using fallback Unsplash testimonial images`);
    }

    return selected;
}

/**
 * Get fallback hero image ID based on tour type
 */
async function getFallbackHeroImage(tourType) {
    const imageMap = {
        fishing: '1544252890-a1e74f714247',
        catamaran: '1559827260-797a72d2a598',
        snorkeling: '1559827291-72ee739d0d9a',
        diving: '1544551763-46a013bb70d5',
        surfing: '1502680390469-be75c86b636f',
        default: '1506905925346-21bda4d32df4'
    };

    return imageMap[tourType] || imageMap.default;
}

/**
 * Get fallback testimonial image IDs
 */
async function getFallbackTestimonialImages() {
    return [
        '1539571696357-5a69c17a67c6',
        '1527631746610-bca00a040d60',
        '1507003211169-0a1dd7228f2d'
    ];
}
