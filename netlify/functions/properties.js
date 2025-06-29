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
  const agencyId = '24985';
  const apiKey = '68460111a25a4d1ba2508ead22a2b59e16cfcfcd';
  
  // Current Apimo API endpoint (api.apimo.pro)
  const apiUrl = `https://api.apimo.pro/agencies/${agencyId}/properties`;
  
  // Basic Authentication: provider:token format
  const credentials = Buffer.from(`${providerId}:${apiKey}`).toString('base64');
  
  try {
    console.log(`🔗 Calling Apimo API: ${apiUrl}`);
    console.log(`👤 Using Provider ID: ${providerId}, Agency ID: ${agencyId}`);

    // Make the API call with Basic Authentication
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Apimo-Client/1.0'
      }
    });

    const responseText = await response.text();
    console.log(`📦 Response Status: ${response.status}`);

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} - ${response.statusText}`);
      console.error(`📄 Response Body: ${responseText.substring(0, 500)}`);
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Apimo API Error: ${response.status} - ${response.statusText}`,
          details: responseText.substring(0, 500),
          provider: providerId,
          agency: agencyId,
          endpoint: apiUrl
        })
      };
    }

    // Parse JSON response
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('✅ SUCCESS! Received valid JSON response');
      
      // Log data structure for debugging
      if (data.properties) {
        console.log(`📊 Properties found: ${data.properties.length}`);
      } else if (Array.isArray(data)) {
        console.log(`📊 Array response with ${data.length} items`);
      } else {
        console.log(`📊 Response structure:`, Object.keys(data));
      }
      
    } catch (parseError) {
      console.error(`❌ JSON Parse Error:`, parseError.message);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid JSON response from Apimo API',
          details: parseError.message,
          rawResponse: responseText.substring(0, 500)
        })
      };
    }

    // Success! Return the data
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: data,
        metadata: {
          provider: providerId,
          agency: agencyId,
          endpoint: apiUrl,
          timestamp: new Date().toISOString(),
          propertiesCount: data.properties ? data.properties.length : (Array.isArray(data) ? data.length : 'unknown'),
          totalItems: data.total_items || null
        }
      })
    };

  } catch (error) {
    console.error('❌ Network/Server Error:', error.message);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Network error while calling Apimo API',
        details: error.message,
        provider: providerId,
        agency: agencyId,
        endpoint: apiUrl
      })
    };
  }
};
