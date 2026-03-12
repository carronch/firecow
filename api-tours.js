/**
 * Backend API Endpoint for Zoho Bookings Integration
 * 
 * This file should be deployed as a serverless function or API endpoint
 * (e.g., Cloudflare Workers, Vercel Functions, or your backend server)
 */

// Zoho Bookings API Configuration
const ZOHO_CONFIG = {
  CLIENT_ID: process.env.ZOHO_CLIENT_ID,
  CLIENT_SECRET: process.env.ZOHO_CLIENT_SECRET,
  REFRESH_TOKEN: process.env.ZOHO_REFRESH_TOKEN,
  PORTAL_NAME: process.env.ZOHO_PORTAL_NAME || 'firecowbookings',
  API_DOMAIN: 'https://bookings.zoho.com',
  AUTH_URL: 'https://accounts.zoho.com/oauth/v2/token'
};

/**
 * Get Access Token from Zoho using Refresh Token
 */
async function getAccessToken() {
  const params = new URLSearchParams({
    refresh_token: ZOHO_CONFIG.REFRESH_TOKEN,
    client_id: ZOHO_CONFIG.CLIENT_ID,
    client_secret: ZOHO_CONFIG.CLIENT_SECRET,
    grant_type: 'refresh_token'
  });

  const response = await fetch(ZOHO_CONFIG.AUTH_URL, {
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
async function fetchZohoServices(accessToken) {
  const url = `${ZOHO_CONFIG.API_DOMAIN}/api/v1/${ZOHO_CONFIG.PORTAL_NAME}/services`;
  
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
    serviceId: service.service_id,
    name: service.service_name,
    description: service.description || service.service_description || '',
    price: service.price || service.cost || 0,
    duration: service.duration || '',
    image: service.image_url || service.photo_url || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    category: service.category || '',
    availability: service.availability || {}
  };
}

/**
 * Main API Handler
 * 
 * For Cloudflare Workers:
 * export default {
 *   async fetch(request, env, ctx) {
 *     return handleRequest(request, env);
 *   }
 * }
 * 
 * For Express/Node:
 * app.get('/api/tours', handleRequest);
 * 
 * For Vercel Functions:
 * module.exports = handleRequest;
 */
async function handleRequest(request, env) {
  // Handle CORS
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
    // Get access token
    const accessToken = await getAccessToken();
    
    // Fetch services from Zoho
    const zohoData = await fetchZohoServices(accessToken);
    
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

// Export for different platforms
module.exports = handleRequest;
