import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import useCustomToast from "@/lib/toast"

interface KraStatus {
  status: "up" | "down" | "degraded"
  responseTime: number
  lastChecked: Date
}

export function KraStatusMonitor() {
  const toast = useCustomToast()
  const [status, setStatus] = useState<KraStatus | null>(null)

  const checkStatus = async () => {
    try {
      // Simulate API call to check KRA status
      const response = await fetch("/api/kra/status")
      const data = await response.json()

      const newStatus: KraStatus = {
        status: data.status,
        responseTime: data.responseTime,
        lastChecked: new Date(),
      }

      setStatus(newStatus)

      // Show toast only if status changes
      if (status && status.status !== newStatus.status) {
        switch (newStatus.status) {
          case "down":
            toast.error("KRA website is currently down")
            break
          case "degraded":
            toast.warning("KRA website is experiencing issues")
            break
          case "up":
            if (status.status !== "up") {
              toast.success("KRA website is back online")
            }
            break
        }
      }
    } catch (error) {
      console.error("Failed to check KRA status:", error)
      toast.error("Failed to check KRA website status")
    }
  }

  useEffect(() => {
    // Initial check
    checkStatus()

    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000)

    return () => clearInterval(interval)
  }, [])

  if (!status) {
    return null
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">KRA Website Status</h3>
          <p className="text-sm text-muted-foreground">
            Response Time: {status.responseTime}ms
          </p>
        </div>
        <Badge
          variant={
            status.status === "up"
              ? "default"
              : status.status === "degraded"
              ? "warning"
              : "destructive"
          }
        >
          {status.status.toUpperCase()}
        </Badge>
      </div>
    </Card>
  )
}
