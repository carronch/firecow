/**
 * Mock Google Ads edge-compatible service
 * The user requested mock data instead of live OAuth2 for now.
 * 
 * In production, this would hit:
 * POST https://googleads.googleapis.com/v15/customers/{customer_id}/googleAds:search
 * using a GAQL query: 
 * SELECT campaign.name, metrics.cost_micros FROM campaign WHERE segments.date DURING LAST_30_DAYS
 */

export class GoogleAdsService {
    constructor(env) {
        this.env = env;
    }

    /**
     * Returns a mock map of { utm_campaign: cost_in_cents }
     */
    async getCampaignSpend() {
        // We return mocked ad spends for common tracked campaigns
        // Normally metrics.cost_micros is divided by 1,000,000 to get dollars.
        // We will return cents to match our Stripe `total_amount` structure.
        return {
            'summer_sale': 45000, // $450.00 spend
            'retargeting_fb': 12000, // $120.00 spend
            'google_search_brand': 35000, // $350.00 spend
            'isla_tortuga_broad': 85000, // $850.00 spend
        };
    }
}
