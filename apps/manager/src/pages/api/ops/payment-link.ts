import type { APIRoute } from 'astro';
import { createPaymentLink } from '../../../lib/stripe';
import { createLead } from '../../../lib/zoho';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { amount, description, customerName, customerEmail, customerPhone, tourDate } = body;

        if (!amount || !description) {
            return new Response(JSON.stringify({ error: 'Amount and Description required' }), { status: 400 });
        }

        // 1. Create Stripe Link
        const paymentUrl = await createPaymentLink(amount, 'usd', description);

        // 2. Create Zoho Lead (Pending)
        const leadData = {
            Last_Name: customerName || 'Unknown',
            Email: customerEmail,
            Phone: customerPhone,
            Description: `Manual Booking: ${description} - ${paymentUrl}`,
            Lead_Status: 'Pending Payment',
            Tour_Date: tourDate, // Ensure format YYYY-MM-DD
            Amount: amount,
            Tour_Name: description
        };

        try {
            await createLead(leadData);
        } catch (zohoError) {
            console.error('Failed to create Zoho Lead, but Payment Link created:', zohoError);
            // Non-blocking? Or should we return error? Best to return link but warn.
        }

        return new Response(JSON.stringify({ url: paymentUrl }), { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: message }), { status: 500 });
    }
}
