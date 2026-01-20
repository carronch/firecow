# Automated Placeholder Image Selection

## Overview

The `new-site.mjs` script has been enhanced to automatically select and set placeholder images when creating new sites. This ensures each site has unique, relevant imagery from the start.

## How It Works

When you create a new site, you can now specify a **tour type** as the third argument:

```bash
pnpm new-site my-site-name https://reference-url.com fishing
```

The script will:
1. **Select a hero image** based on the tour type (e.g., fishing boats for fishing tours)
2. **Select 3 testimonial images** - portrait-style photos that look like real travelers
3. **Automatically update** `settings.yaml` with these URLs

## Supported Tour Types

Currently mapped tour types:
- `fishing` - Deep sea fishing imagery
- `catamaran` - Catamaran sailing scenes
- `snorkeling` - Underwater snorkeling shots
- `diving` - Scuba diving scenes
- `surfing` - Surfing action shots
- `default` - Generic tropical beach (fallback)

## Image Sources

Currently, the script uses **curated Unsplash photo IDs** that are:
- High quality, professional photography
- Relevant to each tour type
- Licensable for commercial use (per Unsplash terms)

### Hero Images
High-resolution (1920px width) scenic images that capture the essence of the tour.

### Testimonial Images
Portrait-style photos (600px width) with:
- Natural, authentic-looking people
- Positive, happy expressions
- Diverse representation
- Photo quality that suggests user-generated content

## Usage Examples

### Create a fishing tour site:
```bash
pnpm new-site jaco-fishing https://fishingjaco.com fishing
```

### Create a catamaran tour site:
```bash
pnpm new-site isla-tortuga-sail https://tortugacruises.com catamaran
```

### Create without placeholder images (manual setup later):
```bash
pnpm new-site my-tour https://example.com
```

## Customization for Production

### For Live Sites
Once your site is ready for production:
1. Replace placeholder URLs with your **bunny.net CDN URLs**
2. Use actual photos from:
   - Tour supplier websites
   - Customer reviews and social media
   - Professional photoshoots

### Via Keystatic CMS
You can update images through the Keystatic admin panel:
1. Navigate to `http://your-site.com/keystatic`
2. Edit the Homepage settings
3. Update the image URLs directly

## Future Enhancements

### Planned Features
1. **Unsplash API Integration**: Dynamic search instead of hardcoded IDs
2. **AI Image Search**: Use AI to find images from supplier websites
3. **Web Scraping**: Automatically extract photos from reference URLs
4. **Bunny.net Integration**: Upload and host images directly
5. **Gallery Images**: Auto-populate gallery sections

### Adding New Tour Types

To add support for new tour types, edit `scripts/new-site.mjs`:

```javascript
async function searchUnsplashImage(tourType, imageType) {
    const imageMap = {
        // ... existing types ...
        zipline: {
            hero: 'YOUR-UNSPLASH-PHOTO-ID',
        },
        // Add your new type here
    };
    // ...
}
```

## Technical Details

### Image URL Format
```
https://images.unsplash.com/photo-{PHOTO_ID}?w={WIDTH}&q={QUALITY}
```

- **PHOTO_ID**: Unique Unsplash identifier
- **WIDTH**: Image width in pixels
- **QUALITY**: JPEG quality (1-100)

### Settings.yaml Structure
```yaml
heroImage: "https://images.unsplash.com/photo-..."
testimonialImage1: "https://images.unsplash.com/photo-..."
testimonialImage2: "https://images.unsplash.com/photo-..."
testimonialImage3: "https://images.unsplash.com/photo-..."
```

## Notes

- Images are **URLs only** - no files are downloaded
- System is designed for **external CDN hosting**
- Unsplash images are placeholders - replace for production
- Always verify Unsplash license compliance for commercial use
