// netlify/functions/properties.js
const https = require('https');

const headers = {
  'Access-Control-Allow-Origin': '*',
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

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('Fetching all properties from Apimo API...');
    
    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.apimo.pro',
        path: '/agencies/3633/properties?limit=50',
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; PropertyBot/1.0)',
          'Authorization': 'Bearer YOUR_APIMO_TOKEN'  // You'll need to add your actual token
        }
      };

      console.log('Making request to:', `https://${options.hostname}${options.path}`);

      const req = https.request(options, (res) => {
        let data = '';
        
        console.log('Response status:', res.statusCode);
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log('Raw response data length:', data.length);
          
          try {
            const parsedData = JSON.parse(data);
            console.log('Successfully parsed properties data');
            resolve(parsedData);
          } catch (parseError) {
            console.error('Parse error:', parseError);
            console.error('Raw response:', data.substring(0, 500));
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

    console.log('API response received, properties count:', data?.properties?.length || data?.length || 0);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          properties: data.properties || data || []
        },
        count: data?.properties?.length || data?.length || 0
      })
    };

  } catch (error) {
    console.error('Error fetching properties:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch properties: ' + error.message,
        debug: {
          timestamp: new Date().toISOString(),
          errorType: error.constructor.name
        }
      })
    };
  }
};
