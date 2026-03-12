import { defineCollection, z } from 'astro:content';

const toursCollection = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        description: z.string(),
        price: z.object({
            adult: z.number(),
            child: z.number().optional(),
        }).or(z.number().transform(n => ({ adult: n }))), // Flexible to support legacy number
        duration: z.string().optional(),
        heroImage: z.string().url().optional(),
        minGuests: z.number().default(1),
        maxGuests: z.number().optional(),
        stripePriceId: z.string().optional(),
        included: z.array(z.string()).optional(),
        featured: z.boolean().default(false),
        tourOperator: z.string().optional(),
        blackoutDates: z.array(z.string()).optional(), // Dates in YYYY-MM-DD
        seasonalPricing: z.array(z.object({
            name: z.string(),
            startDate: z.string(), // YYYY-MM-DD
            endDate: z.string(), // YYYY-MM-DD
            price: z.object({
                adult: z.number(),
                child: z.number().optional()
            })
        })).optional()
    }),
});

export const collections = {
    'tours': toursCollection,
};
