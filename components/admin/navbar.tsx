"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface PageConfig {
  title: string
  description: string
}

// Define page configurations
const pageConfigs: Record<string, PageConfig> = {
  "/admin/dashboard": {
    title: "Dashboard",
    description: "Overview of your returns management system"
  },
  "/admin/users": {
    title: "Users Management",
    description: "Manage system users and permissions"
  },
  "/admin/returns": {
    title: "Returns Management",
    description: "View and manage tax returns filed through the platform"
  },
  "/admin/transactions": {
    title: "Transactions",
    description: "View and manage financial transactions"
  },
  "/admin/partners": {
    title: "Partners Management",
    description: "Manage partner organizations and integrations"
  },
  "/admin/documents": {
    title: "Documents Management",
    description: "Manage and organize all system documents"
  },
  "/admin/activity": {
    title: "Activity Log",
    description: "Monitor and audit system activities"
  },
  "/admin/reports": {
    title: "Reports",
    description: "Generate and view system reports and analytics"
  },
  "/admin/settings": {
    title: "Settings",
    description: "Configure system settings and preferences"
  }
}

export function AdminNavbar() {
  const pathname = usePathname()
  const config = pathname ? pageConfigs[pathname] || {
    title: "Returns Management",
    description: "View and manage tax returns filed through the platform"
  } : {
    title: "Returns Management",
    description: "View and manage tax returns filed through the platform"
  }

  return (
    <div className="sticky top-0 z-20 bg-background border-b px-6 py-2">
      <div className="flex gap-4">
        <p className="text-md font-bold text-primary">{config.title}</p>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </div>
    </div>
  )
}
