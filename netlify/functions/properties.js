// netlify/functions/properties.js - APIMO AUTHENTICATION TESTER
const https = require('https');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

  // Test different authentication methods with api.apimo.pro
  const authTests = [
    {
      name: 'Token in URL parameter',
      hostname: 'api.apimo.pro',
      path: '/agencies/24985/properties?provider_id=4352&token=24985_4352&limit=5',
      headers: { 'Accept': 'application/json' }
    },
    {
      name: 'API Key in URL parameter',
      hostname: 'api.apimo.pro',
      path: '/agencies/24985/properties?provider_id=4352&api_key=24985_4352&limit=5',
      headers: { 'Accept': 'application/json' }
    },
    {
      name: 'Token in URL (agency_id)',
      hostname: 'api.apimo.pro',
      path: '/agencies/24985/properties?provider_id=4352&token=24985&limit=5',
      headers: { 'Accept': 'application/json' }
    },
    {
      name: 'Token in URL (provider_id)',
      hostname: 'api.apimo.pro',
      path: '/agencies/24985/properties?provider_id=4352&token=4352&limit=5',
      headers: { 'Accept': 'application/json' }
    },
    {
      name: 'Authorization header (Bearer)',
      hostname: 'api.apimo.pro',
      path: '/agencies/24985/properties?provider_id=4352&limit=5',
      headers: { 
        'Accept': 'application/json',
        'Authorization': 'Bearer 24985_4352'
      }
    },
    {
      name: 'Authorization header (Token)',
      hostname: 'api.apimo.pro',
      path: '/agencies/24985/properties?provider_id=4352&limit=5',
      headers: { 
        'Accept': 'application/json',
        'Authorization': 'Token 24985_4352'
      }
    },
    {
      name: 'Basic Auth (agency:provider)',
      hostname: 'api.apimo.pro',
      path: '/agencies/24985/properties?provider_id=4352&limit=5',
      headers: { 
        'Accept': 'application/json',
        'Authorization': 'Basic ' + Buffer.from('24985:4352').toString('base64')
      }
    },
    {
      name: 'API Key header',
      hostname: 'api.apimo.pro',
      path: '/agencies/24985/properties?provider_id=4352&limit=5',
      headers: { 
        'Accept': 'application/json',
        'X-API-Key': '24985_4352'
      }
    },
    {
      name: 'Token header',
      hostname: 'api.apimo.pro',
      path: '/agencies/24985/properties?provider_id=4352&limit=5',
      headers: { 
        'Accept': 'application/json',
        'X-Token': '24985_4352'
      }
    }
  ];

  const results = [];

  for (const test of authTests) {
    try {
      console.log(`Testing: ${test.name} - https://${test.hostname}${test.path}`);
      
      const result = await new Promise((resolve, reject) => {
        const options = {
          hostname: test.hostname,
          path: test.path,
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; PropertyBot/1.0)',
            ...test.headers
          },
          timeout: 8000
        };

        const req = https.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            let parsedData = null;
            try {
              parsedData = JSON.parse(data);
            } catch (e) {
              // Not JSON, keep as string
            }
            
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: data.substring(0, 500), // First 500 chars
              dataLength: data.length,
              isJson: parsedData !== null,
              parsedData: parsedData
            });
          });
        });

        req.on('error', (error) => {
          resolve({
            status: 'ERROR',
            error: error.message
          });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({
            status: 'TIMEOUT',
            error: 'Request timeout after 8 seconds'
          });
        });

        req.end();
      });

      results.push({
        test: test.name,
        authMethod: test.headers,
        url: `https://${test.hostname}${test.path}`,
        ...result
      });

      // If we found a successful response, log it
      if (result.status === 200) {
        console.log(`SUCCESS with ${test.name}!`);
        console.log('Response preview:', result.data);
        
        // If it's JSON and has properties, we found the right method!
        if (result.isJson && (
          result.parsedData.properties || 
          result.parsedData.data || 
          Array.isArray(result.parsedData)
        )) {
          console.log('FOUND PROPERTIES! This is the correct authentication method.');
        }
      } else if (result.status !== 400) {
        // Any non-400 status is interesting (400 = still needs token)
        console.log(`Interesting response from ${test.name}: ${result.status}`);
      }

    } catch (error) {
      results.push({
        test: test.name,
        url: `https://${test.hostname}${test.path}`,
        status: 'EXCEPTION',
        error: error.message
      });
    }
  }

  // Check for successful authentication
  const successfulTests = results.filter(r => r.status === 200);
  const unauthorizedTests = results.filter(r => r.status === 401);
  const stillNeedTokenTests = results.filter(r => 
    r.status === 400 && 
    r.data && 
    r.data.includes('token')
  );

  if (successfulTests.length > 0) {
    // We found working authentication!
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Found ${successfulTests.length} working authentication method(s)!`,
        workingMethods: successfulTests,
        allResults: results,
        nextSteps: [
          "Use one of the working authentication methods above",
          "Parse the response structure to get properties",
          "Update your main properties function"
        ]
      })
    };
  } else {
    // No working authentication found
    const summary = {
      total_tests: results.length,
      still_need_token: stillNeedTokenTests.length,
      unauthorized: unauthorizedTests.length,
      errors: results.filter(r => r.status === 'ERROR').length,
      other_status: results.filter(r => 
        typeof r.status === 'number' && 
        r.status !== 200 && 
        r.status !== 400 && 
        r.status !== 401
      ).length
    };

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: "No working authentication method found",
        summary: summary,
        allResults: results,
        recommendations: [
          "Contact Apimo support for the correct API token/key",
          "Ask for the exact authentication method (header vs URL parameter)",
          "Request API documentation with examples",
          "Verify if a separate registration/token generation step is needed"
        ],
        debug: {
          api_endpoint: "api.apimo.pro (confirmed working)",
          agency_id: 24985,
          provider_id: 4352,
          tested_auth_methods: authTests.length,
          timestamp: new Date().toISOString()
        }
      })
    };
  }
};
