import type { APIRoute } from 'astro';
import Stripe from 'stripe';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const { paymentIntentId, bookingId, apiBase } = await request.json();

        if (!paymentIntentId) {
            return new Response(JSON.stringify({ error: 'paymentIntentId required' }), { status: 400 });
        }

        const secretKey = import.meta.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
            return new Response(JSON.stringify({ error: 'Stripe not configured' }), { status: 500 });
        }

        const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });

        // Retrieve the payment intent to get the charge ID
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        const chargeId = typeof pi.latest_charge === 'string' ? pi.latest_charge : pi.latest_charge?.id;

        if (!chargeId) {
            return new Response(JSON.stringify({ error: 'No charge found on payment intent' }), { status: 400 });
        }

        // Issue the refund
        const refund = await stripe.refunds.create({ charge: chargeId });

        // Update booking status in Worker DB
        if (bookingId && apiBase) {
            try {
                await fetch(`${apiBase}/api/bookings/${bookingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'refunded' }),
                });
            } catch (e) {
                console.error('Failed to update booking status after refund:', e);
            }
        }

        return new Response(JSON.stringify({ refundId: refund.id, status: refund.status }), { status: 200 });

    } catch (error: any) {
        console.error('Refund error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
