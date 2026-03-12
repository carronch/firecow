import axios from 'axios';
import dotenv from 'dotenv';
import path from 'node:path';
import { MONOREPO_ROOT } from './file-system';

// Load environment variables from apps/template/.env (shared keys)
dotenv.config({ path: path.join(MONOREPO_ROOT, 'apps', 'template', '.env') });

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;

let accessToken: string | null = null;

async function refreshZohoToken() {
    try {
        const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
            params: {
                refresh_token: ZOHO_REFRESH_TOKEN,
                client_id: ZOHO_CLIENT_ID,
                client_secret: ZOHO_CLIENT_SECRET,
                grant_type: 'refresh_token'
            }
        });

        if (response.data.access_token) {
            accessToken = response.data.access_token;
            return accessToken;
        } else {
            throw new Error('No access token in response: ' + JSON.stringify(response.data));
        }
    } catch (error) {
        console.error('Error refreshing Zoho token:', error);
        throw error;
    }
}

async function getZohoClient() {
    if (!accessToken) {
        await refreshZohoToken();
    }
    return axios.create({
        baseURL: 'https://www.zohoapis.com/crm/v2',
        headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`
        }
    });
}

export async function getLeads() {
    const client = await getZohoClient();
    try {
        // Fetch leads, sorted by created time descending
        const response = await client.get('/Leads', {
            params: {
                sort_order: 'desc',
                sort_by: 'Created_Time',
                fields: 'id,First_Name,Last_Name,Email,Phone,Description,Lead_Status,Created_Time,Tour_Date,Tour_Name,Amount' // Adjust fields based on actual CRM setup
            }
        });
        return response.data.data;
    } catch (error) {
        // If 401, retry once
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            await refreshZohoToken();
            const retryClient = await getZohoClient();
            const retryResponse = await retryClient.get('/Leads');
            return retryResponse.data.data;
        }
        throw error;
    }
}

export async function updateLeadStatus(id: string, status: string) {
    const client = await getZohoClient();
    const response = await client.put('/Leads', {
        data: [
            {
                id: id,
                Lead_Status: status
            }
        ]
    });
    return response.data;
}

export async function createLead(leadData: any) {
    const client = await getZohoClient();
    const response = await client.post('/Leads', {
        data: [leadData]
    });
    return response.data;
}
