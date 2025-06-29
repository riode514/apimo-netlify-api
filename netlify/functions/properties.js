// Save as: netlify/functions/properties.js
// Enhanced version with pagination and filtering support

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
  
  // Parse query parameters for pagination and filtering
  const queryParams = event.queryStringParameters || {};
  const {
    page = 1,
    limit = 50,
    category,
    status,
    city,
    type
  } = queryParams;
  
  // Build URL with query parameters
  let apiUrl = `https://api.apimo.pro/agencies/${agencyId}/properties`;
  const urlParams = new URLSearchParams();
  
  // Add pagination
  if (page > 1) urlParams.append('page', page);
  if (limit !== '50') urlParams.append('limit', limit);
  
  // Add filters if provided
  if (category) urlParams.append('category', category);
  if (status) urlParams.append('status', status);
  if (city) urlParams.append('city', city);
  if (type) urlParams.append('type', type);
  
  // Append parameters to URL if any exist
  if (urlParams.toString()) {
    apiUrl += `?${urlParams.toString()}`;
  }
  
  // Basic Authentication: provider:token format
  const credentials = Buffer.from(`${providerId}:${apiKey}`).toString('base64');
  
  try {
    console.log(`🔗 Calling Apimo API: ${apiUrl}`);
    console.log(`👤 Using Provider ID: ${providerId}, Agency ID: ${agencyId}`);
    console.log(`📄 Query params:`, queryParams);

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
        errorMessage = 'Agency not found or no properties available.';
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
          endpoint: apiUrl
        })
      };
    }

    // Parse JSON response
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('✅ SUCCESS! Received valid JSON response');
      
      // Log data structure for debugging
      if (data.properties) {
        console.log(`📊 Properties found: ${data.properties.length}`);
        console.log(`📈 Total items: ${data.total_items || 'unknown'}`);
      } else if (Array.isArray(data)) {
        console.log(`📊 Array response with ${data.length} items`);
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

    // Calculate pagination info
    const totalItems = data.total_items || (data.properties ? data.properties.length : 0);
    const currentPage = parseInt(page);
    const itemsPerPage = parseInt(limit);
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Success! Return the data with enhanced metadata
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: data,
        metadata: {
          provider: providerId,
          agency: agencyId,
          endpoint: apiUrl,
          timestamp: new Date().toISOString(),
          pagination: {
            currentPage: currentPage,
            itemsPerPage: itemsPerPage,
            totalItems: totalItems,
            totalPages: totalPages,
            hasNextPage: currentPage < totalPages,
            hasPrevPage: currentPage > 1
          },
          filters: {
            category: category || null,
            status: status || null,
            city: city || null,
            type: type || null
          },
          propertiesCount: data.properties ? data.properties.length : (Array.isArray(data) ? data.length : 0)
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
        endpoint: apiUrl
      })
    };
  }
};
