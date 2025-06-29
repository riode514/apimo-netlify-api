// netlify/functions/properties.js - WORKING VERSION
const https = require('https');
const crypto = require('crypto');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  // Handle preflight OPTIONS request
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

  // Your WORKING Apimo credentials
  const providerId = '4352';
  const agencyId = '24985';
  const apiKey = '68460111a25a4d1ba2508ead22a2b59e16cfcfcd';
  
  try {
    console.log('🚀 Starting Apimo API call with WORKING credentials...');
    console.log('Provider:', providerId, 'Agency:', agencyId);
    
    // Generate SHA1 authentication (your working method)
    const timestamp = Math.floor(Date.now() / 1000);
    const sha1Hash = crypto.createHash('sha1').update(apiKey + timestamp).digest('hex');
    
    console.log('🔐 Generated SHA1 hash authentication');
    
    // Your WORKING API endpoint format
    const apiUrl = `https://api.apimo.com/api/call?provider=${providerId}&timestamp=${timestamp}&sha1=${sha1Hash}&method=getProperties&type=json&version=2&agency=${agencyId}&limit=50`;
    
    console.log('🔗 API URL:', apiUrl.substring(0, 100) + '...');
    
    const data = await new Promise((resolve, reject) => {
      const urlObj = new URL(apiUrl);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Netlify-Apimo-Proxy/1.0'
        },
        timeout: 15000
      };

      console.log('📡 Making HTTPS request to api.apimo.com...');

      const req = https.request(options, (res) => {
        let responseData = '';
        
        console.log('📦 Response status:', res.statusCode);
        console.log('📦 Response headers:', JSON.stringify(res.headers, null, 2));
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          console.log('📊 Response data length:', responseData.length);
          console.log('📊 Response preview:', responseData.substring(0, 200));
          
          if (res.statusCode !== 200) {
            console.error('❌ API Error Status:', res.statusCode);
            console.error('❌ API Error Response:', responseData.substring(0, 500));
            reject(new Error(`API returned status ${res.statusCode}: ${responseData}`));
            return;
          }
          
          // Check if response looks like HTML (error page)
          if (responseData.includes('<!DOCTYPE html>') || responseData.includes('<html>')) {
            console.error('❌ Received HTML instead of JSON - probably an error page');
            reject(new Error('Received HTML error page instead of JSON data'));
            return;
          }
          
          try {
            const parsedData = JSON.parse(responseData);
            console.log('✅ Successfully parsed JSON response');
            console.log('📊 Data structure:', typeof parsedData, Object.keys(parsedData));
            
            // Check if we have properties in the response
            if (parsedData.properties && Array.isArray(parsedData.properties)) {
              console.log('🏠 Found', parsedData.properties.length, 'properties');
            } else if (Array.isArray(parsedData)) {
              console.log('🏠 Found', parsedData.length, 'properties (direct array)');
            } else {
              console.log('📊 Response structure:', Object.keys(parsedData));
            }
            
            resolve(parsedData);
          } catch (parseError) {
            console.error('❌ Failed to parse JSON:', parseError.message);
            console.error('📄 Raw response:', responseData.substring(0, 500));
            reject(new Error(`Invalid JSON response: ${parseError.message}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error('🌐 Network Error:', error.message);
        reject(new Error(`Network request failed: ${error.message}`));
      });

      req.on('timeout', () => {
        console.error('⏰ Request timeout');
        req.destroy();
        reject(new Error('Request timeout after 15 seconds'));
      });

      req.end();
    });

    // Success! Format the response for your frontend
    console.log('🎉 APIMO API SUCCESS!');
    
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
          timestamp: new Date().toISOString(),
          apiEndpoint: 'api.apimo.com',
          authMethod: 'SHA1',
          note: 'Using WORKING credentials and endpoint format'
        }
      })
    };

  } catch (error) {
    console.error('❌ Error in properties function:', error);
    
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
          endpoint: 'api.apimo.com',
          authMethod: 'SHA1'
        }
      })
    };
  }
};
