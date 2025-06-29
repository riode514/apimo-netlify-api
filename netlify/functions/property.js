const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Get property ID from path
  const propertyId = event.path.split('/').pop();
  if (!propertyId || propertyId === 'property') {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Property ID is required' })
    };
  }

  // Apimo credentials
  const AGENCY_ID = '24985';
  const PROVIDER_ID = '4352';
  const API_KEY = '68460111a25a4d1ba2508ead22a2b59e16cfcfcd';
  
  // API configuration
  const API_BASE_URL = 'https://api.apimo.pro/v2';
  const PROPERTY_ENDPOINT = `/agencies/${AGENCY_ID}/properties/${propertyId}`;

  try {
    console.log(`🔄 Fetching property ${propertyId}...`);

    const apiResponse = await fetch(`${API_BASE_URL}${PROPERTY_ENDPOINT}`, {
      method: 'GET',
      headers: {
        'X-Apimo-Agency-Id': AGENCY_ID,
        'X-Apimo-Provider-Id': PROVIDER_ID,
        'X-Apimo-Token': API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`Apimo API returned ${apiResponse.status}: ${errorText}`);
    }

    const data = await apiResponse.json();
    console.log('✅ Successfully fetched property details');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: data,
        metadata: {
          timestamp: new Date().toISOString(),
          propertyId,
          agency: AGENCY_ID,
          provider: PROVIDER_ID
        }
      })
    };

  } catch (error) {
    console.error('❌ Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        metadata: {
          timestamp: new Date().toISOString(),
          propertyId,
          agency: AGENCY_ID,
          provider: PROVIDER_ID
        }
      })
    };
  }
};
