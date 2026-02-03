
import type { APIRoute } from 'astro';

export const prerender = false;

// Configuration
const ZOHO_CONFIG = {
    get CLIENT_ID() { return import.meta.env.ZOHO_CLIENT_ID; },
    get CLIENT_SECRET() { return import.meta.env.ZOHO_CLIENT_SECRET; },
    get REFRESH_TOKEN() { return import.meta.env.ZOHO_REFRESH_TOKEN; },
    get PORTAL_NAME() { return import.meta.env.ZOHO_PORTAL_NAME || 'firecowbookings'; },
    API_DOMAIN: 'https://bookings.zoho.com',
    AUTH_URL: 'https://accounts.zoho.com/oauth/v2/token'
};

// Start: Shared Logic (modified from api-tours.js)

async function getAccessToken() {
    if (!ZOHO_CONFIG.CLIENT_ID || !ZOHO_CONFIG.REFRESH_TOKEN) {
        throw new Error('Missing Zoho Credentials');
    }

    const params = new URLSearchParams({
        refresh_token: ZOHO_CONFIG.REFRESH_TOKEN,
        client_id: ZOHO_CONFIG.CLIENT_ID,
        client_secret: ZOHO_CONFIG.CLIENT_SECRET,
        grant_type: 'refresh_token'
    });

    const response = await fetch(ZOHO_CONFIG.AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to get access token: ${errText}`);
    }

    const data = await response.json();
    return data.access_token;
}

async function fetchZohoServices(accessToken: string) {
    const url = `${ZOHO_CONFIG.API_DOMAIN}/api/v1/${ZOHO_CONFIG.PORTAL_NAME}/services`; // Assuming v1 API structure from guide
    // Note: Zoho API endpoints vary slightly by region (com, eu, etc). Assuming .com per guide.

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch services from Zoho');
    }

    return await response.json();
}

function transformService(service: any) {
    return {
        serviceId: service.service_id,
        name: service.service_name,
        description: service.description || service.service_description || '',
        price: service.price || service.cost || 0,
        duration: service.duration || '',
        image: service.image_url || service.photo_url || service.custom_fields?.hero_image || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
        category: service.category || '',
        availability: service.availability || {}
    };
}

// End: Shared Logic

export const GET: APIRoute = async ({ request }) => {
    // CORS Headers
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300'
    };

    try {
        // Check credentials existence to fail fast
        if (!ZOHO_CONFIG.CLIENT_ID) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Configuration Missing',
                message: 'ZOHO_CLIENT_ID not set'
            }), { status: 503, headers });
        }

        const accessToken = await getAccessToken();
        const zohoData = await fetchZohoServices(accessToken);

        // Handles different response structures (wrapper/data keys)
        const services = Array.isArray(zohoData) ? zohoData : (zohoData.response?.returnvalue?.services || zohoData.services || []);

        // Note: Zoho response structure can be tricky (response.returnvalue vs direct).
        // The guide assumed `zohoData.services`. I added a safety check.

        const transformedServices = services.map(transformService);

        return new Response(JSON.stringify({
            success: true,
            tours: transformedServices,
            count: transformedServices.length
        }), { status: 200, headers });

    } catch (error: any) {
        console.error('Zoho API Error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to fetch tours',
            message: error.message
        }), { status: 500, headers });
    }
};
