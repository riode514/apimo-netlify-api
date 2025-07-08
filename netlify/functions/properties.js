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
    // Datos de ejemplo limpios para empezar
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

    // Aplicar filtros simples
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
        source: "Clean test data"
      })
    };
    
  } catch (error) {
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
