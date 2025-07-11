const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const providerId = '4352';
  const token = '68460111a25a4d1ba2508ead22a2b59e16cfcfcd';
  const agencyId = '24985';
  const credentials = Buffer.from(`${providerId}:${token}`).toString('base64');

  const queryParams = event.queryStringParameters || {};
  const { limit, featured, location, type, price_min, price_max } = queryParams;

  // Construir la URL con filtros
  let apiUrl = `https://api.apimo.pro/agencies/${agencyId}/properties`;
  const filters = new URLSearchParams();

  if (location) filters.append('city', location);
  if (type) filters.append('type', type);
  if (price_min) filters.append('price_min', price_min);
  if (price_max) filters.append('price_max', price_max);

  if ([...filters].length > 0) {
    apiUrl += `?${filters.toString()}`;
  }

  try {
    console.log('🔗 Fetching filtered properties from Apimo...');
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Apimo API ${response.status}: ${errorText}`);
    }

    const apiData = await response.json();
    let properties = [];

    if (Array.isArray(apiData)) {
      properties = apiData;
    } else if (apiData.properties) {
      properties = apiData.properties;
    } else if (apiData.data) {
      properties = apiData.data;
    }

    // Extra filter by 'featured' if requested
    if (featured === 'true') {
      properties = properties.filter(p => p.featured || p.is_featured === true);
    }

    // Limit results
    if (limit) {
      const max = parseInt(limit);
      if (!isNaN(max)) {
        properties = properties.slice(0, max);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: properties.length,
        properties,
        source: "Apimo API",
        filters: {
          featured: featured === 'true',
          limit: limit ? parseInt(limit) : null,
          location,
          type,
          price_min,
          price_max
        }
      })
    };

  } catch (error) {
    console.error('❌ Error:', error.message);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
