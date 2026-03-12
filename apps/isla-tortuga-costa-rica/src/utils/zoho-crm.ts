// Helper to get config
function getConfig(env: any) {
    return {
        CLIENT_ID: env?.ZOHO_CLIENT_ID || import.meta.env.ZOHO_CLIENT_ID,
        CLIENT_SECRET: env?.ZOHO_CLIENT_SECRET || import.meta.env.ZOHO_CLIENT_SECRET,
        REFRESH_TOKEN: env?.ZOHO_REFRESH_TOKEN || import.meta.env.ZOHO_REFRESH_TOKEN, // Needs CRM scope
        AUTH_URL: 'https://accounts.zoho.com/oauth/v2/token',
        API_DOMAIN: 'https://www.zohoapis.com/crm/v2',
    };
}

async function getAccessToken(config: any) {
    if (!config.CLIENT_ID || !config.REFRESH_TOKEN) {
        throw new Error('Missing Zoho Credentials');
    }

    const params = new URLSearchParams({
        refresh_token: config.REFRESH_TOKEN,
        client_id: config.CLIENT_ID,
        client_secret: config.CLIENT_SECRET,
        grant_type: 'refresh_token'
    });

    const response = await fetch(config.AUTH_URL, {
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

export async function createCRMLead(env: any, leadData: {
    firstName?: string;
    lastName: string;
    email: string;
    phone?: string;
    description?: string;
    tourDate?: string;
    amount?: number;
}) {
    const config = getConfig(env);
    const accessToken = await getAccessToken(config);

    const record = {
        Last_Name: leadData.lastName || 'Unknown',
        First_Name: leadData.firstName || '',
        Email: leadData.email,
        Phone: leadData.phone,
        Description: leadData.description || '',
        Lead_Source: 'Website Booking',
        // Example custom fields (mapping depends on CRM setup)
        // If these don't exist, they will be ignored or cause error depending on CRM strictness
        // 'Tour_Date': leadData.tourDate, 
    };

    const response = await fetch(`${config.API_DOMAIN}/Leads`, {
        method: 'POST',
        headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: [record] })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Zoho CRM Error:', errorText);
        throw new Error(`Failed to create Lead in Zoho CRM: ${response.status}`);
    }

    return await response.json();
}
