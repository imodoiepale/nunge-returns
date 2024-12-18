import { Inter } from 'next/font/google'
import { headers } from 'next/headers'

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getDomainTheme } from '@/lib/utils'

import "@/styles/globals.css"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = headers()
  const hostname = headersList.get('host') || ''
  const theme = getDomainTheme(hostname)

  return (
    <html lang="en">
      <body className={inter.className} data-theme={theme}>
        <div className="relative flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  )
}
