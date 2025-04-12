"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  BarChart3, 
  Users, 
  FileText, 
  CreditCard, 
  Users2, 
  FileArchive,
  Settings,
  Home,
  Menu,
  Plus,
  X,
  LineChart,
  ActivitySquare
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AdminNavbar } from "@/components/admin/navbar"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  {
    title: "Overview",
    href: "/admin/dashboard",
    icon: BarChart3,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Returns",
    href: "/admin/returns",
    icon: FileText,
  },
  {
    title: "Transactions",
    href: "/admin/transactions",
    icon: CreditCard,
  },
  {
    title: "Partners",
    href: "/admin/partners",
    icon: Users2,
  },
  {
    title: "Documents",
    href: "/admin/documents",
    icon: FileArchive,
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: LineChart,
  },
  {
    title: "Activity Log",
    href: "/admin/activity",
    icon: ActivitySquare,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  
  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      {/* Mobile navigation header - only visible on small screens */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background px-4 py-3 lg:hidden">
        <Link href="/admin/dashboard" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-primary">Nunge Returns Admin</span>
        </Link>
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <Link href="/admin/dashboard" className="flex items-center space-x-2">
                  <span className="text-xl font-bold text-primary">Nunge Returns Admin</span>
                </Link>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="h-6 w-6" />
                  <span className="sr-only">Close Menu</span>
                </button>
              </div>
              <ScrollArea className="flex-1">
                <div className="flex flex-col gap-1 p-2">
                  <MobileNav items={navItems} pathname={pathname} onNavClick={() => setSidebarOpen(false)} />
                </div>
              </ScrollArea>
              <div className="border-t p-4">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Home className="h-4 w-4" />
                  Return to Website
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>
      
      {/* Main container with sidebar and content */}
      <div className="flex flex-1 relative">
        {/* Desktop sidebar - fixed position */}
        <aside className="hidden fixed left-0 top-0 bottom-0 w-[280px] border-r bg-background lg:block z-10 overflow-hidden">
          <div className="flex h-full flex-col">
            <div className="flex h-14 items-center border-b px-6">
              <Link href="/admin/dashboard" className="flex items-center space-x-2">
                <span className="text-xl font-bold text-primary">Nunge Returns Admin</span>
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col gap-1 p-4">
                <DesktopNav items={navItems} pathname={pathname} />
              </div>
            </div>
            <div className="mt-auto border-t p-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <Home className="h-4 w-4" />
                Return to Website
              </Link>
            </div>
          </div>
        </aside>
        
        {/* Main content area with left margin on large screens */}
        <main className="flex-1 w-full lg:ml-[280px]">
          {/* Admin Navbar */}
          <AdminNavbar />
          
          {/* Page content */}
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function MobileNav({ 
  items, 
  pathname,
  onNavClick
}: { 
  items: NavItem[]
  pathname: string | null
  onNavClick: () => void
}) {
  return items.map((item) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={onNavClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
        pathname && pathname === item.href
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted hover:text-foreground"
      )}
    >
      <item.icon className="h-5 w-5" />
      {item.title}
    </Link>
  ))
}

function DesktopNav({ 
  items, 
  pathname 
}: { 
  items: NavItem[]
  pathname: string | null
}) {
  return items.map((item) => (
    <Link
      key={item.href}
      href={item.href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
        pathname && pathname === item.href
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted hover:text-foreground"
      )}
    >
      <item.icon className="h-5 w-5" />
      {item.title}
    </Link>
  ))
}
