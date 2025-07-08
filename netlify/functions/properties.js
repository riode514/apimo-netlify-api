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

  const queryParams = event.queryStringParameters || {};
  const { limit, featured } = queryParams;

  // ✅ URL simple sin parámetros que Apimo podría no soportar
  const apiUrl = `https://api.apimo.pro/agencies/${agencyId}/properties`;

  const credentials = Buffer.from(`${providerId}:${token}`).toString('base64');

  try {
    console.log('🔗 Fetching properties from Apimo...');
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Apimo API failed:', response.status, errorText);
      throw new Error(`Apimo API ${response.status}: ${errorText}`);
    }

    const apiData = await response.json();
    console.log('✅ Apimo API response received, properties count:', apiData.length || 'unknown');
    
    let properties = [];

    if (Array.isArray(apiData)) {
      properties = apiData;
    } else if (apiData.properties) {
      properties = apiData.properties;
    } else if (apiData.data) {
      properties = apiData.data;
    }

    // Filter featured properties if requested
    if (featured === 'true') {
      properties = properties.filter(p => p.featured || p.is_featured === true);
    }

    // Limit result if requested
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
        properties: properties,
        source: "Apimo API",
        filters: {
          featured: featured === 'true',
          limit: limit ? parseInt(limit) : null
        }
      })
    };

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // ✅ Fallback properties para mejor UX
    const fallbackProperties = [
      {
        id: 1,
        title: "Modern Villa in Barcelona",
        price: "€450,000",
        location: "Barcelona, Spain",
        bedrooms: 3,
        bathrooms: 2,
        size: "120m²",
        featured: true
      },
      {
        id: 2,
        title: "Coastal Apartment",
        price: "€320,000",
        location: "Valencia, Spain",
        bedrooms: 2,
        bathrooms: 1,
        size: "85m²",
        featured: false
      },
      {
        id: 3,
        title: "Historic Townhouse",
        price: "€580,000",
        location: "Madrid, Spain",
        bedrooms: 4,
        bathrooms: 3,
        size: "160m²",
        featured: true
      }
    ];

    // Apply same filters to fallback
    let filteredFallback = fallbackProperties;
    
    if (featured === 'true') {
      filteredFallback = fallbackProperties.filter(p => p.featured);
    }
    
    if (limit) {
      const max = parseInt(limit);
      if (!isNaN(max)) {
        filteredFallback = filteredFallback.slice(0, max);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: filteredFallback.length,
        properties: filteredFallback,
        source: "Fallback data",
        error: error.message,
        filters: {
          featured: featured === 'true',
          limit: limit ? parseInt(limit) : null
        }
      })
    };
  }
};
