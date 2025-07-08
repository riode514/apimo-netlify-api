// netlify/functions/property.js
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
    // Get property ID from query parameters
    const { queryStringParameters = {} } = event;
    const { id } = queryStringParameters;

    if (!id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Property ID is required'
        })
      };
    }

    // Sample property data - replace with your actual data source
    const properties = {
      '1': {
        id: 1,
        title: "Modern Villa in Barcelona",
        price: "€450,000",
        location: "Barcelona, Spain",
        bedrooms: 3,
        bathrooms: 2,
        size: "120m²",
        yearBuilt: 2020,
        description: "Beautiful modern villa with stunning views and high-end finishes. Perfect for families looking for luxury living in the heart of Barcelona.",
        features: ["Swimming Pool", "Garden", "Garage", "Air Conditioning", "Modern Kitchen"],
        images: [
          "/assets/images/property1-1.jpg",
          "/assets/images/property1-2.jpg", 
          "/assets/images/property1-3.jpg"
        ],
        agent: {
          name: "Maria Rodriguez",
          phone: "+34 123 456 789",
          email: "maria@veryonewebsite.com"
        }
      },
      '2': {
        id: 2,
        title: "Coastal Apartment",
        price: "€320,000",
        location: "Valencia, Spain",
        bedrooms: 2,
        bathrooms: 1,
        size: "85m²",
        yearBuilt: 2018,
        description: "Charming coastal apartment with sea views. Recently renovated with modern amenities while maintaining its Mediterranean charm.",
        features: ["Sea View", "Balcony", "Near Beach", "Renovated", "Parking"],
        images: [
          "/assets/images/property2-1.jpg",
          "/assets/images/property2-2.jpg"
        ],
        agent: {
          name: "Carlos Martinez",
          phone: "+34 987 654 321",
          email: "carlos@veryonewebsite.com"
        }
      },
      '3': {
        id: 3,
        title: "Historic Townhouse",
        price: "€580,000",
        location: "Madrid, Spain",
        bedrooms: 4,
        bathrooms: 3,
        size: "160m²",
        yearBuilt: 1925,
        description: "Beautifully restored historic townhouse in the heart of Madrid. Combines original architectural details with modern conveniences.",
        features: ["Historic Building", "Original Features", "City Center", "Restored", "Terrace"],
        images: [
          "/assets/images/property3-1.jpg",
          "/assets/images/property3-2.jpg",
          "/assets/images/property3-3.jpg",
          "/assets/images/property3-4.jpg"
        ],
        agent: {
          name: "Ana Lopez",
          phone: "+34 555 123 456",
          email: "ana@veryonewebsite.com"
        }
      }
    };

    const property = properties[id];

    if (!property) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Property not found'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        property: property
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch property',
        details: error.message
      })
    };
  }
};
