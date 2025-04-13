'use client';

import { useState } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'react-hot-toast';

/**
 * File upload component for tax return documents
 * @param {Object} props - Component props
 * @param {string} props.returnId - ID of the return to associate the file with
 * @param {string} props.documentType - Type of document being uploaded
 * @param {string} props.userEmail - Email of the user uploading the file
 * @param {string} props.userName - Name of the user uploading the file
 * @param {Function} props.onSuccess - Callback function called when upload is successful
 * @param {Function} props.onError - Callback function called when upload fails
 */
export default function FileUpload({ 
  returnId, 
  documentType = 'supporting_document',
  userEmail,
  userName,
  onSuccess,
  onError
}) {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', null

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size exceeds 10MB limit');
        return;
      }
      
      setFile(selectedFile);
      setUploadStatus(null);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!returnId) {
      toast.error('Return ID is required');
      return;
    }

    setUploading(true);
    setProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 5;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 100);

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('returnId', returnId);
      formData.append('documentType', documentType);
      formData.append('description', description);
      
      if (userEmail) formData.append('userEmail', userEmail);
      if (userName) formData.append('userName', userName);

      // Send to API
      const response = await fetch('/api/file', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to upload file');
      }
      
      // Set progress to 100% and status to success
      setProgress(100);
      setUploadStatus('success');
      setFile(null);
      setDescription('');
      
      toast.success('File uploaded successfully');
      
      // Call onSuccess callback if provided
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess(result.data);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('error');
      toast.error(error.message || 'Failed to upload file');
      
      // Call onError callback if provided
      if (onError && typeof onError === 'function') {
        onError(error);
      }
    } finally {
      setUploading(false);
    }
  };

  // Handle file removal
  const handleRemove = () => {
    setFile(null);
    setProgress(0);
    setUploadStatus(null);
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-4">
        {!file ? (
          <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-4">
              Drag and drop your file here, or click to select
            </p>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('file-upload').click()}
              disabled={uploading}
            >
              Select File
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium truncate max-w-[200px]">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={uploading}
                className="text-gray-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description (optional)
              </label>
              <textarea
                id="description"
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                placeholder="Enter a description for this file"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={uploading}
                rows={2}
              />
            </div>
            
            {uploading && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-gray-500 text-center">
                  Uploading... {progress}%
                </p>
              </div>
            )}
            
            {uploadStatus === 'success' && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Upload successful</span>
              </div>
            )}
            
            {uploadStatus === 'error' && (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Upload failed. Please try again.</span>
              </div>
            )}
            
            <Button
              className="w-full"
              onClick={handleUpload}
              disabled={uploading || !file}
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
