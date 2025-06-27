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
  const apiKey = '68460111a25a4d1ba2508ead22a2b59e16cfcfcd';
  
  // Generate SHA1 authentication (based on Joel Lipman documentation)
  const timestamp = Math.floor(Date.now() / 1000);
  const crypto = require('crypto');
  const sha1Hash = crypto.createHash('sha1').update(apiKey + timestamp).digest('hex');
  
  // Correct Apimo API endpoint and format (from documentation)
  const apiUrl = `https://api.apimo.com/api/call?` + 
    `provider=${providerId}&` +
    `timestamp=${timestamp}&` +
    `sha1=${sha1Hash}&` +
    `method=getProperties&` +
    `type=json&` +
    `version=2&` +
    `limit=50`;

  try {
    console.log('🔗 Calling Apimo API:', apiUrl.replace(sha1Hash, 'xxx...xxx'));
    console.log('🔑 Using SHA1 authentication (not Bearer token)');

    // Make the API call with correct Apimo format
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
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
          endpoint: apiUrl.replace(sha1Hash, 'xxx...xxx'),
          authMethod: 'SHA1 (not Bearer token)'
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
          rawResponse: responseText.substring(0, 1000),
          endpoint: apiUrl.replace(sha1Hash, 'xxx...xxx')
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
          endpoint: apiUrl.replace(sha1Hash, 'xxx...xxx'),
          authMethod: 'SHA1',
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
        note: 'All API endpoints failed - check Apimo documentation for correct URL'
      })
    };
  }
};
