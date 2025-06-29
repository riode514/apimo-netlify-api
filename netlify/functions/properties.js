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
    console.log('Fetching properties from Apimo API...');
    console.log('Agency ID: 24985, Provider ID: 4352');
    
    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'apimo.net',
        path: '/agencies/24985/properties?provider_id=4352&limit=50',
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; PropertyBot/1.0)',
          'Content-Type': 'application/json'
        }
      };

      console.log('Making request to:', `https://${options.hostname}${options.path}`);

      const req = https.request(options, (res) => {
        let data = '';
        
        console.log('Response status:', res.statusCode);
        console.log('Response headers:', JSON.stringify(res.headers, null, 2));
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          console.log('Raw response data length:', data.length);
          console.log('First 200 chars:', data.substring(0, 200));
          
          if (res.statusCode !== 200) {
            console.error('API Error Response:', data);
            reject(new Error(`API returned status ${res.statusCode}: ${data}`));
            return;
          }
          
          try {
            const parsedData = JSON.parse(data);
            console.log('Successfully parsed properties data');
            console.log('Data structure:', Object.keys(parsedData));
            resolve(parsedData);
          } catch (parseError) {
            console.error('Parse error:', parseError);
            console.error('Raw response:', data.substring(0, 500));
            reject(new Error(`Invalid JSON response: ${parseError.message}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error('Request error:', error);
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.setTimeout(15000, () => {
        console.error('Request timeout');
        req.destroy();
        reject(new Error('Request timeout after 15 seconds'));
      });

      req.end();
    });

    // Handle different possible response structures
    let properties = [];
    if (Array.isArray(data)) {
      properties = data;
    } else if (data.properties && Array.isArray(data.properties)) {
      properties = data.properties;
    } else if (data.data && Array.isArray(data.data)) {
      properties = data.data;
    } else if (data.results && Array.isArray(data.results)) {
      properties = data.results;
    }

    console.log('Properties count:', properties.length);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          properties: properties
        },
        count: properties.length,
        debug: {
          agency_id: 24985,
          provider_id: 4352,
          timestamp: new Date().toISOString(),
          api_response_keys: Object.keys(data)
        }
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
          agency_id: 24985,
          provider_id: 4352,
          timestamp: new Date().toISOString(),
          errorType: error.constructor.name
        }
      })
    };
  }
};
