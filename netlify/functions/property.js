// netlify/functions/property.js
const https = require('https');

exports.handler = async (event, context) => {
  // Enhanced CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Credentials': false,
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ 
        success: false,
        error: 'Method not allowed. Only GET requests are supported.' 
      })
    };
  }

  try {
    // Extract property ID from path
    const path = event.path || '';
    console.log('Full path:', path);
    
    const pathParts = path.split('/');
    const propertyId = pathParts[pathParts.length - 1];
    
    console.log('Extracted property ID:', propertyId);
    
    if (!propertyId || propertyId === 'property' || propertyId === '') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Property ID is required',
          debug: {
            path: path,
            pathParts: pathParts,
            propertyId: propertyId
          }
        })
      };
    }

    console.log('Fetching property data for ID:', propertyId);
    
    const propertyData = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.properstar.com',
        path: `/apiv1/public/properties/${propertyId}?key=a1d3d8fb6b75`,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      };

      console.log('Making request to:', `https://${options.hostname}${options.path}`);

      const req = https.request(options, (res) => {
        let data = '';
        
        console.log('Response status:', res.statusCode);
        console.log('Response headers:', res.headers);
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log('Raw response data length:', data.length);
          
          if (res.statusCode !== 200) {
            reject(new Error(`API returned status ${res.statusCode}: ${data}`));
            return;
          }
          
          try {
            const parsedData = JSON.parse(data);
            console.log('Successfully parsed property data');
            resolve(parsedData);
          } catch (parseError) {
            console.error('Failed to parse JSON:', parseError);
            console.error('Raw response:', data.substring(0, 500));
            reject(new Error(`Invalid JSON response: ${parseError.message}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error('HTTP request error:', error);
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.on('timeout', () => {
        console.error('Request timeout');
        req.destroy();
        reject(new Error('Request timeout after 15 seconds'));
      });

      req.end();
    });

    console.log('Property data fetched successfully');

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data: propertyData,
        debug: {
          propertyId: propertyId,
          timestamp: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('Error in property function:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: error.message,
        debug: {
          timestamp: new Date().toISOString(),
          path: event.path,
          method: event.httpMethod
        }
      })
    };
  }
};
