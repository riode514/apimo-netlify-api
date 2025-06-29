const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Apimo credentials
  const AGENCY_ID = '24985';
  const PROVIDER_ID = '4352';
  const API_KEY = '68460111a25a4d1ba2508ead22a2b59e16cfcfcd';

  // Based on Apimo documentation
  const API_BASE_URL = 'https://api.apimo.pro/v2';
  const PROPERTIES_ENDPOINT = `/agencies/${AGENCY_ID}/properties`;

  try {
    console.log('🔄 Fetching properties from Apimo...');

    // Make the API request
    const apiResponse = await fetch(`${API_BASE_URL}${PROPERTIES_ENDPOINT}`, {
      method: 'GET',
      headers: {
        'X-Apimo-Agency-Id': AGENCY_ID,
        'X-Apimo-Provider-Id': PROVIDER_ID,
        'X-Apimo-Token': API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log('📥 Apimo response status:', apiResponse.status);

    // Handle non-200 responses
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('❌ Apimo API error:', errorText);
      
      throw new Error(`Apimo API returned ${apiResponse.status}: ${errorText}`);
    }

    // Parse response
    const data = await apiResponse.json();
    console.log('✅ Successfully fetched properties');

    // Return successful response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: data,
        metadata: {
          timestamp: new Date().toISOString(),
          agency: AGENCY_ID,
          provider: PROVIDER_ID,
          count: Array.isArray(data) ? data.length : 'unknown'
        }
      })
    };

  } catch (error) {
    console.error('❌ Error:', error);

    // Return error response
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        metadata: {
          timestamp: new Date().toISOString(),
          agency: AGENCY_ID,
          provider: PROVIDER_ID
        }
      })
    };
  }
};
