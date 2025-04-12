import { NextResponse } from 'next/server';
import databaseService from '@/lib/services/databaseService';
import { 
  individualReturnSchema, 
  businessReturnSchema, 
  corporateReturnSchema 
} from '@/lib/schemas';

// GET /api/returns/:id
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.split('/');
    const returnId = path[path.length - 1];
    
    // If the path includes "user", get returns by user ID
    if (path.includes('user')) {
      const userId = returnId;
      
      if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
      }
      
      const result = await databaseService.getReturnsByUserId(userId);
      
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
      
      return NextResponse.json(result.data);
    }
    
    // Otherwise, get return by ID
    if (!returnId) {
      return NextResponse.json({ error: 'Return ID is required' }, { status: 400 });
    }
    
    const result = await databaseService.getReturnById(returnId);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error getting return:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/returns
export async function POST(request) {
  try {
    const body = await request.json();
    
    try {
      // Validate request body against appropriate schema based on return type
      if (body.return_type === 'individual') {
        individualReturnSchema.parse(body);
      } else if (body.return_type === 'business') {
        businessReturnSchema.parse(body);
      } else if (body.return_type === 'corporate') {
        corporateReturnSchema.parse(body);
      } else {
        return NextResponse.json({ error: 'Invalid return type' }, { status: 400 });
      }
    } catch (validationError) {
      return NextResponse.json({ error: validationError.errors }, { status: 400 });
    }
    
    const result = await databaseService.createReturn(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('Error creating return:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/returns/:id/status
export async function PATCH(request) {
  try {
    const url = new URL(request.url);
    const path = url.pathname.split('/');
    const returnId = path[path.length - 2]; // ID is second-to-last in path for status updates
    const { status } = await request.json();
    
    if (!returnId) {
      return NextResponse.json({ error: 'Return ID is required' }, { status: 400 });
    }
    
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }
    
    const result = await databaseService.updateReturnStatus(returnId, status);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error updating return status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
