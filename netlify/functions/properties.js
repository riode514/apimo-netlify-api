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

  // Your exact Apimo credentials from support
  const providerId = '4352';
  const agencyId = '24985';  // From Apimo support
  const token = '68460111a25a4d1ba2508ead22a2b59e16cfcfcd';
  
  // Try multiple endpoint variations based on common API patterns
  const apiEndpoints = [
    // Official format from support
    `https://apimo.net/webservice/api/agencies/${agencyId}/properties?provider=${providerId}`,
    // Without /api/ prefix
    `https://apimo.net/webservice/agencies/${agencyId}/properties?provider=${providerId}`,
    // Different webservice path
    `https://apimo.net/api/webservice/agencies/${agencyId}/properties?provider=${providerId}`,
    // Direct agencies endpoint
    `https://apimo.net/agencies/${agencyId}/properties?provider=${providerId}`,
    // With different API version paths
    `https://apimo.net/webservice/v1/agencies/${agencyId}/properties?provider=${providerId}`,
    `https://apimo.net/api/v1/agencies/${agencyId}/properties?provider=${providerId}`
  ];

  try {
    let lastError = null;
    
    // Try each endpoint variation until one works
    for (const apiUrl of apiEndpoints) {
      try {
        console.log('🔗 Trying endpoint:', apiUrl);

        // Make the API call with Bearer token
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
          console.log(`❌ HTTP Error ${response.status} for ${apiUrl}`);
          // Log first 200 chars to see what kind of error
          console.log(`Response preview: ${responseText.substring(0, 200)}`);
          lastError = {
            status: response.status,
            statusText: response.statusText,
            endpoint: apiUrl,
            response: responseText.substring(0, 500)
          };
          continue; // Try next endpoint
        }

        // Try to parse as JSON
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('✅ Successfully parsed JSON response from:', apiUrl);
        } catch (parseError) {
          console.log(`❌ JSON Parse Error for ${apiUrl}:`, parseError);
          lastError = {
            status: response.status,
            error: 'JSON Parse Error',
            endpoint: apiUrl,
            parseError: parseError.message,
            response: responseText.substring(0, 500)
          };
          continue; // Try next endpoint
        }

        // Success! Return the data
        console.log(`✅ Success with endpoint: ${apiUrl}`);
        console.log(`📊 Data structure:`, typeof data, Array.isArray(data) ? `Array[${data.length}]` : Object.keys(data));
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: data,
            metadata: {
              provider: providerId,
              agency: agencyId,
              workingEndpoint: apiUrl,
              authMethod: 'Bearer token',
              timestamp: new Date().toISOString(),
              propertiesCount: Array.isArray(data) ? data.length : (data.properties ? data.properties.length : 'unknown')
            }
          })
        };

      } catch (fetchError) {
        console.log(`🌐 Network Error for ${apiUrl}:`, fetchError.message);
        lastError = {
          error: 'Network Error',
          endpoint: apiUrl,
          details: fetchError.message
        };
        continue; // Try next endpoint
      }
    }

    // If we get here, all endpoints failed
    console.error('❌ All API endpoint variations failed');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'All Apimo API endpoint variations failed',
        details: lastError ? JSON.stringify(lastError, null, 2) : 'No endpoints worked',
        triedEndpoints: apiEndpoints,
        provider: providerId,
        agency: agencyId,
        note: 'Tried multiple variations of the official endpoint format'
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
        agency: agencyId,
        endpoint: apiUrl,
        note: 'Using official Apimo support format'
      })
    };
  }
};
