// netlify/functions/properties.js
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const token = '68460111a25a4d1ba2508ead22a2b59e16cfcfcd';
  const agencyId = '24985';
  const providerId = '4352';
  
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
    
    // Probar diferentes URLs base
    const apiUrls = [
      `https://api.apimo.net/agencies/${agencyId}/properties`,
      `https://api.apimo.pro/agencies/${agencyId}/properties`,
      `https://www.apimo.net/api/agencies/${agencyId}/properties`,
      `https://apimo.net/api/agencies/${agencyId}/properties`
    ];
    
    let lastError = null;
    let apiResponse = null;
    let successfulUrl = null;
    
    for (const apiUrl of apiUrls) {
      try {
        console.log(`Trying URL: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Verv-One-Website/1.0'
          }
        });
        
        console.log(`Response status for ${apiUrl}: ${response.status}`);
        
        if (response.ok) {
          apiResponse = response;
          successfulUrl = apiUrl;
          break;
        } else {
          const errorText = await response.text();
          console.log(`Error response for ${apiUrl}:`, errorText);
          lastError = new Error(`${response.status} ${response.statusText}: ${errorText}`);
        }
        
      } catch (error) {
        console.log(`Network error for ${apiUrl}:`, error.message);
        lastError = error;
      }
    }
    
    if (!apiResponse) {
      throw lastError || new Error('All API endpoints failed');
    }
    
    console.log(`Success with URL: ${successfulUrl}`);
    const apiData = await apiResponse.json();
    console.log('Apimo data received successfully');
    console.log('Response structure:', Object.keys(apiData));
    
    // Transformar datos de Apimo al formato esperado
    let properties = [];
    
    if (Array.isArray(apiData)) {
      properties = apiData;
    } else if (apiData.properties && Array.isArray(apiData.properties)) {
      properties = apiData.properties;
    } else if (apiData.data && Array.isArray(apiData.data)) {
      properties = apiData.data;
    } else if (apiData.results && Array.isArray(apiData.results)) {
      properties = apiData.results;
    } else {
      console.log('Unexpected API response structure:', apiData);
      properties = [];
    }

    // Aplicar filtros si existen
    const { queryStringParameters = {} } = event;
    const { featured, limit } = queryStringParameters;

    let filteredProperties = properties;

    if (featured === 'true' && properties.length > 0) {
      filteredProperties = properties.filter(prop => prop.featured || prop.is_featured);
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
        source: 'Apimo API',
        apiUrl: successfulUrl,
        agencyId: agencyId,
        providerId: providerId,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('Function error:', error.message);
    
    // Fallback data
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
        agencyId: agencyId,
        providerId: providerId,
        timestamp: new Date().toISOString()
      })
    };
  }
};
