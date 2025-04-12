'use client'

import { TooltipProvider } from "@/components/ui/tooltip"

export function TooltipProviderWrapper({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <TooltipProvider>
      {children}
    </TooltipProvider>
  )
}
