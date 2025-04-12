import { NextResponse } from 'next/server';
import databaseService from '@/lib/services/databaseService';

// GET /api/admin/dashboard
export async function GET(request) {
  try {
    // Check if user has admin role (this would typically be done with authentication middleware)
    // For now, we'll assume the request is authenticated
    
    const result = await databaseService.getAdminDashboardData();
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error getting admin dashboard data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
