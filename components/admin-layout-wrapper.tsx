'use client'

import { usePathname } from 'next/navigation'
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith('/admin')

  if (isAdminPage) {
    // For admin pages, don't show the header and footer
    return <>{children}</>
  }

  // For non-admin pages, show the header and footer
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  )
}
