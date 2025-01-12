"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ScheduleCallButton } from "@/components/schedule-call-button"

const navItems = [
  { label: "About", href: "/about" },
  // { label: "Docs", href: "/docs" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "Careers", href: "/careers" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-purple-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="px-40 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/" className="bg-gradient-to-r from-purple-600 to-purple-400 text-white rounded-full px-4 py-1 text-xl font-semibold hover:from-purple-700 hover:to-purple-500 transition-colors">
            Nunge Returns
          </Link>
          <Link href="/corporate" className="text-sm text-purple-600 font-light bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-full px-4 py-1 hover:from-purple-100 hover:to-purple-200/50 transition-colors">
            Corporate
          </Link>
        </div>
        <nav className="flex space-x-6">
          {navItems.map(({ label, href }) => (
            <Link 
              key={href} 
              href={href} 
              className="text-sm text-purple-600 hover:text-purple-800 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center space-x-4">
          <ScheduleCallButton />
          <Button className="rounded-full bg-gradient-to-r from-purple-600 to-purple-400 hover:from-purple-700 hover:to-purple-500 text-white px-6" asChild>
            <Link href="/file">File Now</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
