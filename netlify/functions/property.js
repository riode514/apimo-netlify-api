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

    // Try v2 API first
    const apiUrl = `https://api.apimo.pro/v2/agencies/${AGENCY_ID}/properties/${propertyId}`;
    console.log('📡 Trying endpoint:', apiUrl);

    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-Apimo-Token': sha1Hash,
        'X-Apimo-Timestamp': timestamp.toString(),
        'X-Apimo-Agency-Id': AGENCY_ID,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!apiResponse.ok) {
      // If v2 fails, try legacy API
      console.log('⚠️ V2 API failed, trying legacy endpoint...');
      
      const legacyUrl = `https://api.apimo.com/api/call?` + 
        `provider=${PROVIDER_ID}&` +
        `timestamp=${timestamp}&` +
        `sha1=${sha1Hash}&` +
        `method=getProperty&` +
        `type=json&` +
        `version=2&` +
        `agency=${AGENCY_ID}&` +
        `id=${propertyId}`;

      console.log('📡 Trying legacy endpoint:', legacyUrl);

      const legacyResponse = await fetch(legacyUrl);
      
      if (!legacyResponse.ok) {
        const errorText = await legacyResponse.text();
        throw new Error(`Both API versions failed. Legacy API returned ${legacyResponse.status}: ${errorText}`);
      }

      const data = await legacyResponse.json();
      console.log('✅ Successfully fetched property from legacy API');

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
            apiVersion: 'legacy'
          }
        })
      };
    }

    const data = await apiResponse.json();
    console.log('✅ Successfully fetched property from V2 API');

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
          apiVersion: 'v2'
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
