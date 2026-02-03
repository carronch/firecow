/**
 * Accessibility Utilities
 * Helper functions for improving accessibility scores
 */

/**
 * Generate descriptive alt text for tour images
 */
export function generateImageAlt(context: string, imageType: string = 'photo'): string {
    const altTexts: Record<string, string> = {
        fishing: `Professional fishing charter ${imageType} in Costa Rica`,
        catamaran: `Luxury catamaran tour ${imageType} along Costa Rica coast`,
        snorkeling: `Crystal clear snorkeling adventure ${imageType}`,
        diving: `Scuba diving expedition ${imageType} in tropical waters`,
        surfing: `Surfing lessons and tours ${imageType}`,
        adventure: `Costa Rica adventure tour ${imageType}`,
        default: `Tour experience ${imageType} in Costa Rica`
    };

    return altTexts[context] || altTexts.default;
}

/**
 * Ensure proper color contrast for text
 */
export function getAccessibleColor(backgroundColor: string): string {
    // Simple contrast checker - returns black or white text based on background
    const darkBackgrounds = ['blue', 'purple', 'black', 'gray-900', 'gray-800'];

    for (const dark of darkBackgrounds) {
        if (backgroundColor.includes(dark)) {
            return 'text-white';
        }
    }

    return 'text-gray-900';
}

/**
 * Generate ARIA label for navigation elements
 */
export function getAriaLabel(element: string): string {
    const labels: Record<string, string> = {
        'main-nav': 'Main navigation',
        'footer-nav': 'Footer navigation',
        'social-media': 'Social media links',
        'contact-form': 'Contact form',
        'tour-grid': 'Available tours and experiences'
    };

    return labels[element] || element;
}
