const fetch = require('node-fetch');
const https = require('https');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Apimo credentials
  const AGENCY_ID = '24985';
  const PROVIDER_ID = '4352';
  const API_KEY = '68460111a25a4d1ba2508ead22a2b59e16cfcfcd';

  // Generate authentication token
  const timestamp = Math.floor(Date.now() / 1000);
  const crypto = require('crypto');
  const sha1Hash = crypto.createHash('sha1')
                        .update(API_KEY + timestamp)
                        .digest('hex');

  // Configure fetch to ignore SSL certificate issues
  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  try {
    console.log('🔄 Fetching properties from Apimo...');

    // Use the v1 API endpoint
    const apiUrl = `https://api.apimo.pro/agencies/${AGENCY_ID}/properties`;
    
    console.log('📡 Requesting:', apiUrl);
    console.log('🔑 Auth:', {
      timestamp,
      sha1: sha1Hash.substring(0, 10) + '...',
      provider: PROVIDER_ID
    });

    const response = await fetch(apiUrl, {
      method: 'GET',
      agent,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEY,
        'X-PROVIDER-ID': PROVIDER_ID,
        'X-TIMESTAMP': timestamp.toString(),
        'X-SIGNATURE': sha1Hash
      }
    });

    console.log('📥 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('📄 Response preview:', responseText.substring(0, 200));

    if (!response.ok) {
      throw new Error(`Apimo API returned ${response.status}: ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ JSON Parse Error:', e);
      throw new Error('Invalid JSON response from Apimo API');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: data,
        metadata: {
          timestamp: new Date().toISOString(),
          agency: AGENCY_ID,
          provider: PROVIDER_ID,
          count: Array.isArray(data) ? data.length : 'unknown'
        }
      })
    };

  } catch (error) {
    console.error('❌ Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        metadata: {
          timestamp: new Date().toISOString(),
          agency: AGENCY_ID,
          provider: PROVIDER_ID
        }
      })
    };
  }
};
