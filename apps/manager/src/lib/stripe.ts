import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'node:path';
import { MONOREPO_ROOT } from './file-system';

// Load environment variables from apps/template/.env
dotenv.config({ path: path.join(MONOREPO_ROOT, 'apps', 'template', '.env') });

let stripeInstance: Stripe | null = null;

function getStripeClient() {
    if (!stripeInstance) {
        const apiKey = process.env.STRIPE_SECRET_KEY;
        if (!apiKey) {
            throw new Error('STRIPE_SECRET_KEY environment variable is not set');
        }
        stripeInstance = new Stripe(apiKey, {
            apiVersion: '2026-01-28.clover',
        });
    }
    return stripeInstance;
}

export async function createPaymentLink(amount: number, currency: string = 'usd', description: string) {
    const stripe = getStripeClient();
    // 1. Create a Product/Price on the fly or reuse? 
    // For manual links, ad-hoc prices are easiest.

    // Create Price
    const price = await stripe.prices.create({
        currency,
        unit_amount: amount * 100, // cents
        product_data: {
            name: description,
        },
    });

    // Create Payment Link
    const paymentLink = await stripe.paymentLinks.create({
        line_items: [
            {
                price: price.id,
                quantity: 1,
            },
        ],
        allow_promotion_codes: true,
        after_completion: {
            type: 'redirect',
            redirect: {
                url: process.env.PUBLIC_SITE_URL || 'https://costacatcruises.com/thank-you', // Fallback URL
            },
        },
    });

    return paymentLink.url;
}

export async function checkPaymentStatus(sessionId: string) {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session.payment_status;
}
