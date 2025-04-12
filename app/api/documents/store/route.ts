import { NextRequest, NextResponse } from 'next/server';
import databaseService from '@/lib/services/databaseService';

export async function POST(request: NextRequest) {
  try {
    const documentData = await request.json();
    
    // Validate required fields
    if (!documentData.userId || !documentData.documentType || !documentData.filePath) {
      return NextResponse.json({
        success: false,
        message: 'Missing required document data'
      }, { status: 400 });
    }
    
    // Store document data in database
    const result = await databaseService.storeDocumentData(documentData);
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: 'Failed to store document data',
        error: result.error
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Document data stored successfully',
      data: result.data
    });
    
  } catch (error) {
    console.error('Error storing document data:', error);
    return NextResponse.json({
      success: false,
      message: 'Server error while storing document data'
    }, { status: 500 });
  }
}
