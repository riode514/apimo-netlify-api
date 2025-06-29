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
        console.log(`Trying API host: ${hostname} for property ${propertyId}`);
        
        data = await new Promise((resolve, reject) => {
          const options = {
            hostname: hostname,
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
            let responseData = '';
            
            console.log(`${hostname} - Response status:`, res.statusCode);
            
            res.on('data', (chunk) => {
              responseData += chunk;
            });
            
            res.on('end', () => {
              console.log(`${hostname} - Response length:`, responseData.length);
              console.log(`${hostname} - First 200 chars:`, responseData.substring(0, 200));
              
              // Check for redirects or HTML responses
              if (res.statusCode === 301 || res.statusCode === 302) {
                reject(new Error(`Redirect detected from ${hostname} - wrong API endpoint`));
                return;
              }
              
              if (responseData.includes('<!DOCTYPE html>') || responseData.includes('<html>')) {
                reject(new Error(`HTML response from ${hostname} - not an API endpoint`));
                return;
              }
              
              if (res.statusCode === 404) {
                reject(new Error(`Property ${propertyId} not found on ${hostname}`));
                return;
              }
              
              if (res.statusCode !== 200) {
                reject(new Error(`${hostname} returned status ${res.statusCode}: ${responseData}`));
                return;
              }
              
              try {
                const parsedData = JSON.parse(responseData);
                console.log(`SUCCESS with ${hostname} for property ${propertyId}!`);
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
      // Try fallback with website path
      console.log('Trying website API path as fallback...');
      
      try {
        data = await new Promise((resolve, reject) => {
          const options = {
            hostname: 'apimo.net',
            path: `/en/api/webservice/agencies/24985/properties/${propertyId}?provider_id=4352`,
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (compatible; PropertyBot/1.0)',
              'Content-Type': 'application/json'
            }
          };

          const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
              responseData += chunk;
            });
            
            res.on('end', () => {
              if (res.statusCode !== 200 || responseData.includes('<!DOCTYPE html>')) {
                reject(new Error(`Fallback failed. Status: ${res.statusCode}`));
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

          req.on('error', reject);
          req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Fallback timeout'));
          });
          req.end();
        });
      } catch (fallbackError) {
        throw new Error(`All API hosts failed. Last error: ${lastError?.message || 'Unknown'}`);
      }
    }

    console.log('Property data fetched successfully from Apimo');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: data.data,
        debug: {
          propertyId: propertyId,
          working_api_host: data.hostname,
          agency_id: 24985,
          provider_id: 4352,
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
          method: event.httpMethod,
          agency_id: 24985,
          provider_id: 4352,
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
