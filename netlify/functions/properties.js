// Save as: netlify/functions/properties.js

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Your exact Apimo credentials from support
  const providerId = '4352';
  const agencyId = '24985';  // From Apimo support
  const apiKey = '68460111a25a4d1ba2508ead22a2b59e16cfcfcd';
  
  // Generate SHA1 authentication + try original format with agency ID
  const timestamp = Math.floor(Date.now() / 1000);
  const crypto = require('crypto');
  const sha1Hash = crypto.createHash('sha1').update(apiKey + timestamp).digest('hex');
  
  // Try both new REST format and old Joel Lipman format
  const apiEndpoints = [
    // Original Joel Lipman format with agency ID
    `https://api.apimo.com/api/call?provider=${providerId}&timestamp=${timestamp}&sha1=${sha1Hash}&method=getProperties&type=json&version=2&agency=${agencyId}&limit=50`,
    
    // Maybe apimo.pro domain
    `https://api.apimo.pro/agencies/${agencyId}/properties?provider=${providerId}`,
    
    // Maybe different webservice subdomain
    `https://webservice.apimo.net/agencies/${agencyId}/properties?provider=${providerId}`,
    
    // Try with basic auth instead of Bearer
    `https://apimo.net/webservice/api/agencies/${agencyId}/properties?provider=${providerId}`,
    
    // Maybe the endpoint needs to be POST instead of GET
    `https://apimo.net/api/agencies/${agencyId}/properties`
  ];

  try {
    let lastError = null;
    
    // Try each endpoint variation with different auth methods
    for (let i = 0; i < apiEndpoints.length; i++) {
      const apiUrl = apiEndpoints[i];
      
      // Try different authentication methods for each endpoint
      const authMethods = [
        // Bearer token
        {
          name: 'Bearer',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Netlify-Apimo-Proxy/1.0'
          }
        },
        // Basic auth
        {
          name: 'Basic',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${providerId}:${apiKey}`).toString('base64')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Netlify-Apimo-Proxy/1.0'
          }
        },
        // No auth (for endpoints that include auth in URL)
        {
          name: 'URL-based',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Netlify-Apimo-Proxy/1.0'
          }
        }
      ];

      for (const authMethod of authMethods) {
        try {
          console.log(`🔗 Trying endpoint ${i+1}/${apiEndpoints.length} with ${authMethod.name} auth: ${apiUrl.substring(0, 80)}...`);

          // Make the API call
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: authMethod.headers
          });

          const responseText = await response.text();
          console.log(`📦 Response: ${response.status} with ${authMethod.name} auth`);

          if (!response.ok) {
            // Check if it's a different kind of error (not the "free trial" page)
            if (!responseText.includes('Demandez un essai gratuit') && !responseText.includes('<!DOCTYPE html>')) {
              console.log(`🔍 Different error type: ${responseText.substring(0, 200)}`);
            }
            continue; // Try next auth method
          }

          // Try to parse as JSON
          let data;
          try {
            data = JSON.parse(responseText);
            console.log('✅ SUCCESS! JSON response from:', apiUrl.substring(0, 80), 'with', authMethod.name, 'auth');
          } catch (parseError) {
            console.log(`❌ JSON Parse Error with ${authMethod.name} auth:`, parseError.message);
            continue; // Try next auth method
          }

          // Success! Return the data
          console.log(`🎉 WORKING ENDPOINT FOUND!`);
          console.log(`📊 Data structure:`, typeof data, Array.isArray(data) ? `Array[${data.length}]` : Object.keys(data));
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              data: data,
              metadata: {
                provider: providerId,
                agency: agencyId,
                workingEndpoint: apiUrl,
                workingAuthMethod: authMethod.name,
                timestamp: new Date().toISOString(),
                propertiesCount: Array.isArray(data) ? data.length : (data.properties ? data.properties.length : 'unknown')
              }
            })
          };

        } catch (fetchError) {
          console.log(`🌐 Network Error with ${authMethod.name} auth:`, fetchError.message);
          lastError = {
            error: 'Network Error',
            endpoint: apiUrl,
            authMethod: authMethod.name,
            details: fetchError.message
          };
          continue; // Try next auth method
        }
      }
    }

    // If we get here, all endpoints failed
    console.error('❌ All API endpoint variations failed');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'All Apimo API endpoint variations failed',
        details: lastError ? JSON.stringify(lastError, null, 2) : 'No endpoints worked',
        triedEndpoints: apiEndpoints,
        provider: providerId,
        agency: agencyId,
        note: 'Tried multiple variations of the official endpoint format'
      })
    };

  } catch (error) {
    console.error('❌ Server Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Server error while calling Apimo API',
        details: error.message,
        provider: providerId,
        agency: agencyId,
        endpoint: apiUrl,
        note: 'Using official Apimo support format'
      })
    };
  }
};
