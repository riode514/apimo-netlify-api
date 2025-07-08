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
  
  // ✅ CORRECT CREDENTIALS FORMAT
  const providerId = '4352';           // Your Provider ID
  const token = '68460111a25a4d1ba2508ead22a2b59e16cfcfcd'; // Your API Token
  const agencyId = '24985';            // Your Agency ID
  
  const apiUrl = `https://api.apimo.pro/agencies/${agencyId}/properties`;
  
  // ✅ CORRECT BASIC AUTH FORMAT (provider:token)
  const credentials = Buffer.from(`${providerId}:${token}`).toString('base64');
  
  try {
    console.log('🔗 Fetching properties from Apimo...');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Apimo API failed:', response.status, errorText);
      throw new Error(`Apimo API ${response.status}: ${errorText}`);
    }
    
    const apiData = await response.json();
    console.log('✅ Apimo API response received, properties count:', apiData.length || 'unknown');
    
    // Handle different response formats
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
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Fallback properties
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
        source: "Fallback data",
        error: error.message
      })
    };
  }
};
