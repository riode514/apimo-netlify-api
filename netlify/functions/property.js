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
    
    const pathParts = path.split('/');
    let propertyId = pathParts[pathParts.length - 1];
    
    // Remove any file extensions
    propertyId = propertyId.replace(/\.(html|js|css)$/, '');
    
    console.log('Extracted property ID:', propertyId);
    console.log('Agency ID: 24985, Provider ID: 4352');
    
    if (!propertyId || propertyId === 'property' || propertyId === '') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Property ID is required',
          debug: {
            path: path,
            pathParts: pathParts,
            propertyId: propertyId,
            agency_id: 24985,
            provider_id: 4352
          }
        })
      };
    }

    console.log('Fetching property data from Apimo API for ID:', propertyId);
    
    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'apimo.net',
        path: `/agencies/24985/properties/${propertyId}?provider_id=4352`,
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
          
          if (res.statusCode === 404) {
            reject(new Error(`Property with ID ${propertyId} not found`));
            return;
          }
          
          if (res.statusCode !== 200) {
            console.error('API Error Response:', data);
            reject(new Error(`API returned status ${res.statusCode}: ${data}`));
            return;
          }
          
          try {
            const parsedData = JSON.parse(data);
            console.log('Successfully parsed property data');
            console.log('Data structure:', Object.keys(parsedData));
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
          agency_id: 24985,
          provider_id: 4352,
          timestamp: new Date().toISOString(),
          api_response_keys: Object.keys(data)
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
          method: event.httpMethod,
          agency_id: 24985,
          provider_id: 4352
        }
      })
    };
  }
};
