'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  ArrowUpRight, 
  CheckCircle, 
  Clock, 
  Download, 
  Eye,
  FileText,
  Search,
  AlertTriangle,
  File
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { DocumentViewer } from '@/components/admin/document-viewer'

// Mock documents data
const documentsMetrics = [
  { name: 'Apr 6', total: 240, processed: 232 },
  { name: 'Apr 7', total: 310, processed: 295 },
  { name: 'Apr 8', total: 350, processed: 340 },
  { name: 'Apr 9', total: 420, processed: 405 },
  { name: 'Apr 10', total: 480, processed: 465 },
  { name: 'Apr 11', total: 550, processed: 530 },
]

const documents = [
  {
    id: "d-1",
    fileName: "ID_12345678.pdf",
    fileType: "identification",
    userName: "John Doe",
    fileSize: 1240000,
    status: "processed",
    uploadedAt: "2025-04-11T09:24:18.123Z"
  },
  {
    id: "d-2",
    fileName: "ID_87654321.jpg",
    fileType: "identification",
    userName: "Mary Smith",
    fileSize: 950000,
    status: "processed",
    uploadedAt: "2025-04-11T14:32:10.982Z"
  },
  {
    id: "d-3",
    fileName: "PIN_567891234.pdf",
    fileType: "kra_certificate",
    userName: "Peter Kamau",
    fileSize: 1560000,
    status: "pending",
    uploadedAt: "2025-04-11T08:15:47.325Z"
  },
  {
    id: "d-4",
    fileName: "ID_23456789.pdf",
    fileType: "identification",
    userName: "Jane Wanjiku",
    fileSize: 1180000,
    status: "processed",
    uploadedAt: "2025-04-10T16:08:35.190Z"
  },
  {
    id: "d-5",
    fileName: "PIN_345678912.pdf",
    fileType: "kra_certificate",
    userName: "David Omondi",
    fileSize: 1320000,
    status: "failed",
    uploadedAt: "2025-04-11T10:42:53.687Z"
  },
  {
    id: "d-6",
    fileName: "ID_45678912.jpg",
    fileType: "identification",
    userName: "Sarah Njeri",
    fileSize: 870000,
    status: "processed",
    uploadedAt: "2025-04-09T12:19:08.456Z"
  },
  {
    id: "d-7",
    fileName: "TAX_RETURN_2024.pdf",
    fileType: "tax_return",
    userName: "Michael Mwangi",
    fileSize: 2240000,
    status: "processed",
    uploadedAt: "2025-04-11T15:51:24.213Z"
  },
  {
    id: "d-8",
    fileName: "ID_89123456.jpg",
    fileType: "identification",
    userName: "Esther Akinyi",
    fileSize: 920000,
    status: "pending",
    uploadedAt: "2025-04-11T09:30:16.874Z"
  }
]

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false)
  
  const filteredDocuments = documents.filter(doc => 
    doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.fileType.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Format date to display in a more friendly way
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }
  
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    else return (bytes / 1048576).toFixed(1) + ' MB'
  }
  
  // Get status badge styling
  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'processed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-500'
    }
  }
  
  // Get file type icon
  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'identification':
        return <File className="h-4 w-4 text-blue-500" />
      case 'kra_certificate':
        return <File className="h-4 w-4 text-orange-500" />
      case 'tax_return':
        return <File className="h-4 w-4 text-green-500" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="flex-1 space-y-4 p-6 lg:p-2">

      {/* Statistics cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,250</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">18.2%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,142</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">17.8%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:bg-card/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">108</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">5.9%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Documents chart */}
      <Card>
        <CardHeader>
          <CardTitle>Document Processing Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={documentsMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.1} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: '#333', borderRadius: '8px' }} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total" 
                name="Total Documents" 
                stroke="#8884d8" 
                strokeWidth={2}
                activeDot={{ r: 8 }} 
              />
              <Line 
                type="monotone" 
                dataKey="processed" 
                name="Processed Documents" 
                stroke="#82ca9d" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Documents table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Documents</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                className="pl-8 max-w-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted">
              <Download className="h-4 w-4" />
              <span className="sr-only">Download CSV</span>
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    {getFileTypeIcon(doc.fileType)}
                    {doc.fileName}
                  </TableCell>
                  <TableCell className="capitalize">
                    {doc.fileType.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell>{doc.userName}</TableCell>
                  <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(doc.uploadedAt)}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeStyles(doc.status)}`}>
                      {doc.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        // In a real app, this would use the actual document URL
                        // For demo purposes, using a sample PDF URL
                        setSelectedDocument({
                          ...doc,
                          documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                          userEmail: 'user@example.com',
                          userPhone: '+254 712 345 678'
                        });
                        setIsDocumentViewerOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View Document</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    
      {/* Document Viewer Dialog */}
      {selectedDocument && (
        <DocumentViewer
          isOpen={isDocumentViewerOpen}
          onClose={() => setIsDocumentViewerOpen(false)}
          documentUrl={selectedDocument.documentUrl}
          documentTitle={selectedDocument.fileName}
          documentType={selectedDocument.fileType.replace(/_/g, ' ')}
          documentStatus={selectedDocument.status}
          documentDate={formatDate(selectedDocument.uploadedAt)}
          documentSize={formatFileSize(selectedDocument.fileSize)}
          documentId={selectedDocument.id}
          userId={`usr_${Math.random().toString(36).substr(2, 9)}`}
          userName={selectedDocument.userName}
          userEmail={selectedDocument.userEmail}
          userPhone={selectedDocument.userPhone}
          additionalInfo={[
            { label: 'Document Category', value: selectedDocument.fileType.replace(/_/g, ' ') },
            { label: 'Processing Time', value: '1.2 seconds' },
            { label: 'Verification Method', value: 'AI + Manual Review' }
          ]}
        />
      )}
    </div>
  )
}
