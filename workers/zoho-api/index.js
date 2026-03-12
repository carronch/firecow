/**
 * Cloudflare Worker for Zoho Bookings API Integration
 * Fetches tours/services from Zoho Bookings and returns them in a standardized format
 */

export default {
    async fetch(request, env, ctx) {
        return handleRequest(request, env);
    }
};

/**
 * Get Access Token from Zoho using Refresh Token
 */
async function getAccessToken(env) {
    const params = new URLSearchParams({
        refresh_token: env.ZOHO_REFRESH_TOKEN,
        client_id: env.ZOHO_CLIENT_ID,
        client_secret: env.ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token'
    });

    const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
    });

    if (!response.ok) {
        throw new Error('Failed to get access token');
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Fetch Services (Tours) from Zoho Bookings
 */
async function fetchZohoServices(accessToken, env) {
    const portalName = env.ZOHO_PORTAL_NAME || 'firecowbookings';
    const url = `https://bookings.zoho.com/api/v1/${portalName}/services`;

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

    const data = await response.json();
    return data;
}

/**
 * Transform Zoho service data to our format
 */
function transformService(service) {
    return {
        serviceId: service.service_id || service.id,
        name: service.service_name || service.name,
        description: service.description || service.service_description || '',
        price: service.price || service.cost || 0,
        duration: service.duration || service.service_duration || '',
        image: service.image_url || service.photo_url || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
        category: service.category || service.service_category || 'Tour',
        availability: service.availability || {}
    };
}

/**
 * Main Request Handler
 */
async function handleRequest(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }

    try {
        // Check if credentials are configured
        if (!env.ZOHO_CLIENT_ID || !env.ZOHO_CLIENT_SECRET || !env.ZOHO_REFRESH_TOKEN) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Zoho API not configured',
                message: 'Environment variables not set'
            }), {
                status: 503,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // Get access token
        const accessToken = await getAccessToken(env);

        // Fetch services from Zoho
        const zohoData = await fetchZohoServices(accessToken, env);

        // Transform the data
        const services = zohoData.services || zohoData.data || [];
        const transformedServices = services.map(transformService);

        // Return response
        return new Response(JSON.stringify({
            success: true,
            tours: transformedServices,
            count: transformedServices.length
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
            }
        });

    } catch (error) {
        console.error('API Error:', error);

        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to fetch tours',
            message: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}
