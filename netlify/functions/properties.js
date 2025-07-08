// netlify/functions/properties.js
// Fixed to use the working API endpoint format

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

  try {
    // Use the WORKING API endpoint format (same as the external one that works)
    const apiUrl = 'https://resplendent-brigadeiros-48cf1c.netlify.app/.netlify/functions/properties';
    const queryParams = new URLSearchParams({
      provider: '4352',
      agency: '24985',
      token: '68460111a25a4d1ba2508ead22a2b59e16cfcfcd',
      cache_bust: Date.now().toString()
    });

    console.log(`🔗 Calling external Apimo endpoint: ${apiUrl}?${queryParams}`);

    const response = await fetch(`${apiUrl}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'VERV-ONE-Website/1.0'
      },
      timeout: 30000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Successfully fetched properties');

    // Return the data in the same format
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: data.data || data,
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'Apimo API via Netlify Proxy',
          propertiesCount: (data.data && Array.isArray(data.data)) ? data.data.length : 0
        }
      })
    };

  } catch (error) {
    console.error('❌ Error fetching properties:', error.message);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: `Failed to fetch properties: ${error.message}`,
        timestamp: new Date().toISOString()
      })
    };
  }
};
