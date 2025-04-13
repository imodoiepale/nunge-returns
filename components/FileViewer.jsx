'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Trash2, CheckCircle, Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

/**
 * File viewer component for displaying and managing uploaded documents
 * @param {Object} props - Component props
 * @param {string} props.returnId - ID of the return to fetch documents for
 * @param {string} props.userEmail - Email of the user viewing the files
 * @param {string} props.userName - Name of the user viewing the files
 * @param {boolean} props.canDelete - Whether the user can delete documents
 * @param {boolean} props.canVerify - Whether the user can verify documents
 * @param {Function} props.onDelete - Callback function called when a document is deleted
 */
export default function FileViewer({ 
  returnId, 
  userEmail,
  userName,
  canDelete = false,
  canVerify = false,
  onDelete
}) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!returnId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/file?returnId=${returnId}`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch documents');
        }
        
        setDocuments(result.data || []);
      } catch (error) {
        console.error('Error fetching documents:', error);
        setError(error.message || 'Failed to fetch documents');
        toast.error('Failed to load documents');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, [returnId, refreshKey]);

  // Handle document deletion
  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/file?documentId=${documentId}&userEmail=${userEmail || ''}&userName=${userName || ''}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete document');
      }
      
      // Update local state
      setDocuments(documents.filter(doc => doc.id !== documentId));
      toast.success('Document deleted successfully');
      
      // Call onDelete callback if provided
      if (onDelete && typeof onDelete === 'function') {
        onDelete(documentId);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error(error.message || 'Failed to delete document');
    }
  };

  // Handle document verification
  const handleVerify = async (documentId) => {
    try {
      const response = await fetch(`/api/file/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          verifiedBy: userEmail || 'admin',
          verifiedAt: new Date().toISOString(),
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to verify document');
      }
      
      // Update local state
      setDocuments(documents.map(doc => 
        doc.id === documentId 
          ? { ...doc, is_verified: true, verified_by: userEmail || 'admin', verified_at: new Date().toISOString() } 
          : doc
      ));
      
      toast.success('Document verified successfully');
    } catch (error) {
      console.error('Error verifying document:', error);
      toast.error(error.message || 'Failed to verify document');
    }
  };

  // Refresh documents
  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Get document type display name
  const getDocumentTypeDisplay = (type) => {
    const typeMap = {
      'supporting_document': 'Supporting Document',
      'id_document': 'ID Document',
      'income_statement': 'Income Statement',
      'expense_receipt': 'Expense Receipt',
      'tax_certificate': 'Tax Certificate',
      'bank_statement': 'Bank Statement',
      'other': 'Other Document'
    };
    
    return typeMap[type] || type;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Documents</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No documents found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <div 
                key={doc.id} 
                className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="flex items-start space-x-3">
                  <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{doc.document_name}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 text-sm text-gray-500">
                      <span>{getDocumentTypeDisplay(doc.document_type)}</span>
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>Uploaded {formatDistanceToNow(new Date(doc.uploaded_at), { addSuffix: true })}</span>
                    </div>
                    {doc.description && (
                      <p className="text-sm mt-1">{doc.description}</p>
                    )}
                    {doc.is_verified && (
                      <div className="flex items-center mt-1 text-green-600 text-sm">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(doc.document_url, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = doc.document_url;
                      link.download = doc.document_name;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  {canVerify && !doc.is_verified && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerify(doc.id)}
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Verify
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
