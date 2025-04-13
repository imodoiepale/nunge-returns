import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * Handles file upload requests
 * @param {Request} request - The incoming request
 * @returns {Promise<NextResponse>} - The response
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const returnId = formData.get('returnId');
    const documentType = formData.get('documentType');
    const description = formData.get('description');
    
    // Validate required fields
    if (!file || !returnId || !documentType) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: file, returnId, and documentType are required'
      }, { status: 400 });
    }
    
    // Get file details
    const fileName = file.name;
    const fileSize = file.size;
    const fileType = file.type;
    const fileBuffer = await file.arrayBuffer();
    
    // Generate a unique file path
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop();
    const filePath = `returns/${returnId}/${documentType}_${timestamp}.${fileExtension}`;
    
    // Upload file to Supabase Storage
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('documents')
      .upload(filePath, fileBuffer, {
        contentType: fileType,
        cacheControl: '3600'
      });
    
    if (storageError) {
      console.error('Error uploading file to storage:', storageError);
      return NextResponse.json({
        success: false,
        message: 'Failed to upload file',
        error: storageError.message
      }, { status: 500 });
    }
    
    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase
      .storage
      .from('documents')
      .getPublicUrl(filePath);
    
    // Store document metadata in the database
    const { data: documentData, error: documentError } = await supabase
      .from('return_documents')
      .insert([{
        return_id: returnId,
        document_type: documentType,
        document_name: fileName,
        document_url: publicUrl,
        uploaded_at: new Date().toISOString(),
        file_size: fileSize,
        file_type: fileType,
        description: description || null,
        is_verified: false
      }])
      .select();
    
    if (documentError) {
      console.error('Error storing document metadata:', documentError);
      return NextResponse.json({
        success: false,
        message: 'Failed to store document metadata',
        error: documentError.message
      }, { status: 500 });
    }
    
    // Update the return record to indicate document was added
    const { error: returnUpdateError } = await supabase
      .from('returns')
      .update({ 
        updated_at: new Date().toISOString() 
      })
      .eq('id', returnId);
    
    if (returnUpdateError) {
      console.error('Error updating return record:', returnUpdateError);
      // Don't fail the request if this update fails
    }
    
    // Add entry to return history
    const { error: historyError } = await supabase
      .from('return_history')
      .insert([{
        return_id: returnId,
        action: 'document_added',
        description: `Document "${fileName}" (${documentType}) was uploaded`,
        performed_by_email: formData.get('userEmail') || 'system',
        performed_by_name: formData.get('userName') || 'System',
        performed_at: new Date().toISOString(),
        metadata: {
          document_id: documentData[0].id,
          document_type: documentType,
          file_name: fileName,
          file_size: fileSize
        }
      }]);
    
    if (historyError) {
      console.error('Error adding history record:', historyError);
      // Don't fail the request if this update fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        document: documentData[0],
        url: publicUrl
      }
    });
  } catch (error) {
    console.error('Error processing file upload:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to process file upload',
      error: error.message
    }, { status: 500 });
  }
}

/**
 * Handles file retrieval requests
 * @param {Request} request - The incoming request
 * @returns {Promise<NextResponse>} - The response
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const returnId = url.searchParams.get('returnId');
    const documentId = url.searchParams.get('documentId');
    
    if (!returnId && !documentId) {
      return NextResponse.json({
        success: false,
        message: 'Either returnId or documentId is required'
      }, { status: 400 });
    }
    
    let query = supabase
      .from('return_documents')
      .select('*');
    
    if (documentId) {
      query = query.eq('id', documentId);
    } else if (returnId) {
      query = query.eq('return_id', returnId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error retrieving documents:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to retrieve documents',
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error retrieving documents:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve documents',
      error: error.message
    }, { status: 500 });
  }
}

/**
 * Handles file deletion requests
 * @param {Request} request - The incoming request
 * @returns {Promise<NextResponse>} - The response
 */
export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const documentId = url.searchParams.get('documentId');
    
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
    
    // Extract file path from the URL
    const fileUrl = new URL(documentData.document_url);
    const pathParts = fileUrl.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf('documents') + 1).join('/');
    
    // Delete file from storage
    const { error: storageError } = await supabase
      .storage
      .from('documents')
      .remove([filePath]);
    
    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
    }
    
    // Delete document record from database
    const { error: dbError } = await supabase
      .from('return_documents')
      .delete()
      .eq('id', documentId);
    
    if (dbError) {
      console.error('Error deleting document record:', dbError);
      return NextResponse.json({
        success: false,
        message: 'Failed to delete document record',
        error: dbError.message
      }, { status: 500 });
    }
    
    // Add entry to return history
    const { error: historyError } = await supabase
      .from('return_history')
      .insert([{
        return_id: documentData.return_id,
        action: 'document_deleted',
        description: `Document "${documentData.document_name}" (${documentData.document_type}) was deleted`,
        performed_by_email: request.url.searchParams.get('userEmail') || 'system',
        performed_by_name: request.url.searchParams.get('userName') || 'System',
        performed_at: new Date().toISOString(),
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
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    }, { status: 500 });
  }
}
