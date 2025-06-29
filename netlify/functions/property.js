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

  // Generate authentication token
  const timestamp = Math.floor(Date.now() / 1000);
  const crypto = require('crypto');
  const sha1Hash = crypto.createHash('sha1')
                        .update(API_KEY + timestamp)
                        .digest('hex');

  try {
    console.log(`🔄 Fetching property ${propertyId}...`);

    // Try different API endpoints
    const endpoints = [
      {
        url: `https://api.apimo.pro/agencies/${AGENCY_ID}/properties/${propertyId}`,
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      },
      {
        url: `https://webservice.apimo.net/agencies/${AGENCY_ID}/properties/${propertyId}`,
        headers: {
          'X-Apimo-Token': sha1Hash,
          'X-Apimo-Timestamp': timestamp.toString(),
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      },
      {
        url: `https://apimo.net/webservice/api/agencies/${AGENCY_ID}/properties/${propertyId}`,
        headers: {
          'X-Apimo-Token': sha1Hash,
          'X-Apimo-Timestamp': timestamp.toString(),
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    ];

    let lastError = null;

    // Try each endpoint
    for (const endpoint of endpoints) {
      try {
        console.log('📡 Trying endpoint:', endpoint.url);

        const response = await fetch(endpoint.url, {
          method: 'GET',
          headers: endpoint.headers
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.log('Error response:', errorText);
          lastError = `${response.status}: ${errorText}`;
          continue;
        }

        const data = await response.json();
        console.log('✅ Success! Found working endpoint:', endpoint.url);

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
              provider: PROVIDER_ID,
              workingEndpoint: endpoint.url
            }
          })
        };

      } catch (endpointError) {
        console.log('❌ Endpoint failed:', endpointError.message);
        lastError = endpointError.message;
        continue;
      }
    }

    // If we get here, all endpoints failed
    throw new Error(`All endpoints failed. Last error: ${lastError}`);

  } catch (error) {
    console.error('❌ Final error:', error);
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
