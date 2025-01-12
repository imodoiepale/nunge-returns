import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { pin, password } = await request.json();

    // Validate required fields
    if (!pin || !password) {
      return NextResponse.json(
        { success: false, message: 'PIN and password are required' },
        { status: 400 }
      );
    }

    // Simple password validation - checking if password is "1234"
    const isValid = password === "1234";

    if (isValid) {
      return NextResponse.json({ 
        success: true, 
        message: 'Password validated successfully' 
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Password validation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
