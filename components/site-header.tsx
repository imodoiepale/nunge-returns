"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScheduleCallButton } from "@/components/schedule-call-button"
import Image from "next/image"

const navItems = [
  { label: "About", href: "/about" },
  { label: "Pricing", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "Careers", href: "/careers" },
]

export function SiteHeader() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-6 lg:px-40 py-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo and Corporate button */}
          <div className="flex items-center justify-between md:justify-start space-x-2">
            <Image 
              onClick={() => router.push("/")} 
              className="rounded-md w-auto h-auto max-w-[140px] md:max-w-[180px] cursor-pointer" 
              src="/logo.png" 
              alt="Nunge Returns" 
              width={180} 
              height={100} 
            />
            <span 
              onClick={() => router.push("/corporate")} 
              className="text-xs md:text-sm text-muted-foreground font-light bg-gradient-to-r from-primary/50 to-primary/20 rounded-full px-3 py-1 cursor-pointer"
            >
              Corporate
            </span>

            {/* Hamburger Menu */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <div className="space-y-1.5">
                <span className={`block w-6 h-0.5 bg-foreground transition-transform duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`block w-6 h-0.5 bg-foreground transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block w-6 h-0.5 bg-foreground transition-transform duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </div>
            </button>
          </div>

          {/* Mobile Menu */}
          <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row w-full md:w-auto`}>
            {/* Navigation */}
            <nav className="flex flex-col md:flex-row md:space-x-6 space-y-2 md:space-y-0 mb-4 md:mb-0">
              {navItems.map(({ label, href }) => (
                <button 
                  key={href} 
                  onClick={() => {
                    router.push(href)
                    setMobileMenuOpen(false)
                  }} 
                  className="text-sm text-muted-foreground hover:text-foreground text-left md:text-center py-2 md:py-0"
                >
                  {label}
                </button>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center space-y-2 md:space-y-0 md:space-x-4">
              <ScheduleCallButton />
              <Button 
                className="rounded-full bg-primary text-primary-foreground px-4 py-2 w-full md:w-auto" 
                onClick={() => {
                  router.push("/file")
                  setMobileMenuOpen(false)
                }}
              >
                File Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}