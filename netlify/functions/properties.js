const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Log the request for debugging
  console.log('Function invoked:', {
    time: new Date().toISOString(),
    method: event.httpMethod,
    path: event.path
  });

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Your Apimo credentials
  const providerId = '4352';
  const agencyId = '24985';
  const apiKey = '68460111a25a4d1ba2508ead22a2b59e16cfcfcd';
  
  // Generate SHA1 authentication
  const timestamp = Math.floor(Date.now() / 1000);
  const crypto = require('crypto');
  const sha1Hash = crypto.createHash('sha1').update(apiKey + timestamp).digest('hex');
  
  // Primary API endpoint
  const apiUrl = `https://api.apimo.com/api/call?provider=${providerId}&timestamp=${timestamp}&sha1=${sha1Hash}&method=getProperties&type=json&version=2&agency=${agencyId}&limit=50`;

  try {
    console.log('Fetching from Apimo:', apiUrl.substring(0, 100) + '...');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Apimo-Proxy/1.0'
      }
    });

    const responseText = await response.text();
    console.log('Apimo response status:', response.status);

    if (!response.ok) {
      throw new Error(`Apimo API returned ${response.status}: ${responseText.substring(0, 200)}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      throw new Error('Invalid JSON response from Apimo');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: data,
        metadata: {
          timestamp: new Date().toISOString(),
          provider: providerId,
          agency: agencyId
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
          provider: providerId,
          agency: agencyId
        }
      })
    };
  }
};
