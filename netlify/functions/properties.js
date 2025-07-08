const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const token = '68460111a25a4d1ba2508ead22a2b59e16cfcfcd';
  const agencyId = '24985';
  const providerId = '4352';
  const apiUrl = `https://api.apimo.pro/agencies/${agencyId}/properties`;

  try {
    console.log('🔗 Fetching properties from Apimo...');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': 'Token ' + token,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${responseText}`);
    }

    const apiData = JSON.parse(responseText);
    let properties = [];

    if (Array.isArray(apiData)) {
      properties = apiData;
    } else if (apiData.properties) {
      properties = apiData.properties;
    } else if (apiData.data) {
      properties = apiData.data;
    } else {
      console.warn('⚠️ Unexpected data structure:', Object.keys(apiData));
    }

    // Filters
    const { featured, limit } = event.queryStringParameters || {};

    if (featured === 'true') {
      properties = properties.filter(prop => prop.featured || prop.is_featured);
    }

    if (limit) {
      const n = parseInt(limit);
      if (!isNaN(n)) {
        properties = properties.slice(0, n);
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
        agencyId,
        providerId,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Error fetching properties:', error.message);

    // Fallback dummy data
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
      }
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: fallbackProperties.length,
        properties: fallbackProperties,
        source: "Fallback",
        apiError: error.message,
        agencyId,
        providerId
      })
    };
  }
};
