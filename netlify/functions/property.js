const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
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

  // Your exact Apimo credentials
  const providerId = '4352';
  const agencyId = '24985';
  const apiKey = '68460111a25a4d1ba2508ead22a2b59e16cfcfcd';
  
  // Generate SHA1 authentication
  const timestamp = Math.floor(Date.now() / 1000);
  const crypto = require('crypto');
  const sha1Hash = crypto.createHash('sha1').update(apiKey + timestamp).digest('hex');

  // API endpoints to try for single property
  const apiEndpoints = [
    `https://api.apimo.com/api/call?provider=${providerId}&timestamp=${timestamp}&sha1=${sha1Hash}&method=getProperty&type=json&version=2&agency=${agencyId}&id=${propertyId}`,
    `https://api.apimo.pro/agencies/${agencyId}/properties/${propertyId}?provider=${providerId}`,
    `https://webservice.apimo.net/agencies/${agencyId}/properties/${propertyId}?provider=${providerId}`
  ];

  try {
    let lastError = null;

    for (const apiUrl of apiEndpoints) {
      const authMethods = [
        {
          name: 'Bearer',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Netlify-Apimo-Proxy/1.0'
          }
        },
        {
          name: 'Basic',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${providerId}:${apiKey}`).toString('base64')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Netlify-Apimo-Proxy/1.0'
          }
        },
        {
          name: 'URL-based',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Netlify-Apimo-Proxy/1.0'
          }
        }
      ];

      for (const authMethod of authMethods) {
        try {
          console.log(`🔍 Trying to fetch property ${propertyId} from: ${apiUrl.substring(0, 80)}...`);

          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: authMethod.headers
          });

          const responseText = await response.text();
          console.log(`📦 Response: ${response.status} with ${authMethod.name} auth`);

          if (!response.ok) {
            if (!responseText.includes('Demandez un essai gratuit') && !responseText.includes('<!DOCTYPE html>')) {
              console.log(`🔍 Different error type: ${responseText.substring(0, 200)}`);
            }
            continue;
          }

          let data;
          try {
            data = JSON.parse(responseText);
            console.log('✅ SUCCESS! Property data retrieved');
          } catch (parseError) {
            console.log(`❌ JSON Parse Error with ${authMethod.name} auth:`, parseError.message);
            continue;
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              data: data,
              metadata: {
                propertyId,
                provider: providerId,
                agency: agencyId,
                workingEndpoint: apiUrl,
                workingAuthMethod: authMethod.name,
                timestamp: new Date().toISOString()
              }
            })
          };

        } catch (fetchError) {
          lastError = {
            error: 'Network Error',
            endpoint: apiUrl,
            authMethod: authMethod.name,
            details: fetchError.message
          };
          continue;
        }
      }
    }

    console.error('❌ All API endpoint variations failed for property:', propertyId);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch property details',
        propertyId,
        details: lastError,
        provider: providerId,
        agency: agencyId
      })
    };

  } catch (error) {
    console.error('❌ Server Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Server error while fetching property',
        details: error.message,
        propertyId
      })
    };
  }
};
