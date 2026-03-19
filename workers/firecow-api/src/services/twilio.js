/**
 * Twilio Service
 * Handles provisioning local numbers and sending WhatsApp messages.
 */

export class TwilioService {
  constructor(env) {
    this.accountSid = env.TWILIO_ACCOUNT_SID;
    this.authToken = env.TWILIO_AUTH_TOKEN;
    this.authHeader = 'Basic ' + btoa(`${this.accountSid}:${this.authToken}`);
    this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}`;
  }

  /**
   * Search for an available local number in a specific country
   * @param {string} countryCode - ISO Country code, e.g. 'US', 'CR'
   * @returns {Promise<string>} The first available phone number
   */
  async searchAvailableNumber(countryCode) {
    // Note: Twilio limits 'Local' searching depending on the country. Some use Mobile.
    const url = `${this.baseUrl}/AvailablePhoneNumbers/${countryCode}/Local.json?SmsEnabled=true&VoiceEnabled=true`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': this.authHeader }
    });
    
    if (!response.ok) {
        // Fallback to Mobile numbers if Local isn't available for this country
        const mobileUrl = `${this.baseUrl}/AvailablePhoneNumbers/${countryCode}/Mobile.json?SmsEnabled=true&VoiceEnabled=true`;
        const mobileResponse = await fetch(mobileUrl, {
            method: 'GET',
            headers: { 'Authorization': this.authHeader }
        });

        if (!mobileResponse.ok) {
            const err = await mobileResponse.text();
            throw new Error(`Failed to search Twilio numbers in ${countryCode}: ${err}`);
        }
        
        const mobileData = await mobileResponse.json();
        if (!mobileData.available_phone_numbers || mobileData.available_phone_numbers.length === 0) {
            throw new Error(`No available numbers found in ${countryCode}`);
        }
        return mobileData.available_phone_numbers[0].phone_number;
    }

    const data = await response.json();
    if (!data.available_phone_numbers || data.available_phone_numbers.length === 0) {
        const mobileUrl = `${this.baseUrl}/AvailablePhoneNumbers/${countryCode}/Mobile.json?SmsEnabled=true&VoiceEnabled=true`;
        const mobileResponse = await fetch(mobileUrl, { method: 'GET', headers: { 'Authorization': this.authHeader }});
        const mobileData = await mobileResponse.json();
        if (!mobileData.available_phone_numbers || mobileData.available_phone_numbers.length === 0) {
            throw new Error(`No available numbers found in ${countryCode}`);
        }
        return mobileData.available_phone_numbers[0].phone_number;
    }

    return data.available_phone_numbers[0].phone_number;
  }

  /**
   * Purchase a specific phone number
   * @param {string} phoneNumber - The phone number to purchase
   * @returns {Promise<object>} The purchased number resource
   */
  async purchaseNumber(phoneNumber) {
    const url = `${this.baseUrl}/IncomingPhoneNumbers.json`;
    
    const params = new URLSearchParams();
    params.append('PhoneNumber', phoneNumber);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Authorization': this.authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Failed to purchase Twilio number: ${err}`);
    }

    return await response.json();
  }
}
