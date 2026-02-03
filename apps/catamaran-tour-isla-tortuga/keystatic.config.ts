import { config, fields, collection } from '@keystatic/core';

export default config({
    storage: {
        kind: 'github',
        repo: 'carronch/firecow',
    },
    collections: {
        tours: collection({
            label: 'Tours',
            slugField: 'title',
            path: 'src/content/tours/*',
            format: { contentField: 'content' },
            schema: {
                title: fields.slug({ name: { label: 'Title' } }),
                tagline: fields.text({ label: 'Tagline' }),
                heroImage: fields.image({
                    label: 'Hero Image',
                    directory: 'public/images/tours',
                    publicPath: '/images/tours/'
                }),
                duration: fields.text({ label: 'Duration' }),
                maxCapacity: fields.integer({ label: 'Max Capacity' }),
                basePrice: fields.integer({ label: 'Base Price' }),
                highSeasonPrice: fields.integer({ label: 'High Season Price' }),
                category: fields.select({
                    label: 'Category',
                    options: [
                        { label: 'Water Sports', value: 'water-sports' },
                        { label: 'Adventure', value: 'adventure' },
                        { label: 'Relaxation', value: 'relaxation' },
                        { label: 'Wildlife', value: 'wildlife' }
                    ],
                    defaultValue: 'adventure'
                }),
                featured: fields.checkbox({ label: 'Featured', defaultValue: false }),
                whatsIncluded: fields.array(fields.text({ label: 'Item' }), {
                    label: 'What\'s Included',
                    itemLabel: props => props.value
                }),
                whatToBring: fields.array(fields.text({ label: 'Item' }), {
                    label: 'What to Bring',
                    itemLabel: props => props.value
                }),
                content: fields.document({
                    label: 'Content',
                    formatting: true,
                    dividers: true,
                    links: true,
                    images: true,
                }),
            },
        }),
        upsells: collection({
            label: 'Upsells',
            slugField: 'name',
            path: 'src/content/upsells/*',
            schema: {
                name: fields.slug({ name: { label: 'Name' } }),
                price: fields.integer({ label: 'Price' }),
                description: fields.text({ label: 'Description', multiline: true }),
                image: fields.image({
                    label: 'Image',
                    directory: 'public/images/upsells',
                    publicPath: '/images/upsells/'
                }),
            }
        }),
        faqs: collection({
            label: 'FAQs',
            slugField: 'question',
            path: 'src/content/faqs/*',
            schema: {
                question: fields.slug({ name: { label: 'Question' } }),
                answer: fields.text({ label: 'Answer', multiline: true }),
                category: fields.select({
                    label: 'Category',
                    options: [
                        { label: 'Booking', value: 'booking' },
                        { label: 'General', value: 'general' },
                        { label: 'Safety', value: 'safety' }
                    ],
                    defaultValue: 'general'
                })
            }
        })
    },
    singletons: {
        homepage: {
            label: 'Homepage & Site Settings',
            path: 'src/content/homepage/settings',
            schema: {
                siteName: fields.text({ label: 'Site Name' }),
                logoEmoji: fields.text({ label: 'Logo Emoji (e.g. 🐢)' }),
                heroImage: fields.image({
                    label: 'Hero Background Image',
                    directory: 'public/images/hero',
                    publicPath: '/images/hero/'
                }),
                heroHeading: fields.text({ label: 'Hero Heading' }),
                heroSubheading: fields.text({ label: 'Hero Subheading' }),
                testimonialImage1: fields.image({ label: 'Testimonial Image 1', directory: 'public/images/testimonials', publicPath: '/images/testimonials/' }),
                testimonialImage2: fields.image({ label: 'Testimonial Image 2', directory: 'public/images/testimonials', publicPath: '/images/testimonials/' }),
                testimonialImage3: fields.image({ label: 'Testimonial Image 3', directory: 'public/images/testimonials', publicPath: '/images/testimonials/' }),
                galleryImages: fields.array(
                    fields.image({
                        label: 'Gallery Image',
                        directory: 'public/images/gallery',
                        publicPath: '/images/gallery/'
                    }),
                    {
                        label: 'Photo Gallery',
                        itemLabel: (props) => props.value ? 'Image' : 'New Image'
                    }
                ),
                locationName: fields.text({ label: 'Location Name (e.g. "Los Sueños Marina")' }),
                locationAddress: fields.text({ label: 'Full Address', multiline: true }),
                googleMapsUrl: fields.url({ label: 'Google Maps Embed URL (iframe src)' }),
                googleMapsLink: fields.url({ label: 'Google Maps Link (for "Open in Maps")' })
            }
        }
    }
});
