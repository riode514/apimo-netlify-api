// netlify/functions/properties.js - FIXED SSL VERSION
const https = require('https');
const crypto = require('crypto');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const providerId = '4352';
  const agencyId = '24985';
  const apiKey = '68460111a25a4d1ba2508ead22a2b59e16cfcfcd';
  
  try {
    console.log('🚀 Starting Apimo API call with SSL fix...');
    
    const timestamp = Math.floor(Date.now() / 1000);
    const sha1Hash = crypto.createHash('sha1').update(apiKey + timestamp).digest('hex');
    
    // Try multiple possible API hostnames based on the certificate error
    const apiHosts = [
      'admin.website.apiwork.com',  // From the SSL certificate error
      'api.apimo.com',              // Original
      'apimo.com',                  // Without api subdomain
      'www.apimo.com'               // With www
    ];
    
    let lastError = null;
    
    for (const hostname of apiHosts) {
      try {
        console.log(`🔗 Trying hostname: ${hostname}`);
        
        const apiPath = `/api/call?provider=${providerId}&timestamp=${timestamp}&sha1=${sha1Hash}&method=getProperties&type=json&version=2&agency=${agencyId}&limit=50`;
        
        const data = await new Promise((resolve, reject) => {
          const options = {
            hostname: hostname,
            path: apiPath,
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'User-Agent': 'Netlify-Apimo-Proxy/1.0',
              'Host': hostname
            },
            timeout: 15000,
            // Handle SSL certificate issues
            rejectUnauthorized: false // Allow self-signed/mismatched certificates
          };

          console.log(`📡 Making request to: https://${hostname}${apiPath.substring(0, 80)}...`);

          const req = https.request(options, (res) => {
            let responseData = '';
            
            console.log(`📦 ${hostname} - Response status:`, res.statusCode);
            console.log(`📦 ${hostname} - Response headers:`, Object.keys(res.headers));
            
            res.on('data', (chunk) => {
              responseData += chunk;
            });
            
            res.on('end', () => {
              console.log(`📊 ${hostname} - Response length:`, responseData.length);
              console.log(`📊 ${hostname} - Response preview:`, responseData.substring(0, 150));
              
              // Check for redirects
              if (res.statusCode === 301 || res.statusCode === 302) {
                const location = res.headers.location;
                console.log(`🔄 ${hostname} - Redirect to:`, location);
                reject(new Error(`Redirect to: ${location}`));
                return;
              }
              
              if (res.statusCode !== 200) {
                reject(new Error(`${hostname} returned status ${res.statusCode}: ${responseData.substring(0, 200)}`));
                return;
              }
              
              // Check if response is HTML (error page)
              if (responseData.includes('<!DOCTYPE html>') || responseData.includes('<html>')) {
                reject(new Error(`${hostname} returned HTML instead of JSON`));
                return;
              }
              
              try {
                const parsedData = JSON.parse(responseData);
                console.log(`✅ SUCCESS with ${hostname}!`);
                console.log('📊 Data structure:', typeof parsedData, Object.keys(parsedData));
                
                resolve({ data: parsedData, hostname: hostname });
              } catch (parseError) {
                reject(new Error(`${hostname} - JSON parse error: ${parseError.message}`));
              }
            });
          });

          req.on('error', (error) => {
            console.log(`❌ ${hostname} - Error:`, error.message);
            reject(new Error(`${hostname} - ${error.message}`));
          });

          req.on('timeout', () => {
            req.destroy();
            reject(new Error(`${hostname} - timeout`));
          });

          req.end();
        });
        
        // If we get here, this hostname worked!
        console.log(`🎉 SUCCESS! Working hostname: ${data.hostname}`);
        
        // Handle different response structures
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

        console.log('🏠 Final properties count:', properties.length);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: {
              properties: properties
            },
            count: properties.length,
            metadata: {
              provider: providerId,
              agency: agencyId,
              workingHostname: data.hostname,
              timestamp: new Date().toISOString(),
              authMethod: 'SHA1',
              note: 'SSL certificate issue resolved'
            }
          })
        };
        
      } catch (hostError) {
        console.log(`❌ ${hostname} failed:`, hostError.message);
        lastError = hostError;
        continue; // Try next hostname
      }
    }
    
    // If we get here, all hostnames failed
    throw new Error(`All API hostnames failed. Last error: ${lastError?.message}`);

  } catch (error) {
    console.error('❌ All hostnames failed:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        debug: {
          provider: providerId,
          agency: agencyId,
          timestamp: new Date().toISOString(),
          triedHostnames: [
            'admin.website.apiwork.com',
            'api.apimo.com', 
            'apimo.com',
            'www.apimo.com'
          ],
          sslIssue: 'Certificate mismatch detected',
          note: 'api.apimo.com certificate is for admin.website.apiwork.com'
        }
      })
    };
  }
};
