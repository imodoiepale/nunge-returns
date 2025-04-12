import { NextResponse } from 'next/server';
import databaseService from '@/lib/services/databaseService';
import { userSchema } from '@/lib/schemas';

// GET /api/users/:id
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const result = await databaseService.getUserById(userId);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/users
export async function POST(request) {
  try {
    const body = await request.json();
    
    try {
      // Validate request body against schema
      userSchema.parse(body);
    } catch (validationError) {
      return NextResponse.json({ error: validationError.errors }, { status: 400 });
    }
    
    const result = await databaseService.createUser(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/users/:id
export async function PATCH(request) {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();
    const body = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    try {
      // Validate request body against schema (partial validation)
      userSchema.partial().parse(body);
    } catch (validationError) {
      return NextResponse.json({ error: validationError.errors }, { status: 400 });
    }
    
    const result = await databaseService.updateUser(userId, body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
