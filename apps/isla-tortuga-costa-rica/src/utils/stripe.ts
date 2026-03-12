import Stripe from 'stripe';

export const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16', // Use a recent API version
    typescript: true,
});

export async function createCheckoutSession(params: {
    priceId?: string;
    name?: string;
    description?: string;
    amount?: number;
    currency?: string;
    quantity: number;
    date: string;
    successUrl?: string; // Optional for embedded
    cancelUrl?: string; // Optional for embedded
    returnUrl?: string; // Required for embedded
    uiMode?: 'hosted' | 'embedded';
    customerEmail?: string;
    metadata?: Record<string, string>;
}) {
    const {
        priceId, name, description, amount, currency = 'usd', quantity,
        date, successUrl, cancelUrl, returnUrl, uiMode = 'hosted',
        customerEmail, metadata
    } = params;

    let line_items;

    if (priceId) {
        line_items = [{
            price: priceId,
            quantity,
        }];
    } else if (name && amount) {
        line_items = [{
            price_data: {
                currency,
                product_data: {
                    name,
                    description,
                    metadata: {
                        date,
                    }
                },
                unit_amount: Math.round(amount), // Ensure integer cents
            },
            quantity,
        }];
    } else {
        throw new Error('Either priceId or (name and amount) must be provided');
    }

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items,
        mode: 'payment',
        customer_email: customerEmail,
        metadata: {
            date,
            tour_name: name || 'Tour',
            ...metadata
        },
        phone_number_collection: {
            enabled: true,
        },
    };

    if (uiMode === 'embedded') {
        sessionConfig.ui_mode = 'embedded';
        sessionConfig.return_url = returnUrl;
    } else {
        sessionConfig.success_url = successUrl;
        sessionConfig.cancel_url = cancelUrl;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return session;
}
