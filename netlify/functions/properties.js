// Save as: netlify/functions/properties.js

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Your exact Apimo credentials
  const providerId = '4352';
  const token = '68460111a25a4d1ba2508ead22a2b59e16cfcfcd';
  
  // Try multiple possible Apimo API endpoints
  const apiEndpoints = [
    `https://apimo.net/webservice/api/v1/property?provider=${providerId}`,
    `https://webservice.apimo.net/api/v1/property?provider=${providerId}`,
    `https://api.apimo.pro/v1/property?provider=${providerId}`,
    `https://apimo.net/api/v1/property?provider=${providerId}`
  ];

  try {
    let lastError = null;
    
    // Try each endpoint until one works
    for (const apiUrl of apiEndpoints) {
      try {
        console.log('🔗 Trying endpoint:', apiUrl);

        // Make the API call to Apimo
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Netlify-Apimo-Proxy/1.0'
          }
        });

        const responseText = await response.text();
        console.log(`📦 Response status: ${response.status} for ${apiUrl}`);
        console.log(`📄 Response length: ${responseText.length}`);

        if (!response.ok) {
          console.log(`❌ HTTP Error ${response.status} for ${apiUrl}: ${responseText.substring(0, 200)}`);
          lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          continue; // Try next endpoint
        }

        // Try to parse as JSON
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('✅ Successfully parsed JSON response from:', apiUrl);
        } catch (parseError) {
          console.log(`❌ JSON Parse Error for ${apiUrl}:`, parseError);
          lastError = new Error(`Invalid JSON response: ${parseError.message}`);
          continue; // Try next endpoint
        }

        // Success! Return the data
        console.log(`✅ Success with endpoint: ${apiUrl}`);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: data,
            metadata: {
              provider: providerId,
              workingEndpoint: apiUrl,
              timestamp: new Date().toISOString(),
              propertiesCount: Array.isArray(data) ? data.length : (data.properties ? data.properties.length : 'unknown')
            }
          })
        };

      } catch (fetchError) {
        console.log(`🌐 Network Error for ${apiUrl}:`, fetchError.message);
        lastError = fetchError;
        continue; // Try next endpoint
      }
    }

    // If we get here, all endpoints failed
    console.error('❌ All API endpoints failed');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'All Apimo API endpoints failed',
        details: lastError ? lastError.message : 'No endpoints worked',
        triedEndpoints: apiEndpoints,
        provider: providerId
      })
    };

  } catch (error) {
    console.error('❌ Server Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Server error while calling Apimo API',
        details: error.message,
        provider: providerId,
        note: 'All API endpoints failed - check Apimo documentation for correct URL'
      })
    };
  }
};
