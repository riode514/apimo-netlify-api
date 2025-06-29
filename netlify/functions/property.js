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
    // Use the documented endpoint format
    const apiUrl = `https://api.apimo.pro/agencies/${AGENCY_ID}/properties/${propertyId}`;
    
    console.log(`🔄 Fetching property ${propertyId}...`);
    console.log('URL:', apiUrl);
    console.log('Timestamp:', timestamp);
    console.log('SHA1:', sha1Hash);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Apimo-Agency-Id': AGENCY_ID,
        'X-Apimo-Token': API_KEY,
        'X-Apimo-Timestamp': timestamp.toString(),
        'X-Apimo-Hash': sha1Hash
      }
    });

    if (!response.ok) {
      // Try legacy endpoint as fallback
      console.log('Trying legacy endpoint...');
      
      const legacyUrl = `https://api.apimo.com/api/call` +
        `?provider=${PROVIDER_ID}` +
        `&timestamp=${timestamp}` +
        `&sha1=${sha1Hash}` +
        `&method=getProperty` +
        `&type=json` +
        `&version=2` +
        `&agency=${AGENCY_ID}` +
        `&id=${propertyId}`;

      const legacyResponse = await fetch(legacyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!legacyResponse.ok) {
        throw new Error(`Both API versions failed. Legacy API returned ${legacyResponse.status}`);
      }

      const legacyData = await legacyResponse.json();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: legacyData,
          metadata: {
            timestamp: new Date().toISOString(),
            propertyId,
            agency: AGENCY_ID,
            provider: PROVIDER_ID,
            endpoint: 'legacy'
          }
        })
      };
    }

    const data = await response.json();
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
          endpoint: 'v2'
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
