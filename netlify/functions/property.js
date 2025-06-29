// netlify/functions/property.js
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
    // Extract property ID from path - FIXED
    const path = event.path || '';
    console.log('Full path:', path);
    
    // Better property ID extraction
    const pathParts = path.split('/');
    let propertyId = pathParts[pathParts.length - 1];
    
    // Remove any file extensions or invalid characters
    propertyId = propertyId.replace(/\.(html|js|css)$/, '');
    
    console.log('Extracted property ID:', propertyId);
    
    if (!propertyId || propertyId === 'property' || propertyId === '' || isNaN(propertyId)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Valid Property ID is required',
          debug: {
            path: path,
            pathParts: pathParts,
            propertyId: propertyId
          }
        })
      };
    }

    console.log('Fetching property data from Apimo API for ID:', propertyId);
    
    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.apimo.pro',
        path: `/agencies/3633/properties/${propertyId}`,
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

      req.setTimeout(15000, () => {
        console.error('Request timeout');
        req.destroy();
        reject(new Error('Request timeout after 15 seconds'));
      });

      req.end();
    });

    console.log('Property data fetched successfully from Apimo');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: data,
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
      headers,
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
