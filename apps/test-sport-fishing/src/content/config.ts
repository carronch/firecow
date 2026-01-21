
import { defineCollection, z } from 'astro:content';

const tours = defineCollection({
    // Type-check frontmatter using a schema
    schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        // Transform string to Date object
        pubDate: z.coerce.date().optional(),
        updatedDate: z.coerce.date().optional(),
        heroImage: z.string().optional(),
    }),
});

const homepage = defineCollection({
    type: 'data',
    schema: z.object({
        siteName: z.string().optional(),
        logoEmoji: z.string().optional(),
        heroHeading: z.string().optional(),
        heroSubheading: z.string().optional(),
        heroImage: z.string().optional(),
        testimonialImage1: z.string().optional(),
        testimonialImage2: z.string().optional(),
        testimonialImage3: z.string().optional(),
        galleryImages: z.array(z.string()).optional(),
        locationName: z.string().optional(),
        locationAddress: z.string().optional(),
        googleMapsUrl: z.string().optional(),
        googleMapsLink: z.string().optional(),
    }),
});

export const collections = { tours, homepage };
