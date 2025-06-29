// netlify/functions/property.js - CORRECT MOCK VERSION
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  console.log('MOCK API - Single property endpoint called');
  console.log('Method:', event.httpMethod);
  console.log('Path:', event.path);

  // Handle preflight OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return { 
      statusCode: 200, 
      headers, 
      body: '' 
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Method not allowed' 
      })
    };
  }

  try {
    // Extract property ID from path - FIXED
    const path = event.path || '';
    console.log('Full path:', path);
    
    const pathParts = path.split('/');
    let propertyId = pathParts[pathParts.length - 1];
    
    // Remove any file extensions
    propertyId = propertyId.replace(/\.(html|js|css)$/, '');
    
    console.log('MOCK API - Extracted property ID:', propertyId);
    
    if (!propertyId || propertyId === 'property' || propertyId === '') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Property ID is required',
          debug: { 
            path, 
            pathParts, 
            propertyId, 
            agency_id: 24985, 
            provider_id: 4352 
          }
        })
      };
    }

    // MOCK DATA - All available properties
    const mockProperties = {
      "24985001": {
        id: "24985001",
        title: "Luxury Apartment in Barcelona Center",
        price: { 
          value: 950000, 
          currency: "EUR",
          period: 1
        },
        city: { name: "Barcelona" },
        surface: 135,
        rooms: { bedrooms: 3, bathrooms: 2 },
        type: "apartment",
        description: "Stunning apartment in Barcelona's prestigious Eixample district with high ceilings, original features, and modern amenities. This property features parquet flooring, built-in wardrobes, air conditioning, and concierge service. Located just minutes from Passeig de Gràcia and excellent transport links.",
        pictures: [
          { url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" },
          { url: "https://images.unsplash.com/photo-1562663474-6cbb3eaa4d14?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" },
          { url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" }
        ],
        agency_id: 24985,
        provider_id: 4352
      },
      "24985002": {
        id: "24985002",
        title: "Modern Villa with Pool - Sitges",
        price: { 
          value: 1350000, 
          currency: "EUR",
          period: 1
        },
        city: { name: "Sitges" },
        surface: 280,
        rooms: { bedrooms: 4, bathrooms: 3 },
        type: "villa",
        description: "Contemporary villa in Sitges with private pool, landscaped garden and partial sea views. High-quality finishes throughout, open-plan living areas, and private garage for 2 cars. Located in quiet residential area, 10 minutes walk to the beach.",
        pictures: [
          { url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" },
          { url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" }
        ],
        agency_id: 24985,
        provider_id: 4352
      },
      "24985003": {
        id: "24985003",
        title: "Penthouse with Terrace - Gracia",
        price: { 
          value: 3200, 
          currency: "EUR", 
          period: 4
        },
        city: { name: "Barcelona" },
        surface: 150,
        rooms: { bedrooms: 2, bathrooms: 2 },
        type: "penthouse",
        description: "Exclusive penthouse in trendy Gracia neighborhood with spectacular 60m² terrace offering panoramic city views. Recently renovated with premium materials, designer kitchen, and smart home technology. Perfect for entertaining with outdoor kitchen on terrace.",
        pictures: [
          { url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" },
          { url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" }
        ],
        agency_id: 24985,
        provider_id: 4352
      },
      "24985004": {
        id: "24985004",
        title: "Historic Townhouse - Gothic Quarter",
        price: { 
          value: 750000, 
          currency: "EUR",
          period: 1
        },
        city: { name: "Barcelona" },
        surface: 90,
        rooms: { bedrooms: 2, bathrooms: 1 },
        type: "house",
        description: "Charming historic townhouse in the heart of Gothic Quarter with original medieval features including stone walls and vaulted ceilings. Fully renovated while preserving historic character. Small private patio and roof terrace with cathedral views.",
        pictures: [
          { url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" }
        ],
        agency_id: 24985,
        provider_id: 4352
      },
      "24985005": {
        id: "24985005",
        title: "Beachfront Apartment - Barceloneta",
        price: { 
          value: 2800, 
          currency: "EUR", 
          period: 4
        },
        city: { name: "Barcelona" },
        surface: 95,
        rooms: { bedrooms: 2, bathrooms: 1 },
        type: "apartment",
        description: "Beautiful beachfront apartment with direct sea access and stunning Mediterranean views from every room. Completely renovated with high-end finishes, floor-to-ceiling windows, and private balcony overlooking the beach. Walking distance to best seafood restaurants.",
        pictures: [
          { url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" },
          { url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" }
        ],
        agency_id: 24985,
        provider_id: 4352
      },
      // Support the original ID that was causing errors
      "86043159": {
        id: "86043159",
        title: "Luxury Apartment in Barcelona Center",
        price: { 
          value: 850000, 
          currency: "EUR",
          period: 1
        },
        city: { name: "Barcelona" },
        surface: 120,
        rooms: { bedrooms: 3, bathrooms: 2 },
        type: "apartment",
        description: "Beautiful luxury apartment in the heart of Barcelona with stunning city views and premium finishes.",
        pictures: [
          { url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" }
        ],
        agency_id: 24985,
        provider_id: 4352
      }
    };

    const property = mockProperties[propertyId];
    
    if (!property) {
      console.log('MOCK API - Property not found:', propertyId);
      console.log('Available IDs:', Object.keys(mockProperties));
      
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Property with ID ${propertyId} not found`,
          availableIds: Object.keys(mockProperties),
          debug: { 
            agency_id: 24985, 
            provider_id: 4352,
            requestedId: propertyId
          }
        })
      };
    }

    console.log(`MOCK API - Returning property data for ID: ${propertyId}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: property,
        message: "MOCK DATA - Working perfectly! Replace with real Apimo API when ready.",
        debug: {
          propertyId,
          agency_id: 24985,
          provider_id: 4352,
          timestamp: new Date().toISOString(),
          note: "This is mock data that works immediately"
        }
      })
    };

  } catch (error) {
    console.error('MOCK API Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Mock API error: ' + error.message,
        debug: {
          timestamp: new Date().toISOString(),
          path: event.path,
          agency_id: 24985,
          provider_id: 4352
        }
      })
    };
  }
};
