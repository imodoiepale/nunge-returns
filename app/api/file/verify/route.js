import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * Handles document verification requests
 * @param {Request} request - The incoming request
 * @returns {Promise<NextResponse>} - The response
 */
export async function POST(request) {
  try {
    const { documentId, verifiedBy, verifiedAt } = await request.json();
    
    // Validate required fields
    if (!documentId) {
      return NextResponse.json({
        success: false,
        message: 'Document ID is required'
      }, { status: 400 });
    }
    
    // Get document details first
    const { data: documentData, error: getError } = await supabase
      .from('return_documents')
      .select('*')
      .eq('id', documentId)
      .single();
    
    if (getError) {
      console.error('Error retrieving document:', getError);
      return NextResponse.json({
        success: false,
        message: 'Failed to retrieve document',
        error: getError.message
      }, { status: 500 });
    }
    
    if (!documentData) {
      return NextResponse.json({
        success: false,
        message: 'Document not found'
      }, { status: 404 });
    }
    
    // Update document verification status
    const { data, error } = await supabase
      .from('return_documents')
      .update({
        is_verified: true,
        verified_by: verifiedBy || 'admin',
        verified_at: verifiedAt || new Date().toISOString()
      })
      .eq('id', documentId)
      .select();
    
    if (error) {
      console.error('Error verifying document:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to verify document',
        error: error.message
      }, { status: 500 });
    }
    
    // Add entry to return history
    const { error: historyError } = await supabase
      .from('return_history')
      .insert([{
        return_id: documentData.return_id,
        action: 'document_verified',
        description: `Document "${documentData.document_name}" (${documentData.document_type}) was verified`,
        performed_by_email: verifiedBy || 'admin',
        performed_by_name: 'Administrator',
        performed_at: verifiedAt || new Date().toISOString(),
        metadata: {
          document_id: documentId,
          document_type: documentData.document_type,
          file_name: documentData.document_name
        }
      }]);
    
    if (historyError) {
      console.error('Error adding history record:', historyError);
      // Don't fail the request if this update fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'Document verified successfully',
      data: data[0]
    });
  } catch (error) {
    console.error('Error verifying document:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to verify document',
      error: error.message
    }, { status: 500 });
  }
}
