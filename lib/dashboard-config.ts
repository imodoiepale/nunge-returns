// dashboard-config.ts
// Central configuration file for dashboard settings

export const dashboardConfig = {
  title: "Nunge Returns Admin",
  description: "Advanced administration and analytics platform",
  version: "1.0.0",
  theme: {
    primary: "hsl(222.2, 47.4%, 11.2%)",
    primaryForeground: "hsl(210, 40%, 98%)",
    sidebar: {
      width: {
        expanded: "240px",
        collapsed: "70px"
      },
      breakpoint: "lg"
    }
  },
  features: {
    enableRealTimeUpdates: true,
    enableGlobalSearch: true,
    enableExportToCSV: true,
    enableDarkMode: true,
    enableFilterSaving: true,
    enableDataCaching: true,
    enableNotifications: true
  },
  refreshRate: 300000, // 5 minutes
  dateFormat: "dd MMM yyyy, HH:mm",
  timeZone: "Africa/Nairobi",
  perPage: [10, 25, 50, 100],
  defaultPerPage: 25
};

// Admin dashboard sections configuration
export const sectionConfig = [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Key performance metrics and business overview",
    icon: "BarChart3",
    path: "/admin/dashboard",
    permissions: ["admin", "staff"],
    color: "blue"
  },
  {
    id: "users",
    title: "Users",
    description: "Manage user accounts, profiles and permissions",
    icon: "Users",
    path: "/admin/users",
    permissions: ["admin", "staff"],
    color: "indigo"
  },
  {
    id: "returns",
    title: "Returns",
    description: "Monitor tax returns processing and submissions",
    icon: "FileText",
    path: "/admin/returns",
    permissions: ["admin", "staff"],
    color: "purple"
  },
  {
    id: "transactions",
    title: "Transactions",
    description: "Track payments, revenue and financial metrics",
    icon: "CreditCard",
    path: "/admin/transactions",
    permissions: ["admin", "staff"],
    color: "green"
  },
  {
    id: "partners",
    title: "Partners",
    description: "Manage partner accounts and commission structures",
    icon: "Users2",
    path: "/admin/partners",
    permissions: ["admin"],
    color: "orange"
  },
  {
    id: "documents",
    title: "Documents",
    description: "Organize, process and validate user documents",
    icon: "FileArchive",
    path: "/admin/documents",
    permissions: ["admin", "staff"],
    color: "amber"
  },
  {
    id: "reports",
    title: "Reports",
    description: "Generate and export business reports and analytics",
    icon: "PieChart",
    path: "/admin/reports",
    permissions: ["admin"],
    color: "red"
  },
  {
    id: "settings",
    title: "Settings",
    description: "Configure system settings and preferences",
    icon: "Settings",
    path: "/admin/settings",
    permissions: ["admin"],
    color: "slate"
  }
];

// Table column configurations
export const columnConfig = {
  users: [
    { id: "name", title: "Name", sortable: true, filterable: true },
    { id: "email", title: "Email", sortable: true, filterable: true },
    { id: "pin", title: "KRA PIN", sortable: true, filterable: true },
    { id: "status", title: "Status", sortable: true, filterable: true },
    { id: "registered", title: "Registered", sortable: true, filterable: true, type: "date" },
    { id: "lastActive", title: "Last Active", sortable: true, filterable: true, type: "date" }
  ],
  returns: [
    { id: "user", title: "User", sortable: true, filterable: true },
    { id: "pin", title: "KRA PIN", sortable: true, filterable: true },
    { id: "period", title: "Return Period", sortable: true, filterable: true },
    { id: "submission", title: "Submission Date", sortable: true, filterable: true, type: "date" },
    { id: "status", title: "Status", sortable: true, filterable: true },
    { id: "amount", title: "Amount", sortable: true, filterable: true, type: "currency" }
  ],
  transactions: [
    { id: "user", title: "User", sortable: true, filterable: true },
    { id: "amount", title: "Amount", sortable: true, filterable: true, type: "currency" },
    { id: "method", title: "Payment Method", sortable: true, filterable: true },
    { id: "reference", title: "Reference", sortable: true, filterable: true },
    { id: "date", title: "Date", sortable: true, filterable: true, type: "date" },
    { id: "status", title: "Status", sortable: true, filterable: true }
  ],
  partners: [
    { id: "company", title: "Company", sortable: true, filterable: true },
    { id: "contact", title: "Contact", sortable: true, filterable: true },
    { id: "type", title: "Type", sortable: true, filterable: true },
    { id: "commission", title: "Commission", sortable: true, filterable: true, type: "percent" },
    { id: "revenue", title: "Revenue", sortable: true, filterable: true, type: "currency" },
    { id: "paid", title: "Paid", sortable: true, filterable: true, type: "currency" },
    { id: "status", title: "Status", sortable: true, filterable: true },
    { id: "started", title: "Started", sortable: true, filterable: true, type: "date" }
  ],
  documents: [
    { id: "file", title: "File Name", sortable: true, filterable: true },
    { id: "type", title: "Type", sortable: true, filterable: true },
    { id: "user", title: "User", sortable: true, filterable: true },
    { id: "size", title: "Size", sortable: true, filterable: true, type: "fileSize" },
    { id: "uploaded", title: "Uploaded", sortable: true, filterable: true, type: "date" },
    { id: "status", title: "Status", sortable: true, filterable: true }
  ]
};

// Advanced filter configurations
export const filterConfig = {
  users: {
    status: ["active", "inactive", "pending", "suspended"],
    registrationDate: { type: "dateRange" },
    lastActiveDate: { type: "dateRange" }
  },
  returns: {
    status: ["completed", "pending", "failed"],
    submissionDate: { type: "dateRange" },
    returnPeriod: { type: "monthYear" }
  },
  transactions: {
    status: ["completed", "pending", "failed"],
    paymentMethod: ["mpesa", "card", "bank"],
    transactionDate: { type: "dateRange" },
    amountRange: { type: "numberRange" }
  },
  partners: {
    status: ["active", "inactive", "pending"],
    partnerType: ["cyber", "university", "business"],
    startDate: { type: "dateRange" }
  },
  documents: {
    status: ["processed", "pending", "failed"],
    documentType: ["identification", "kra_certificate", "tax_return"],
    uploadDate: { type: "dateRange" }
  }
};

// Dashboard widget configurations
export const widgetConfig = {
  small: {
    width: "col-span-1",
    height: "h-[120px]"
  },
  medium: {
    width: "col-span-2",
    height: "h-[200px]"
  },
  large: {
    width: "col-span-3",
    height: "h-[300px]"
  },
  extraLarge: {
    width: "col-span-4",
    height: "h-[400px]"
  }
};
