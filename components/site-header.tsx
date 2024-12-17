"use client"
import { useRouter } from "next/navigation"
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
  const router = useRouter()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className=" px-40 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button onClick={() => router.push("/")} className="bg-gradient-to-r from-primary to-primary/50 rounded-full px-4 py-1 text-xl font-semibold">
            Nunge Returns
          </button>
          <span onClick={() => router.push("/corporate")} className="text-sm text-muted-foreground font-light bg-gradient-to-r from-primary/50 to-primary/20 rounded-full px-4 py-1">
            Corporate
          </span>
        </div>
        <nav className="flex space-x-6">
          {navItems.map(({ label, href }) => (
            <button key={href} onClick={() => router.push(href)} className="text-sm text-muted-foreground hover:text-foreground">
              {label}
            </button>
          ))}
        </nav>
        <div className="flex items-center space-x-4">
          <ScheduleCallButton />
          <Button className="rounded-full bg-primary text-primary-foreground px-4 py-2" asChild>
            <button onClick={() => router.push("/file")}>File Now</button>
          </Button>
        </div>
      </div>
    </header>
  )
}
