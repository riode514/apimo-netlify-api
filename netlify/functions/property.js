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

    try {
        // Your exact Apimo credentials
        const providerId = '4352';
        const agencyId = '24985';
        const apiKey = '68460111a25a4d1ba2508ead22a2b59e16cfcfcd';
        
        // Generate SHA1 authentication
        const timestamp = Math.floor(Date.now() / 1000);
        const crypto = require('crypto');
        const sha1Hash = crypto.createHash('sha1').update(apiKey + timestamp).digest('hex');
        
        // Define the main API endpoint
        const apiUrl = `https://api.apimo.pro/agencies/${agencyId}/properties`;

        console.log('🔗 Making API request to:', apiUrl);

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Apimo-Provider': providerId,
                'X-Apimo-Timestamp': timestamp.toString(),
                'X-Apimo-Signature': sha1Hash,
                'User-Agent': 'Netlify-Apimo-Proxy/1.0'
            }
        });

        const data = await response.json();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: data,
                timestamp: new Date().toISOString(),
                user: 'riode514'
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
                timestamp: new Date().toISOString(),
                user: 'riode514'
            })
        };
    }
};
