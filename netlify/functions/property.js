// netlify/functions/property.js
// Single property fetch from Apimo API

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const propertyId = event.queryStringParameters?.id;
    
    if (!propertyId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Property ID is required'
        })
      };
    }

    // Apimo API credentials
    const APIMO_CONFIG = {
      provider: '4352',
      agency: '24985',
      token: '68460111a25a4d1ba2508ead22a2b59e16cfcfcd'
    };

    // Try to fetch all properties first (since Apimo doesn't seem to have a single property endpoint)
    const apiUrl = 'https://webservice.apimo.pro/producers/properties';
    const queryParams = new URLSearchParams({
      provider: APIMO_CONFIG.provider,
      agency: APIMO_CONFIG.agency,
      token: APIMO_CONFIG.token,
      limit: '1000', // Get more properties to increase chance of finding the one we want
      cache_bust: Date.now().toString()
    });

    console.log('Fetching from Apimo API:', `${apiUrl}?${queryParams}`);

    const response = await fetch(`${apiUrl}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'VERV-ONE-Website/1.0'
      },
      timeout: 10000 // 10 second timeout
    });

    if (!response.ok) {
      console.error('Apimo API Error:', response.status, response.statusText);
      
      // Try alternative endpoint
      const altUrl = 'https://webservice.apimo.pro/properties';
      const altResponse = await fetch(`${altUrl}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'VERV-ONE-Website/1.0'
        }
      });

      if (!altResponse.ok) {
        throw new Error(`Apimo API error: ${response.status} ${response.statusText}`);
      }
      
      const altData = await altResponse.json();
      return handleApiResponse(altData, propertyId, headers);
    }

    const data = await response.json();
    return handleApiResponse(data, propertyId, headers);

  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: `Failed to fetch property: ${error.message}`,
        debug: {
          propertyId: event.queryStringParameters?.id,
          timestamp: new Date().toISOString()
        }
      })
    };
  }
};

function handleApiResponse(data, propertyId, headers) {
  try {
    console.log('API Response structure:', {
      success: data.success,
      hasData: !!data.data,
      dataType: typeof data.data,
      isArray: Array.isArray(data.data)
    });

    if (!data.success) {
      throw new Error('API returned success: false');
    }

    let properties = [];
    
    // Handle different possible response structures
    if (Array.isArray(data.data)) {
      properties = data.data;
    } else if (data.data && Array.isArray(data.data.properties)) {
      properties = data.data.properties;
    } else if (data.data && data.data.id) {
      properties = [data.data];
    } else if (Array.isArray(data)) {
      properties = data;
    }

    console.log(`Found ${properties.length} properties, searching for ID: ${propertyId}`);

    // Find the specific property
    const property = properties.find(p => {
      const propId = String(p.id || p.reference || '');
      const searchId = String(propertyId);
      return propId === searchId;
    });

    if (!property) {
      // Return available IDs for debugging
      const availableIds = properties.slice(0, 10).map(p => ({
        id: p.id,
        reference: p.reference,
        title: p.title || (p.comments && p.comments[0]?.title)
      }));

      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Property not found',
          debug: {
            searchedId: propertyId,
            totalProperties: properties.length,
            sampleAvailableProperties: availableIds
          }
        })
      };
    }

    console.log('Found property:', property.id, property.reference);

    // Transform property data to simplified format
    const transformedProperty = transformPropertyData(property);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        property: transformedProperty,
        debug: {
          originalId: property.id,
          source: 'Apimo API',
          timestamp: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('Response handling error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: `Failed to process API response: ${error.message}`
      })
    };
  }
}

function transformPropertyData(property) {
  // Extract English comments for title and description
  const englishComment = property.comments?.find(c => c.language === 'en') || property.comments?.[0];
  
  // Extract city name
  const cityName = property.city?.name || property.zipcode?.name || property.district?.name || 'Premium Location';
  
  // Extract areas
  const builtArea = property.area?.total || property.area?.value || null;
  const livingArea = property.area?.value || null;
  
  // Calculate land area from areas array
  let landArea = null;
  if (property.areas && Array.isArray(property.areas)) {
    const landTypes = [49, 50, 51]; // Land area types according to Apimo
    landArea = property.areas
      .filter(area => landTypes.includes(area.type))
      .reduce((total, area) => total + (area.area || 0), 0) || null;
  }
  if (!landArea && property.plot?.net_floor) {
    landArea = property.plot.net_floor;
  }

  // Extract property type
  let propertyType = 'Property';
  if (property.subtype?.name) {
    propertyType = property.subtype.name;
  } else if (property.type?.name) {
    propertyType = property.type.name;
  } else if (property.category?.name) {
    propertyType = property.category.name;
  }

  return {
    id: property.id,
    title: englishComment?.title || property.title || `${propertyType} in ${cityName}`,
    city: cityName,
    price: property.price?.value || property.price || null,
    type: propertyType,
    reference: property.reference || property.id,
    area: builtArea,
    living_area: livingArea,
    land_area: landArea,
    rooms: property.rooms || null,
    bedrooms: property.bedrooms || null,
    bathrooms: property.bathrooms || property.toilets || null,
    description: englishComment?.comment || property.description || `This exceptional ${propertyType.toLowerCase()} in ${cityName} offers a unique opportunity for discerning buyers.`,
    images: property.pictures || property.images || [],
    coordinates: property.coordinates || null,
    _original: property // Include original data for debugging
  };
}
