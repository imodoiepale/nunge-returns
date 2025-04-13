import { NextResponse } from 'next/server';
import databaseService from '@/lib/services/databaseService';

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { status = 'completed', errorMessage } = await request.json();
    
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