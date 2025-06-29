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

    // Use the webservice endpoint from documentation
    const apiUrl = `https://webservice.apimo.net/agencies/${AGENCY_ID}/properties/${propertyId}`;
    
    console.log('URL:', apiUrl);
    console.log('Auth:', {
      timestamp,
      hash: sha1Hash.substring(0, 10) + '...'
    });

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Timestamp': timestamp.toString(),
        'X-Token': sha1Hash,
        'X-Provider-Id': PROVIDER_ID,
        'X-Agency-Id': AGENCY_ID
      }
    });

    console.log('Status:', response.status);
    
    const responseText = await response.text();
    console.log('Response:', responseText.substring(0, 200));

    if (!response.ok) {
      throw new Error(`Apimo API returned ${response.status}: ${responseText}`);
    }

    const data = JSON.parse(responseText);
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
    console.error('Error:', error);
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
