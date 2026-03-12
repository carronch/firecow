import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { stripe } from '../../../utils/stripe';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    const signature = request.headers.get('stripe-signature');
    const body = await request.text();

    let event: Stripe.Event;

    try {
        const secret = import.meta.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || '';
        if (secret && signature) {
            try {
                event = stripe.webhooks.constructEvent(body, signature, secret);
            } catch (err) {
                console.warn('Webhook signature verification failed. Falling back to body parse.');
                event = JSON.parse(body);
            }
        } else {
            event = JSON.parse(body);
        }
    } catch (err: any) {
        console.error('Webhook processing failed.', err.message);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const apiBase = import.meta.env.FIRECOW_API_URL || process.env.FIRECOW_API_URL || '';

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            console.log('Payment completed:', session.id);

            if (!apiBase) break;

            const metadata = session.metadata || {};
            const customerDetails = session.customer_details;
            const paymentIntentId = typeof session.payment_intent === 'string'
                ? session.payment_intent
                : (session.payment_intent as Stripe.PaymentIntent)?.id || '';
            const totalAmount = (session.amount_total || 0) / 100;

            if (!paymentIntentId) break;

            try {
                // Only create if success.astro hasn't already created it
                const lookupRes = await fetch(
                    `${apiBase}/api/bookings?payment_intent_id=${paymentIntentId}`
                );
                if (!lookupRes.ok) {
                    await fetch(`${apiBase}/api/bookings`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            tour_id: metadata.tourId || null,
                            site_id: 'isla-tortuga-costa-rica',
                            stripe_payment_intent_id: paymentIntentId,
                            customer_email: customerDetails?.email || '',
                            customer_name: customerDetails?.name || '',
                            booking_date: metadata.date || null,
                            party_size:
                                parseInt(metadata.adults || '1') +
                                parseInt(metadata.children || '0'),
                            total_amount: totalAmount,
                        }),
                    });
                    console.log('Booking created from webhook');
                } else {
                    console.log('Booking already exists (created from success page)');
                }
            } catch (e) {
                console.error('Failed to sync booking to Worker:', e);
            }
            break;
        }

        case 'charge.refunded': {
            const charge = event.data.object as Stripe.Charge;
            const paymentIntentId = typeof charge.payment_intent === 'string'
                ? charge.payment_intent
                : (charge.payment_intent as Stripe.PaymentIntent)?.id || '';

            if (!apiBase || !paymentIntentId) break;

            try {
                const lookupRes = await fetch(
                    `${apiBase}/api/bookings?payment_intent_id=${paymentIntentId}`
                );
                if (lookupRes.ok) {
                    const booking = await lookupRes.json();
                    if (booking?.id) {
                        await fetch(`${apiBase}/api/bookings/${booking.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'refunded' }),
                        });
                        console.log(`Booking ${booking.id} marked as refunded`);
                    }
                }
            } catch (e) {
                console.error('Failed to update booking status on refund:', e);
            }
            break;
        }

        case 'payment_intent.canceled': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;

            if (!apiBase) break;

            try {
                const lookupRes = await fetch(
                    `${apiBase}/api/bookings?payment_intent_id=${paymentIntent.id}`
                );
                if (lookupRes.ok) {
                    const booking = await lookupRes.json();
                    if (booking?.id) {
                        await fetch(`${apiBase}/api/bookings/${booking.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'cancelled' }),
                        });
                        console.log(`Booking ${booking.id} marked as cancelled`);
                    }
                }
            } catch (e) {
                console.error('Failed to update booking status on cancel:', e);
            }
            break;
        }

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
};
