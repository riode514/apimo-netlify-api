// Save as: netlify/functions/property.js

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Your exact Apimo credentials
  const providerId = '4352';
  const agencyId = '24985';
  const apiKey = '68460111a25a4d1ba2508ead22a2b59e16cfcfcd';
  
  // Get property ID from query parameters or path
  const queryParams = event.queryStringParameters || {};
  let propertyId = queryParams.id || queryParams.property_id;
  
  // Alternative: get from path parameters if using /.netlify/functions/property/123
  if (!propertyId && event.path) {
    const pathParts = event.path.split('/');
    propertyId = pathParts[pathParts.length - 1];
  }
  
  // Validate property ID
  if (!propertyId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Property ID is required',
        details: 'Please provide property ID as query parameter: ?id=123 or ?property_id=123',
        usage: {
          examples: [
            '/.netlify/functions/property?id=123',
            '/.netlify/functions/property?property_id=123'
          ]
        }
      })
    };
  }
  
  // Build API URL for single property
  const apiUrl = `https://api.apimo.pro/agencies/${agencyId}/properties/${propertyId}`;
  
  // Basic Authentication: provider:token format
  const credentials = Buffer.from(`${providerId}:${apiKey}`).toString('base64');
  
  try {
    console.log(`🔗 Calling Apimo API for property: ${propertyId}`);
    console.log(`📍 URL: ${apiUrl}`);
    console.log(`👤 Using Provider ID: ${providerId}, Agency ID: ${agencyId}`);

    // Make the API call with Basic Authentication
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Apimo-Client/1.0'
      },
      timeout: 30000 // 30 second timeout
    });

    const responseText = await response.text();
    console.log(`📦 Response Status: ${response.status}`);

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} - ${response.statusText}`);
      console.error(`📄 Response Body: ${responseText.substring(0, 500)}`);
      
      // Handle specific error cases
      let errorMessage = `Apimo API Error: ${response.status} - ${response.statusText}`;
      if (response.status === 401) {
        errorMessage = 'Authentication failed. Please check your credentials.';
      } else if (response.status === 404) {
        errorMessage = `Property with ID ${propertyId} not found.`;
      } else if (response.status === 403) {
        errorMessage = 'Access denied. You may not have permission to view this property.';
      } else if (response.status === 429) {
        errorMessage = 'API rate limit exceeded. Please try again later.';
      }
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          success: false,
          error: errorMessage,
          details: responseText.substring(0, 500),
          provider: providerId,
          agency: agencyId,
          propertyId: propertyId,
          endpoint: apiUrl
        })
      };
    }

    // Parse JSON response
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('✅ SUCCESS! Received valid JSON response for property');
      
      // Log property details for debugging
      if (data.id) {
        console.log(`🏠 Property ID: ${data.id}`);
        console.log(`📍 Reference: ${data.reference || 'N/A'}`);
        console.log(`🏷️ Category: ${data.category || 'N/A'}`);
        console.log(`📊 Status: ${data.status || 'N/A'}`);
      } else {
        console.log(`📊 Response structure:`, Object.keys(data));
      }
      
    } catch (parseError) {
      console.error(`❌ JSON Parse Error:`, parseError.message);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Invalid JSON response from Apimo API',
          details: parseError.message,
          rawResponse: responseText.substring(0, 500)
        })
      };
    }

    // Success! Return the property data
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: data,
        metadata: {
          provider: providerId,
          agency: agencyId,
          propertyId: propertyId,
          endpoint: apiUrl,
          timestamp: new Date().toISOString(),
          propertyInfo: {
            id: data.id || null,
            reference: data.reference || null,
            category: data.category || null,
            status: data.status || null,
            type: data.type || null,
            city: data.city ? data.city.name : null,
            address: data.address || null
          }
        }
      })
    };

  } catch (error) {
    console.error('❌ Network/Server Error:', error.message);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Network error while calling Apimo API',
        details: error.message,
        provider: providerId,
        agency: agencyId,
        propertyId: propertyId,
        endpoint: apiUrl
      })
    };
  }
};
