'use client'

import React, { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { FileText, Download, Printer, User, Calendar, Check, X } from 'lucide-react'

interface DocumentViewerProps {
  isOpen: boolean
  onClose: () => void
  documentUrl: string
  documentTitle: string
  documentType?: string
  documentStatus?: 'approved' | 'rejected' | 'pending' | string
  documentDate?: string
  documentSize?: string
  documentId?: string
  userId?: string
  userName?: string
  userEmail?: string
  userPhone?: string
  additionalInfo?: {
    label: string
    value: string | React.ReactNode
  }[]
}

export function DocumentViewer({
  isOpen,
  onClose,
  documentUrl,
  documentTitle,
  documentType = 'PDF',
  documentStatus = 'pending',
  documentDate,
  documentSize,
  documentId,
  userId,
  userName,
  userEmail,
  userPhone,
  additionalInfo = []
}: DocumentViewerProps) {
  const [loading, setLoading] = useState(true)

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <Check className="h-3.5 w-3.5" />
      case 'rejected':
        return <X className="h-3.5 w-3.5" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-500'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] p-0 h-[80vh] flex flex-col">
        <DialogHeader className="px-6 py-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <DialogTitle className="text-xl">{documentTitle}</DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                <span>Document ID: {documentId}</span>
                {documentType && (
                  <Badge variant="outline" className="ml-2">
                    {documentType}
                  </Badge>
                )}
                {documentStatus && (
                  <Badge 
                    variant="outline" 
                    className={`flex items-center gap-1 ${getStatusColor(documentStatus)} border-0 ml-2`}
                  >
                    {getStatusIcon(documentStatus)}
                    <span className="capitalize">{documentStatus}</span>
                  </Badge>
                )}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => window.open(documentUrl, '_blank')}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* User details sidebar */}
          <div className="w-1/3 border-r p-4 overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{userName || 'Unknown User'}</h3>
                <p className="text-sm text-muted-foreground">ID: {userId || 'N/A'}</p>
              </div>
            </div>

            <Separator className="my-3" />

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Contact Information</h4>
                <div className="space-y-1.5">
                  {userEmail && (
                    <div className="text-sm">
                      <span className="font-medium">Email:</span> {userEmail}
                    </div>
                  )}
                  {userPhone && (
                    <div className="text-sm">
                      <span className="font-medium">Phone:</span> {userPhone}
                    </div>
                  )}
                </div>
              </div>

              <Separator className="my-3" />

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Document Information</h4>
                <div className="space-y-1.5">
                  {documentDate && (
                    <div className="text-sm">
                      <span className="font-medium">Uploaded:</span> {documentDate}
                    </div>
                  )}
                  {documentSize && (
                    <div className="text-sm">
                      <span className="font-medium">Size:</span> {documentSize}
                    </div>
                  )}
                  {documentType && (
                    <div className="text-sm">
                      <span className="font-medium">Type:</span> {documentType}
                    </div>
                  )}
                </div>
              </div>

              {additionalInfo.length > 0 && (
                <>
                  <Separator className="my-3" />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Additional Information</h4>
                    <div className="space-y-1.5">
                      {additionalInfo.map((info, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{info.label}:</span> {info.value}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <Separator className="my-3" />

            <div className="space-y-3 mt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Document Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="default" 
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          </div>

          {/* Document viewer */}
          <div className="flex-1 h-full overflow-auto bg-muted/30">
            {documentUrl ? (
              <iframe 
                src={documentUrl} 
                className="w-full h-full" 
                onLoad={() => setLoading(false)} 
                title={documentTitle}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <FileText className="h-16 w-16 text-muted" />
                <p className="mt-4 text-lg font-medium">No document to display</p>
                <p className="text-muted-foreground">The document URL is missing or invalid</p>
              </div>
            )}
            {loading && documentUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading document...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-3 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
