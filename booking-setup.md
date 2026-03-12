# Booking System Setup

The booking system has been migrated from Zoho Bookings to a custom solution using Stripe and Zoho CRM.

## Architecture

1.  **Tours**: Defined in `apps/isla-tortuga-costa-rica/src/content/tours/*.md`.
2.  **Checkout**: Stripe Checkout via `/api/checkout` endpoint.
3.  **CRM Sync**: Handled by Stripe Webhook at `/api/webhooks/stripe` -> Zoho CRM.

## Configuration

### Environment Variables
Ensure the following variables are set in Cloudflare Pages or `.env`:

- `STRIPE_SECRET_KEY`: Your Stripe Secret Key (`sk_...`).
- `STRIPE_WEBHOOK_SECRET`: Your Stripe Webhook Secret (`whsec_...`).
- `ZOHO_CLIENT_ID`: Zoho OAuth Client ID.
- `ZOHO_CLIENT_SECRET`: Zoho OAuth Client Secret.
- `ZOHO_REFRESH_TOKEN`: Zoho OAuth Refresh Token (Must have `ZohoCRM.modules.leads.CREATE` scope).

### Adding a New Tour
1.  Create a markdown file in `src/content/tours/`.
2.  Add frontmatter:
    ```yaml
    ---
    title: "Tour Name"
    description: "Short description"
    price: 100
    duration: "4 Hours"
    heroImage: "https://..."
    minGuests: 1
    featured: true
    included:
      - "Lunch"
      - "Drinks"
    ---
    ```
3.  Add description details in the body.

### Deployment
Deploy as standard Cloudflare Pages. The `stripe` dependency has been added to `apps/isla-tortuga-costa-rica/package.json`.
