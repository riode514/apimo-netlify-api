// netlify/functions/property.js  
const https = require('https');

const headers = {
  'Access-Control-Allow-Origin': '*',  // Allow all origins
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  // Handle preflight OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Extract property ID from path
  const path = event.path;
  const propertyId = path.split('/').pop();
  
  if (!propertyId || propertyId === 'property') {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Property ID is required'
      })
    };
  }

  try {
    console.log('Fetching property:', propertyId);
    
    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.properstar.com',
        path: `/apiv1/public/properties/${propertyId}?key=a1d3d8fb6b75`,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PropertyBot/1.0)'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
            resolve(parsedData);
          } catch (parseError) {
            console.error('Parse error:', parseError);
            reject(parseError);
          }
        });
      });

      req.on('error', (error) => {
        console.error('Request error:', error);
        reject(error);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });

    console.log('Property data received for ID:', propertyId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: data
      })
    };

  } catch (error) {
    console.error('Error fetching property:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch property: ' + error.message
      })
    };
  }
};
