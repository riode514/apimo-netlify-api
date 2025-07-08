// netlify/functions/properties.js
// Working properties function that calls the external API

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
    console.log('🔄 Properties function called');

    // Use the WORKING external API endpoint (same as your original)
    const apiUrl = 'https://resplendent-brigadeiros-48cf1c.netlify.app/.netlify/functions/properties';
    const queryParams = new URLSearchParams({
      provider: '4352',
      agency: '24985',
      token: '68460111a25a4d1ba2508ead22a2b59e16cfcfcd',
      cache_bust: Date.now().toString()
    });

    const fullUrl = `${apiUrl}?${queryParams}`;
    console.log('📡 Calling external API:', fullUrl);

    // Make the request with proper error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'VERV-ONE-Website/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('📊 API Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ API Success - Data structure:', {
      success: data.success,
      hasData: !!data.data,
      dataType: typeof data.data,
      isArray: Array.isArray(data.data),
      propertiesCount: data.data ? (Array.isArray(data.data) ? data.data.length : 'Not array') : 0
    });

    // Return the data in the expected format
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: data.data || data,
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'Apimo API via External Proxy',
          propertiesCount: data.data && Array.isArray(data.data) ? data.data.length : 0,
          functionStatus: 'working'
        }
      })
    };

  } catch (error) {
    console.error('❌ Function Error:', error.message);
    
    // Return detailed error information
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: `Failed to fetch properties: ${error.message}`,
        details: {
          timestamp: new Date().toISOString(),
          errorType: error.name,
          functionPath: '/.netlify/functions/properties'
        }
      })
    };
  }
};
