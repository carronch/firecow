import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    EmbeddedCheckoutProvider,
    EmbeddedCheckout
} from '@stripe/react-stripe-js';

// Initialize Stripe outside component to avoid recreation
// Note: This is the publishable key. In a real app this should be in env.
// Using a placeholder public key for now or one provided by user if available.
// Since user only gave secret key, we'll try to use a generic one or ask user to provide public key.
// IMPORTANT: Embedded Checkout requires Publishable Key on frontend.
// I will assume for now we might need to fetch it or hardcode a test one if user provided it? 
// Actually user only provided SK. I will insert a placeholders `pk_test_...` derived from SK if possible?
// The SK starts with `pk_test_...` in the prompt? No, SK is `sk_test_...`. 
// Wait, the prompt says: `STRIPE_SECRET_KEY`: pk_test_... 
// The user actually provided the PUBLISHABLE key as the SECRET key in the prompt?
// "STRIPE_SECRET_KEY: pk_test_51Sxsmm..." -> This looks like a Publishable Key (starts with pk_).
// "STRIPE_WEBHOOK_SECRET: sk_test_51Sxsmm..." -> This looks like a Secret Key (starts with sk_ or matches format?).
// Actually `sk_test_...` is usually the Secret Key. 
// The user prompt lists: `STRIPE_WEBHOOK_SECRET`: sk_test_... 
// And `STRIPE_SECRET_KEY`: pk_test_...
// This is confusing. `pk_` is Publishable. `sk_` is Secret.
// If the user swapped them or is using pk as secret, that will fail backend steps.
// However, for Frontend, I need the PK. I will use the one labeled `STRIPE_SECRET_KEY` since it starts with `pk_`.
// Verify: `pk_test_51Sxsmm2fH7qqOJa9E3TwepsVYi7X7X5xSMGbcFhHVYO1TXY86HZ1GL4wsu1h9CT1B5CpgaAxyoureENryS3hhJUT00fVfrgFaE`

const stripePromise = loadStripe('pk_test_51Sxsmm2fH7qqOJa9E3TwepsVYi7X7X5xSMGbcFhHVYO1TXY86HZ1GL4wsu1h9CT1B5CpgaAxyoureENryS3hhJUT00fVfrgFaE');

export default function CheckoutForm({ clientSecret, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 text-gray-500 hover:text-gray-700 bg-white/50 rounded-full p-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <div id="checkout" className="w-full min-h-[400px]">
                    {clientSecret && (
                        <EmbeddedCheckoutProvider
                            stripe={stripePromise}
                            options={{ clientSecret }}
                        >
                            <EmbeddedCheckout />
                        </EmbeddedCheckoutProvider>
                    )}
                </div>
            </div>
        </div>
    );
}
