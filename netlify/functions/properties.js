// netlify/functions/properties.js
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
    // Sample properties data - replace with your actual data source
    const properties = [
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

    // Handle query parameters for filtering
    const { queryStringParameters = {} } = event;
    const { featured, limit } = queryStringParameters;

    let filteredProperties = properties;

    // Filter by featured if requested
    if (featured === 'true') {
      filteredProperties = properties.filter(prop => prop.featured);
    }

    // Limit results if requested
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
        properties: filteredProperties
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch properties',
        details: error.message
      })
    };
  }
};
