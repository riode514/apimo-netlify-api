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
  
  // Correct Apimo API endpoint
  const apiUrl = `https://api.apimo.net/api/v1/property?provider=${providerId}`;

  try {
    console.log('🔗 Calling Apimo API:', apiUrl);
    console.log('🔑 Using Bearer token authentication');

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
    console.log(`📦 Response status: ${response.status}`);
    console.log(`📄 Response length: ${responseText.length}`);
    console.log(`📄 Response preview: ${responseText.substring(0, 300)}`);

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Apimo API returned ${response.status}: ${response.statusText}`,
          details: responseText.substring(0, 500),
          apiUrl: apiUrl
        })
      };
    }

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('✅ Successfully parsed JSON response');
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid JSON response from Apimo API',
          details: parseError.message,
          rawResponse: responseText.substring(0, 1000)
        })
      };
    }

    // Return successful response
    console.log(`✅ Success: Returning data`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: data,
        metadata: {
          provider: providerId,
          endpoint: apiUrl,
          timestamp: new Date().toISOString(),
          propertiesCount: Array.isArray(data) ? data.length : (data.properties ? data.properties.length : 'unknown')
        }
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
        endpoint: apiUrl
      })
    };
  }
};
