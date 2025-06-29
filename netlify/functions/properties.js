// netlify/functions/properties.js - USING FETCH (like your original)

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
    console.log('🚀 Starting Apimo API call using fetch...');
    
    const timestamp = Math.floor(Date.now() / 1000);
    const crypto = require('crypto');
    const sha1Hash = crypto.createHash('sha1').update(apiKey + timestamp).digest('hex');
    
    // Try the hostnames from certificate error first
    const apiUrls = [
      `https://admin.website.apiwork.com/api/call?provider=${providerId}&timestamp=${timestamp}&sha1=${sha1Hash}&method=getProperties&type=json&version=2&agency=${agencyId}&limit=50`,
      `https://api.apimo.com/api/call?provider=${providerId}&timestamp=${timestamp}&sha1=${sha1Hash}&method=getProperties&type=json&version=2&agency=${agencyId}&limit=50`,
      `https://apimo.com/api/call?provider=${providerId}&timestamp=${timestamp}&sha1=${sha1Hash}&method=getProperties&type=json&version=2&agency=${agencyId}&limit=50`
    ];
    
    let lastError = null;
    
    for (let i = 0; i < apiUrls.length; i++) {
      const apiUrl = apiUrls[i];
      
      try {
        console.log(`🔗 Trying URL ${i+1}/${apiUrls.length}: ${apiUrl.substring(0, 80)}...`);

        // Use dynamic import for fetch in Node.js
        const fetch = (await import('node-fetch')).default;
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Netlify-Apimo-Proxy/1.0'
          },
          timeout: 15000
        });

        console.log(`📦 Response status: ${response.status}`);
        
        const responseText = await response.text();
        console.log(`📊 Response length: ${responseText.length}`);
        console.log(`📊 Response preview: ${responseText.substring(0, 200)}`);

        if (!response.ok) {
          console.log(`❌ HTTP Error ${response.status}: ${responseText.substring(0, 200)}`);
          lastError = `HTTP ${response.status}: ${responseText.substring(0, 200)}`;
          continue; // Try next URL
        }

        // Check if response is HTML (error page)
        if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html>')) {
          console.log(`❌ Received HTML instead of JSON`);
          lastError = 'Received HTML error page';
          continue; // Try next URL
        }

        // Try to parse as JSON
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('✅ SUCCESS! JSON parsed successfully');
          console.log('📊 Data structure:', typeof data, Array.isArray(data) ? `Array[${data.length}]` : Object.keys(data));
        } catch (parseError) {
          console.log(`❌ JSON Parse Error: ${parseError.message}`);
          lastError = `JSON parse error: ${parseError.message}`;
          continue; // Try next URL
        }

        // Success! Format the response
        console.log(`🎉 WORKING ENDPOINT FOUND: ${apiUrl.substring(0, 80)}...`);
        
        // Handle different response structures
        let properties = [];
        if (Array.isArray(data)) {
          properties = data;
        } else if (data.properties && Array.isArray(data.properties)) {
          properties = data.properties;
        } else if (data.data && Array.isArray(data.data)) {
          properties = data.data;
        } else if (data.results && Array.isArray(data.results)) {
          properties = data.results;
        } else {
          console.log('📊 Unexpected data structure:', Object.keys(data));
          // Return the data as-is if we can't find a properties array
          properties = [data];
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
              workingUrl: apiUrl.substring(0, 100) + '...',
              timestamp: new Date().toISOString(),
              authMethod: 'SHA1',
              note: 'Using fetch method like your original working code'
            }
          })
        };

      } catch (fetchError) {
        console.log(`🌐 Fetch Error: ${fetchError.message}`);
        lastError = fetchError.message;
        continue; // Try next URL
      }
    }

    // If we get here, all URLs failed
    throw new Error(`All API URLs failed. Last error: ${lastError}`);

  } catch (error) {
    console.error('❌ All attempts failed:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'All Apimo API attempts failed',
        details: error.message,
        debug: {
          provider: providerId,
          agency: agencyId,
          timestamp: new Date().toISOString(),
          triedUrls: [
            'admin.website.apiwork.com/api/call...',
            'api.apimo.com/api/call...',
            'apimo.com/api/call...'
          ],
          note: 'Tried multiple hostnames due to SSL certificate mismatch'
        }
      })
    };
  }
};
