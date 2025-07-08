// netlify/functions/properties.js
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

  try {
    // Intentar obtener datos reales de Apimo
    const token = '68460111a25a4d1ba2508ead22a2b59e16cfcfcd';
    const agencyId = '24985';
    const apiUrl = `https://api.apimo.pro/agencies/${agencyId}/properties`;
    
    console.log('Trying Apimo API...');
    
    // El error dice "Please provide the token" - probemos diferentes formatos
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,  // Formato "Token" en lugar de "Bearer"
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const apiData = await response.json();
      console.log('Success with Apimo API!');
      
      // Procesar datos de Apimo
      let properties = [];
      
      if (Array.isArray(apiData)) {
        properties = apiData;
      } else if (apiData.properties) {
        properties = apiData.properties;
      } else if (apiData.data) {
        properties = apiData.data;
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          count: properties.length,
          properties: properties,
          source: "Apimo API"
        })
      };
    } else {
      const errorText = await response.text();
      console.log('Apimo API failed:', response.status, errorText);
      throw new Error(`Apimo API: ${response.status} - ${errorText}`);
    }
    
  } catch (error) {
    console.log('Falling back to test data due to:', error.message);
    
    // Datos de fallback limpios
    const properties = [
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

    // Aplicar filtros
    const { queryStringParameters = {} } = event;
    const { featured, limit } = queryStringParameters;

    let filteredProperties = properties;

    if (featured === 'true') {
      filteredProperties = properties.filter(prop => prop.featured);
    }

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
        source: "Fallback data",
        apiError: error.message
      })
    };
  }
};
