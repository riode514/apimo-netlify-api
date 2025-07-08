const fetch = require('node-fetch');
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  const apiKey = '68460111a25a4d1ba2508ead22a2b59e16cfcfcd';
  const providerId = '4352';
  const agencyId = '24985';
  const apiUrl = `https://api.apimo.pro/agencies/${agencyId}/properties`;
  
  // ✅ USE BASIC AUTH (was working before)
  const credentials = Buffer.from(`${providerId}:${apiKey}`).toString('base64');
  
  try {
    console.log('🔗 Fetching properties from Apimo...');
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,  // ← CHANGED BACK
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    // ... rest of your code
