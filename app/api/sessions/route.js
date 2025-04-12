import { NextResponse } from 'next/server';
import databaseService from '@/lib/services/databaseService';
import { sessionSchema } from '@/lib/schemas';

// GET /api/sessions/:id
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.pathname.split('/').pop();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    const result = await databaseService.getSessionById(sessionId);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/sessions
export async function POST(request) {
  try {
    const body = await request.json();
    
    try {
      // Validate request body against schema
      sessionSchema.parse(body);
    } catch (validationError) {
      return NextResponse.json({ error: validationError.errors }, { status: 400 });
    }
    
    const result = await databaseService.createSession(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/sessions/:id
export async function PATCH(request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.pathname.split('/').pop();
    const body = await request.json();
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    try {
      // Validate request body against schema (partial validation)
      sessionSchema.partial().parse(body);
    } catch (validationError) {
      return NextResponse.json({ error: validationError.errors }, { status: 400 });
    }
    
    const result = await databaseService.updateSession(sessionId, body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/sessions/:id/complete
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const { status = 'completed', errorMessage } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    const result = await databaseService.completeSession(id, status, errorMessage);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error completing session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
