// netlify/functions/properties.js
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const token = '68460111a25a4d1ba2508ead22a2b59e16cfcfcd';
  const agencyId = '24985';  // Agency ID de Apimo
  const providerId = '4352'; // Provider ID para referencia
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log(`Fetching properties from Apimo API for agency ${agencyId}...`);
    
    // Llamada a la API real de Apimo
    const apiUrl = `https://api.apimo.pro/agencies/${agencyId}/properties`;
    console.log('API URL:', apiUrl);
    
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Apimo API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('API Error Response:', errorText);
      throw new Error(`Apimo API error: ${response.status} ${response.statusText}`);
    }

    const apiData = await response.json();
    console.log('Apimo data received successfully');
    console.log('Raw properties count:', Array.isArray(apiData) ? apiData.length : apiData?.properties?.length || 'Unknown structure');
    
    // Transformar datos de Apimo al formato esperado por el frontend
    let properties = [];
    
    if (Array.isArray(apiData)) {
      properties = apiData;
    } else if (apiData.properties && Array.isArray(apiData.properties)) {
      properties = apiData.properties;
    } else if (apiData.data && Array.isArray(apiData.data)) {
      properties = apiData.data;
    } else {
      console.log('Unexpected API response structure:', Object.keys(apiData));
      properties = [];
    }

    // Aplicar filtros de query parameters si existen
    const { queryStringParameters = {} } = event;
    const { featured, limit } = queryStringParameters;

    let filteredProperties = properties;

    // Filtrar por featured si se solicita
    if (featured === 'true' && properties.length > 0) {
      filteredProperties = properties.filter(prop => prop.featured || prop.is_featured);
    }

    // Limitar resultados si se solicita
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum)) {
        filteredProperties = filteredProperties.slice(0, limitNum);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: filteredProperties.length,
        properties: filteredProperties,
        source: 'Apimo API',
        agencyId: agencyId,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('Function error:', error.message);
    
    // En caso de error, devolver datos de ejemplo como fallback
    console.log('Returning fallback data due to API error');
    
    const fallbackProperties = [
      {
        id: 1,
        title: "Modern Villa in Barcelona",
        price: "€450,000",
        location: "Barcelona, Spain",
        bedrooms: 3,
        bathrooms: 2,
        size: "120m²",
        image: "/assets/images/property1.jpg",
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
        image: "/assets/images/property2.jpg",
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
        image: "/assets/images/property3.jpg",
        featured: true
      }
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: fallbackProperties.length,
        properties: fallbackProperties,
        source: 'Fallback data',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
