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
    
    const apiUrl = `https://api.apimo.pro/agencies/${agencyId}/properties`;
    console.log('API URL:', apiUrl);
    console.log('Token (first 10 chars):', token.substring(0, 10) + '...');
    
    // Diferentes formatos de headers para probar
    const headerOptions = [
      // Opción 1: Bearer token estándar
      {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      // Opción 2: Token directo
      {
        'Authorization': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      // Opción 3: Con User-Agent
      {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Verv-One-Website/1.0'
      },
      // Opción 4: Basic auth format (si usa formato diferente)
      {
        'Authorization': `Basic ${Buffer.from(token + ':').toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    ];
    
    let lastError = null;
    let apiResponse = null;
    let successfulHeaders = null;
    
    for (let i = 0; i < headerOptions.length; i++) {
      const requestHeaders = headerOptions[i];
      console.log(`Trying header option ${i + 1}:`, Object.keys(requestHeaders));
      
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: requestHeaders
        });
        
        console.log(`Response status for option ${i + 1}: ${response.status}`);
        console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          apiResponse = response;
          successfulHeaders = requestHeaders;
          console.log(`Success with header option ${i + 1}!`);
          break;
        } else {
          const errorText = await response.text();
          console.log(`Error response for option ${i + 1}:`, errorText);
          lastError = new Error(`Option ${i + 1}: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
      } catch (error) {
        console.log(`Network error for option ${i + 1}:`, error.message);
        lastError = error;
      }
    }
    
    if (!apiResponse) {
      throw lastError || new Error('All authentication methods failed');
    }
    
    const apiData = await apiResponse.json();
    console.log('Apimo data received successfully');
    console.log('Response structure:', Object.keys(apiData));
    console.log('Data sample:', JSON.stringify(apiData).substring(0, 200) + '...');
    
    // Transformar datos
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
      console.log('Unknown structure, using raw data');
      properties = [apiData]; // En caso de que sea un solo objeto
    }

    // Aplicar filtros
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
        apiUrl: apiUrl,
        authMethod: successfulHeaders ? Object.keys(successfulHeaders) : 'unknown',
        agencyId: agencyId,
        providerId: providerId,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('Function error:', error.message);
    
    // Datos de fallback
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
        apiUrl: `https://api.apimo.pro/agencies/${agencyId}/properties`,
        agencyId: agencyId,
        providerId: providerId,
        timestamp: new Date().toISOString()
      })
    };
  }
};
