import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { company_name, kra_pin, kra_password } = await request.json();

    // Validate required fields
    if (!kra_pin || !kra_password) {
      return NextResponse.json(
        { success: false, message: 'KRA PIN and password are required' },
        { status: 400 }
      );
    }

    console.log(`Validating credentials for PIN: ${kra_pin}, Company: ${company_name || 'Not provided'}`);

    // Make a request to the external API for validation
    try {
      // Log the request being made
      console.log('Making request to external API with data:', JSON.stringify({
        company_name: company_name || '',
        kra_pin,
        kra_password: '***' // Don't log the actual password
      }));
      
      // Use the correct URL from the error message and remove timeout
      const response = await fetch('https://kra-apis-production.up.railway.app/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name: company_name || '', 
          kra_pin,
          kra_password,
        }),
      });

      console.log('External API response status:', response.status, response.statusText);

      if (!response.ok) {
        console.error(`External API request failed with status ${response.status}`);
        
        // Handle different HTTP error codes
        if (response.status === 404) {
          return NextResponse.json(
            { success: false, message: 'KRA validation service not found. Please check the API endpoint URL.', status: 'Error' },
            { status: 502 }
          );
        } else if (response.status === 429) {
          return NextResponse.json(
            { success: false, message: 'Too many requests to KRA system, please try again later', status: 'Error' },
            { status: 429 }
          );
        } else {
          return NextResponse.json(
            { success: false, message: `KRA system returned error: ${response.statusText}`, status: 'Error' },
            { status: 502 }
          );
        }
      }

      // Parse the response
      let responseData;
      try {
        responseData = await response.json();
        console.log('External API response:', JSON.stringify(responseData));
      } catch (parseError) {
        console.error('Failed to parse response from external API:', parseError);
        return NextResponse.json(
          { success: false, message: 'Invalid response from KRA system', status: 'Error' },
          { status: 502 }
        );
      }
      
      // Check if the response has the expected structure
      if (responseData.status === 'success' && responseData.data) {
        const data = responseData.data;
        
        // Format the response based on the external API response
        if (data.status === 'Valid' && data.message === 'Login successful') {
          return NextResponse.json({ 
            success: true, 
            message: data.message,
            status: data.status,
            timestamp: data.timestamp || new Date().toISOString(),
            company_name: data.company_name || company_name || '',
            kra_pin: data.kra_pin || kra_pin
          });
        } else {
          // Return more detailed error information
          return NextResponse.json(
            { 
              success: false, 
              message: data.message || 'Invalid credentials',
              status: data.status || 'Invalid',
              timestamp: data.timestamp || new Date().toISOString()
            },
            { status: 401 }
          );
        }
      } else {
        // For direct response format (not nested)
        if (responseData.status === 'Valid' && responseData.message === 'Login successful') {
          return NextResponse.json({ 
            success: true, 
            message: responseData.message,
            status: responseData.status,
            timestamp: responseData.timestamp || new Date().toISOString(),
            company_name: responseData.company_name || company_name || '',
            kra_pin: responseData.kra_pin || kra_pin
          });
        }
        
        // Handle unexpected response format
        console.error('Unexpected response format from external API:', responseData);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Unexpected response format from KRA system',
            status: 'Error'
          },
          { status: 502 }
        );
      }
    } catch (apiError) {
      console.error('External API error:', apiError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to validate credentials with KRA system',
          error: apiError.message,
          status: 'Error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Password validation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error.message,
        status: 'Error'
      },
      { status: 500 }
    );
  }
}
