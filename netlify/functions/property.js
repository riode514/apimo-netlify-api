const fetch = require('node-fetch');
const https = require('https');
const crypto = require('crypto');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const propertyId = event.path.split('/').pop();
  if (!propertyId || propertyId === 'property') {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Property ID is required' })
    };
  }

  const AGENCY_ID = '24985';
  const PROVIDER_ID = '4352';
  const API_KEY = '68460111a25a4d1ba2508ead22a2b59e16cfcfcd';
  const timestamp = Math.floor(Date.now() / 1000);
  const sha1 = crypto.createHash('sha1').update(API_KEY + timestamp).digest('hex');

  const agent = new https.Agent({ rejectUnauthorized: false });

  const url = `https://api.apimo.com/api/call?provider=${PROVIDER_ID}&agency=${AGENCY_ID}&timestamp=${timestamp}&sha1=${sha1}&method=getProperty&type=json&version=2&id=${propertyId}`;

  try {
    const response = await fetch(url, { method: 'GET', agent });
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`Apimo API returned ${response.status}: ${text}`);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('Invalid JSON from Apimo');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: data,
        metadata: {
          timestamp: new Date().toISOString(),
          propertyId,
          agency: AGENCY_ID,
          provider: PROVIDER_ID
        }
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        metadata: {
          timestamp: new Date().toISOString(),
          propertyId,
          agency: AGENCY_ID,
          provider: PROVIDER_ID
        }
      })
    };
  }
};
