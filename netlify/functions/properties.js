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
    
    // Try multiple possible API base URLs
    const apiHosts = [
      'api.apimo.net',
      'webservice.apimo.net', 
      'api.apimo.pro',
      'services.apimo.net'
    ];
    
    let data = null;
    let lastError = null;
    
    for (const hostname of apiHosts) {
      try {
        console.log(`Trying API host: ${hostname}`);
        
        data = await new Promise((resolve, reject) => {
          const options = {
            hostname: hostname,
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
            let responseData = '';
            
            console.log(`${hostname} - Response status:`, res.statusCode);
            console.log(`${hostname} - Response headers:`, JSON.stringify(res.headers, null, 2));
            
            res.on('data', (chunk) => {
              responseData += chunk;
            });
            
            res.on('end', () => {
              console.log(`${hostname} - Raw response data length:`, responseData.length);
              console.log(`${hostname} - First 200 chars:`, responseData.substring(0, 200));
              
              // Check for redirects or HTML responses (indicates wrong endpoint)
              if (res.statusCode === 301 || res.statusCode === 302) {
                reject(new Error(`Redirect detected from ${hostname} - wrong API endpoint`));
                return;
              }
              
              if (responseData.includes('<!DOCTYPE html>') || responseData.includes('<html>')) {
                reject(new Error(`HTML response from ${hostname} - not an API endpoint`));
                return;
              }
              
              if (res.statusCode !== 200) {
                reject(new Error(`${hostname} returned status ${res.statusCode}: ${responseData}`));
                return;
              }
              
              try {
                const parsedData = JSON.parse(responseData);
                console.log(`SUCCESS with ${hostname}!`);
                console.log('Data structure:', Object.keys(parsedData));
                resolve({ data: parsedData, hostname: hostname });
              } catch (parseError) {
                reject(new Error(`${hostname} - Invalid JSON: ${parseError.message}`));
              }
            });
          });

          req.on('error', (error) => {
            reject(new Error(`${hostname} - Request failed: ${error.message}`));
          });

          req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error(`${hostname} - Request timeout`));
          });

          req.end();
        });
        
        // If we get here, this hostname worked
        console.log(`Found working API host: ${data.hostname}`);
        break;
        
      } catch (error) {
        console.log(`${hostname} failed:`, error.message);
        lastError = error;
        continue;
      }
    }
    
    if (!data) {
      // None of the API hosts worked, try the website documentation path
      console.log('Trying website API path as fallback...');
      
      data = await new Promise((resolve, reject) => {
        const options = {
          hostname: 'apimo.net',
          path: '/en/api/webservice/agencies/24985/properties?provider_id=4352&limit=50',
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; PropertyBot/1.0)',
            'Content-Type': 'application/json'
          }
        };

        console.log('Making fallback request to:', `https://${options.hostname}${options.path}`);

        const req = https.request(options, (res) => {
          let responseData = '';
          
          res.on('data', (chunk) => {
            responseData += chunk;
          });
          
          res.on('end', () => {
            if (res.statusCode !== 200 || responseData.includes('<!DOCTYPE html>')) {
              reject(new Error(`Fallback also failed. Status: ${res.statusCode}, Response: ${responseData.substring(0, 200)}`));
              return;
            }
            
            try {
              const parsedData = JSON.parse(responseData);
              resolve({ data: parsedData, hostname: 'apimo.net (fallback)' });
            } catch (parseError) {
              reject(new Error(`Fallback - Invalid JSON: ${parseError.message}`));
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.setTimeout(10000, () => {
          req.destroy();
          reject(new Error('Fallback request timeout'));
        });

        req.end();
      });
    }

    // Handle different possible response structures
    let properties = [];
    const responseData = data.data;
    
    if (Array.isArray(responseData)) {
      properties = responseData;
    } else if (responseData.properties && Array.isArray(responseData.properties)) {
      properties = responseData.properties;
    } else if (responseData.data && Array.isArray(responseData.data)) {
      properties = responseData.data;
    } else if (responseData.results && Array.isArray(responseData.results)) {
      properties = responseData.results;
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
          working_api_host: data.hostname,
          agency_id: 24985,
          provider_id: 4352,
          timestamp: new Date().toISOString(),
          api_response_keys: Object.keys(responseData)
        }
      })
    };

  } catch (error) {
    console.error('All API attempts failed:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'All API endpoints failed. Please check Apimo API documentation for correct base URL.',
        details: error.message,
        debug: {
          agency_id: 24985,
          provider_id: 4352,
          timestamp: new Date().toISOString(),
          attempted_hosts: [
            'api.apimo.net',
            'webservice.apimo.net', 
            'api.apimo.pro',
            'services.apimo.net',
            'apimo.net (fallback)'
          ]
        }
      })
    };
  }
};
