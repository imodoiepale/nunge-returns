import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import useCustomToast from "@/lib/toast"

export function FileReturnsForm() {
  const toast = useCustomToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validatePin = (pin: string) => {
    const pinRegex = /^[AP][0-9]{9}X$/
    return pinRegex.test(pin)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.target as HTMLFormElement)
    const pin = formData.get("pin") as string
    const password = formData.get("password") as string

    try {
      // Validate PIN format
      if (!validatePin(pin)) {
        toast.error("Invalid PIN format. PIN must start with A or P and end with X")
        return
      }

      // Check KRA website status
      toast.info("Checking KRA website status...")
      const kraStatus = await checkKraStatus()
      
      if (!kraStatus.isAvailable) {
        toast.error("KRA website is currently unavailable. Please try again later.")
        return
      }

      // Start returns filing process
      const fileReturnsPromise = fileReturns({ pin, password })
      
      toast.withProgress(
        "Returns filed successfully!",
        fileReturnsPromise
      )

      await fileReturnsPromise
      
      // Show success message with next steps
      toast.success("Returns filed successfully! Check your email for confirmation.")
      
    } catch (error) {
      toast.error("An error occurred while filing returns. Please try again.")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Simulate KRA status check
  const checkKraStatus = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { isAvailable: true }
  }

  // Simulate returns filing
  const fileReturns = async (data: { pin: string; password: string }) => {
    await new Promise(resolve => setTimeout(resolve, 3000))
    return { success: true }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="pin">KRA PIN</Label>
        <Input
          id="pin"
          name="pin"
          placeholder="A123456789X"
          required
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          className="w-full"
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Filing Returns..." : "File Returns"}
      </Button>
    </form>
  )
}
