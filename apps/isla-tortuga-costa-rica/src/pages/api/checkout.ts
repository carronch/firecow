import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { createCheckoutSession } from '../../utils/stripe';

export const prerender = false;

export const POST: APIRoute = async ({ request, site }) => {
    try {
        const data = await request.json();
        const { tourId, date, adults, children = 0 } = data;

        if (!tourId || !date) {
            return new Response(JSON.stringify({ error: 'Missing defined fields' }), { status: 400 });
        }

        // Fetch tour details
        const tour = await getEntry('tours', tourId);
        if (!tour) {
            return new Response(JSON.stringify({ error: 'Tour not found' }), { status: 404 });
        }

        // Calculate Price based on Season and Participants
        let adultPrice = 0;
        let childPrice = 0;

        // Default base prices
        // Handle legacy number price or new object price
        if (typeof tour.data.price === 'number') {
            adultPrice = tour.data.price;
            childPrice = tour.data.price;
        } else {
            adultPrice = tour.data.price.adult;
            childPrice = tour.data.price.child || tour.data.price.adult;
        }

        // Check for Seasonal Overrides
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

        // Origin for return_url
        const origin = new URL(request.url).origin;
        // The return_url for embedded checkout
        const returnUrl = `${origin}/success?session_id={CHECKOUT_SESSION_ID}`;

        const session = await createCheckoutSession({
            name: `${tour.data.title}`,
            description: `Date: ${date}. Adults: ${adults}, Children: ${children}`,
            amount: totalAmountCents,
            quantity: 1, // Quantity is 1 "booking" of the total calculated amount
            date: date,
            uiMode: 'embedded',
            returnUrl: returnUrl,
            metadata: {
                tourId: tour.id,
                tourName: tour.data.title,
                adults: String(adults),
                children: String(children),
                tourOperator: tour.data.tourOperator || 'Unknown'
            }
        });

        return new Response(JSON.stringify({
            clientSecret: session.client_secret
        }), { status: 200 });

    } catch (error: any) {
        console.error('Checkout Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
