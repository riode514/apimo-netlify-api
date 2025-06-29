// netlify/functions/properties.js - APIMO API ENDPOINT TESTER
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

  // Test multiple possible Apimo API endpoints
  const apiTests = [
    {
      name: 'Apimo Official API',
      hostname: 'api.apimo.net',
      path: '/agencies/24985/properties?provider_id=4352&limit=10',
      headers: { 'Accept': 'application/json' }
    },
    {
      name: 'Apimo Webservice',
      hostname: 'webservice.apimo.net', 
      path: '/agencies/24985/properties?provider_id=4352&limit=10',
      headers: { 'Accept': 'application/json' }
    },
    {
      name: 'Apimo Pro API',
      hostname: 'api.apimo.pro',
      path: '/agencies/24985/properties?provider_id=4352&limit=10',
      headers: { 'Accept': 'application/json' }
    },
    {
      name: 'Apimo Services',
      hostname: 'services.apimo.net',
      path: '/agencies/24985/properties?provider_id=4352&limit=10',
      headers: { 'Accept': 'application/json' }
    },
    {
      name: 'Apimo REST API',
      hostname: 'rest.apimo.net',
      path: '/agencies/24985/properties?provider_id=4352&limit=10',
      headers: { 'Accept': 'application/json' }
    },
    {
      name: 'Apimo API v1',
      hostname: 'api.apimo.net',
      path: '/v1/agencies/24985/properties?provider_id=4352&limit=10',
      headers: { 'Accept': 'application/json' }
    },
    {
      name: 'Apimo API v2',
      hostname: 'api.apimo.net',
      path: '/v2/agencies/24985/properties?provider_id=4352&limit=10',
      headers: { 'Accept': 'application/json' }
    },
    {
      name: 'Apimo Website API Path',
      hostname: 'apimo.net',
      path: '/api/agencies/24985/properties?provider_id=4352&limit=10',
      headers: { 'Accept': 'application/json' }
    }
  ];

  const results = [];

  for (const test of apiTests) {
    try {
      console.log(`Testing: ${test.name} - https://${test.hostname}${test.path}`);
      
      const result = await new Promise((resolve, reject) => {
        const options = {
          hostname: test.hostname,
          path: test.path,
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; PropertyBot/1.0)',
            ...test.headers
          },
          timeout: 5000
        };

        const req = https.request(options, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: data.substring(0, 500), // First 500 chars
              dataLength: data.length
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
            error: 'Request timeout after 5 seconds'
          });
        });

        req.end();
      });

      results.push({
        test: test.name,
        url: `https://${test.hostname}${test.path}`,
        ...result
      });

      // If we found a successful response, log it
      if (result.status === 200) {
        console.log(`SUCCESS with ${test.name}!`);
        console.log('Response preview:', result.data);
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

  // Check if any tests were successful
  const successfulTests = results.filter(r => r.status === 200);
  
  if (successfulTests.length > 0) {
    // We found working endpoint(s)!
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Found ${successfulTests.length} working API endpoint(s)!`,
        workingEndpoints: successfulTests,
        allResults: results,
        nextSteps: [
          "Use one of the working endpoints above",
          "Check if authentication is required",
          "Parse the response structure to get properties"
        ]
      })
    };
  } else {
    // No working endpoints found
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: "No working Apimo API endpoints found",
        allResults: results,
        recommendations: [
          "Check Apimo documentation at https://apimo.net/en/api/webservice/",
          "Contact Apimo support for correct API endpoint",
          "Verify your agency ID (24985) and provider ID (4352)",
          "Check if API key/authentication is required"
        ],
        debug: {
          agency_id: 24985,
          provider_id: 4352,
          tested_endpoints: apiTests.length,
          timestamp: new Date().toISOString()
        }
      })
    };
  }
};
