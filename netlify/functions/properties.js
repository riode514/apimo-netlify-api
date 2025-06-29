// netlify/functions/properties.js - TEMPORARY MOCK VERSION
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

  try {
    console.log('Returning mock properties data (Agency 24985, Provider 4352)...');
    
    // Mock data based on your Apimo structure
    const mockProperties = [
      {
        id: "24985001",
        title: "Luxury Apartment in Barcelona Center",
        price: { value: 950000, currency: "EUR" },
        city: { name: "Barcelona" },
        surface: 135,
        rooms: { bedrooms: 3, bathrooms: 2 },
        type: "apartment",
        description: "Stunning apartment in Barcelona's prestigious Eixample district with high ceilings and original features.",
        pictures: [
          { url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" },
          { url: "https://images.unsplash.com/photo-1562663474-6cbb3eaa4d14?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" }
        ],
        agency_id: 24985,
        provider_id: 4352
      },
      {
        id: "24985002", 
        title: "Modern Villa with Pool - Sitges",
        price: { value: 1350000, currency: "EUR" },
        city: { name: "Sitges" },
        surface: 280,
        rooms: { bedrooms: 4, bathrooms: 3 },
        type: "villa",
        description: "Contemporary villa in Sitges with private pool, garden and sea views.",
        pictures: [
          { url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" }
        ],
        agency_id: 24985,
        provider_id: 4352
      },
      {
        id: "24985003",
        title: "Penthouse with Terrace - Gracia",
        price: { value: 3200, currency: "EUR", period: "month" },
        city: { name: "Barcelona" },
        surface: 150,
        rooms: { bedrooms: 2, bathrooms: 2 },
        type: "penthouse",
        description: "Exclusive penthouse in Gracia with 60m² terrace and panoramic city views.",
        pictures: [
          { url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" }
        ],
        agency_id: 24985,
        provider_id: 4352
      },
      {
        id: "24985004",
        title: "Historic Townhouse - Gothic Quarter",
        price: { value: 750000, currency: "EUR" },
        city: { name: "Barcelona" },
        surface: 90,
        rooms: { bedrooms: 2, bathrooms: 1 },
        type: "house",
        description: "Charming historic townhouse in the Gothic Quarter with original medieval features.",
        pictures: [
          { url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" }
        ],
        agency_id: 24985,
        provider_id: 4352
      },
      {
        id: "24985005",
        title: "Beachfront Apartment - Barceloneta",
        price: { value: 2800, currency: "EUR", period: "month" },
        city: { name: "Barcelona" },
        surface: 95,
        rooms: { bedrooms: 2, bathrooms: 1 },
        type: "apartment",
        description: "Beautiful beachfront apartment with direct sea access and stunning Mediterranean views.",
        pictures: [
          { url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" }
        ],
        agency_id: 24985,
        provider_id: 4352
      }
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: { properties: mockProperties },
        count: mockProperties.length,
        note: "MOCK DATA - Replace with real Apimo API once correct endpoint is found",
        debug: {
          agency_id: 24985,
          provider_id: 4352,
          timestamp: new Date().toISOString(),
          message: "Using mock data while real API endpoint is being determined"
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
        debug: { agency_id: 24985, provider_id: 4352 }
      })
    };
  }
};
