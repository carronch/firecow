import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { createCheckoutSession } from '../../utils/stripe';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();
        const { tourId, date, adults, children = 0, utmParams = {} } = data;

        if (!tourId || !date) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
        }

        const tour = await getEntry('tours', tourId);
        if (!tour) {
            return new Response(JSON.stringify({ error: 'Tour not found' }), { status: 404 });
        }

        // Calculate price (base or seasonal)
        let adultPrice = 0;
        let childPrice = 0;

        if (typeof tour.data.price === 'number') {
            adultPrice = tour.data.price;
            childPrice = tour.data.price;
        } else {
            adultPrice = tour.data.price.adult;
            childPrice = tour.data.price.child || tour.data.price.adult;
        }

        const bookingDate = new Date(date);
        if (tour.data.seasonalPricing) {
            for (const season of tour.data.seasonalPricing) {
                const start = new Date(season.startDate);
                const end = new Date(season.endDate);
                if (bookingDate >= start && bookingDate <= end) {
                    adultPrice = season.price.adult;
                    childPrice = season.price.child || season.price.adult;
                    break;
                }
            }
        }

        const totalAmountCents = Math.round((adultPrice * adults + childPrice * children) * 100);

        const origin = new URL(request.url).origin;
        const returnUrl = `${origin}/success?session_id={CHECKOUT_SESSION_ID}`;

        const session = await createCheckoutSession({
            name: tour.data.title,
            description: `Date: ${date}. Adults: ${adults}, Children: ${children}`,
            amount: totalAmountCents,
            quantity: 1,
            date,
            uiMode: 'embedded',
            returnUrl,
            metadata: {
                tourId: tour.id,
                tourName: tour.data.title,
                adults: String(adults),
                children: String(children),
                tourOperator: tour.data.tourOperator || 'Unknown',
                // UTM attribution
                utm_source: utmParams.utm_source || '',
                utm_medium: utmParams.utm_medium || '',
                utm_campaign: utmParams.utm_campaign || '',
                utm_content: utmParams.utm_content || '',
            },
        });

        return new Response(JSON.stringify({ clientSecret: session.client_secret }), { status: 200 });

    } catch (error: any) {
        console.error('Checkout Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
