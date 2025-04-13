import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from 'next-themes'

import { TooltipProviderWrapper } from '@/components/providers/tooltip-provider'
import { AdminLayoutWrapper } from "@/components/admin-layout-wrapper"
import { getDomainTheme } from '@/lib/utils'

import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const hostname = headersList.get('host') || ''
  const theme = getDomainTheme(hostname)

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} data-theme={theme} suppressHydrationWarning={true}>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
        >
          <TooltipProviderWrapper>
            <div className="relative flex min-h-screen flex-col">
              <AdminLayoutWrapper>
                <main className="flex-1">{children}</main>
              </AdminLayoutWrapper>
            </div>
          </TooltipProviderWrapper>
          <Toaster
            toastOptions={{
              className: 'react-hot-toast',
              style: {
                maxWidth: '500px',
                fontFamily: 'var(--font-sans)',
              },
              success: {
                duration: 4000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}