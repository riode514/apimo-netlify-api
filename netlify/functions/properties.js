// netlify/functions/properties.js
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

  try {
    // Intentar obtener datos reales de Apimo
    const token = '68460111a25a4d1ba2508ead22a2b59e16cfcfcd';
    const agencyId = '24985';
    const apiUrl = `https://api.apimo.pro/agencies/${agencyId}/properties`;
    
    console.log('Trying Apimo API...');
    
    // El error dice "Please provide the token" - probemos diferentes formatos
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,  // Formato "Token" en lugar de "Bearer"
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const apiData = await response.json();
      console.log('
