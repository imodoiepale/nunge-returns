// Mock data for the activity log component
export const mockActivityData = [
  {
    id: 1,
    type: 'create',
    title: 'New tax return created',
    description: 'A new tax return was created for James Smith',
    timestamp: new Date(2023, 10, 15, 9, 32),
    status: 'success',
    user: {
      name: 'Admin User',
      email: 'admin@nungereturns.com'
    },
    metadata: {
      returnId: 'RTN-2023-001',
      taxYear: '2023'
    }
  },
  {
    id: 2,
    type: 'update',
    title: 'Return status updated',
    description: 'Return RTN-2023-002 status changed to "In Progress"',
    timestamp: new Date(2023, 10, 14, 16, 45),
    status: 'info',
    user: {
      name: 'Sarah Johnson',
      email: 'sarah@nungereturns.com'
    }
  },
  {
    id: 3,
    type: 'import',
    title: 'Documents imported',
    description: '5 documents imported for client Robert Williams',
    timestamp: new Date(2023, 10, 14, 11, 22),
    status: 'success',
    user: {
      name: 'Tax Preparer',
      email: 'preparer@nungereturns.com'
    },
    metadata: {
      documentCount: 5,
      clientId: 'CLI-2023-028'
    }
  },
  {
    id: 4,
    type: 'auth',
    title: 'New user login',
    description: 'New login from unusual location detected',
    timestamp: new Date(2023, 10, 13, 9, 15),
    status: 'warning',
    user: {
      name: 'Michael Brown',
      email: 'michael@nungereturns.com'
    },
    metadata: {
      ipAddress: '192.168.1.34',
      location: 'New York, USA'
    }
  },
  {
    id: 5,
    type: 'transaction',
    title: 'Payment processed',
    description: 'Payment of $350.00 processed for tax preparation services',
    timestamp: new Date(2023, 10, 12, 14, 28),
    status: 'success',
    user: {
      name: 'Finance Team',
      email: 'finance@nungereturns.com'
    },
    metadata: {
      amount: 350.00,
      paymentMethod: 'Credit Card',
      transactionId: 'TRX-2023-0089'
    }
  },
  {
    id: 6,
    type: 'delete',
    title: 'Return deleted',
    description: 'Draft return RTN-2023-005 was deleted',
    timestamp: new Date(2023, 10, 11, 10, 45),
    status: 'error',
    user: {
      name: 'Admin User',
      email: 'admin@nungereturns.com'
    }
  },
  {
    id: 7,
    type: 'export',
    title: 'Reports exported',
    description: 'Monthly financial reports exported to CSV',
    timestamp: new Date(2023, 10, 10, 17, 32),
    status: 'success',
    user: {
      name: 'Finance Team',
      email: 'finance@nungereturns.com'
    },
    metadata: {
      reportType: 'Financial',
      format: 'CSV',
      period: 'October 2023'
    }
  },
  {
    id: 8,
    type: 'system',
    title: 'System maintenance',
    description: 'Scheduled system maintenance completed',
    timestamp: new Date(2023, 10, 9, 23, 45),
    status: 'info',
    metadata: {
      duration: '2 hours',
      components: ['Database', 'API Services']
    }
  },
  {
    id: 9,
    type: 'report',
    title: 'Audit report generated',
    description: 'Quarterly compliance audit report generated',
    timestamp: new Date(2023, 10, 8, 15, 20),
    status: 'success',
    user: {
      name: 'Compliance Officer',
      email: 'compliance@nungereturns.com'
    }
  },
  {
    id: 10,
    type: 'schedule',
    title: 'Client meeting scheduled',
    description: 'Meeting scheduled with client Emily Davis',
    timestamp: new Date(2023, 10, 7, 11, 30),
    status: 'pending',
    user: {
      name: 'Tax Advisor',
      email: 'advisor@nungereturns.com'
    },
    metadata: {
      clientName: 'Emily Davis',
      date: '2023-11-20',
      time: '14:00',
      purpose: 'Tax Planning'
    }
  },
  {
    id: 11,
    type: 'partner',
    title: 'New partner added',
    description: 'Eastside Accounting added as referral partner',
    timestamp: new Date(2023, 10, 6, 13, 45),
    status: 'success',
    user: {
      name: 'Business Development',
      email: 'bizdev@nungereturns.com'
    }
  },
  {
    id: 12,
    type: 'user',
    title: 'User account updated',
    description: 'User permissions updated for Jennifer Wilson',
    timestamp: new Date(2023, 10, 5, 10, 15),
    status: 'info',
    user: {
      name: 'Admin User',
      email: 'admin@nungereturns.com'
    },
    metadata: {
      userId: 'USR-2023-042',
      newRole: 'Senior Tax Preparer'
    }
  }
];

// Function to get activities based on filters
export function getActivityLogData(options = {}) {
  const {
    limit = 8,
    types = [],
    status = [],
    search = '',
    startDate,
    endDate,
    userId
  } = options;
  
  let filteredData = [...mockActivityData];
  
  // Filter by types if specified
  if (types.length > 0) {
    filteredData = filteredData.filter(item => types.includes(item.type));
  }
  
  // Filter by status if specified
  if (status.length > 0) {
    filteredData = filteredData.filter(item => status.includes(item.status));
  }
  
  // Filter by search query
  if (search) {
    const query = search.toLowerCase();
    filteredData = filteredData.filter(item => 
      item.title.toLowerCase().includes(query) ||
      (item.description?.toLowerCase().includes(query)) ||
      (item.user?.name.toLowerCase().includes(query)) ||
      (item.user?.email.toLowerCase().includes(query))
    );
  }
  
  // Filter by date range
  if (startDate) {
    const start = new Date(startDate);
    filteredData = filteredData.filter(item => new Date(item.timestamp) >= start);
  }
  
  if (endDate) {
    const end = new Date(endDate);
    filteredData = filteredData.filter(item => new Date(item.timestamp) <= end);
  }
  
  // Filter by user
  if (userId) {
    filteredData = filteredData.filter(item => item.user?.id === userId);
  }
  
  // Sort by timestamp descending (newest first)
  filteredData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Apply limit if specified
  if (limit) {
    filteredData = filteredData.slice(0, limit);
  }
  
  return filteredData;
}

// Get all available activity types
export function getActivityTypes() {
  return [
    'create', 
    'update', 
    'delete', 
    'import', 
    'export', 
    'report', 
    'filter', 
    'schedule',
    'auth',
    'user',
    'return',
    'transaction',
    'document',
    'partner',
    'system'
  ];
}

// Get all available activity statuses
export function getActivityStatuses() {
  return ['success', 'warning', 'error', 'info', 'pending'];
}
