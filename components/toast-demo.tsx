import { Button } from "@/components/ui/button"
import useCustomToast from "@/lib/toast"

export function ToastDemo() {
  const toast = useCustomToast()

  const simulateOperation = () => {
    return new Promise((resolve) => {
      setTimeout(resolve, 2000)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <Button
          variant="default"
          onClick={() => toast.success("Returns filed successfully!")}
        >
          Success Toast
        </Button>
        <Button
          variant="destructive"
          onClick={() => toast.error("Failed to connect to KRA website")}
        >
          Error Toast
        </Button>
        <Button
          variant="outline"
          onClick={() => toast.warning("Your session will expire in 3 minutes")}
        >
          Warning Toast
        </Button>
        <Button
          variant="secondary"
          onClick={() => toast.info("Tip: Schedule your returns for automatic filing")}
        >
          Info Toast
        </Button>
      </div>
      <div className="flex gap-4">
        <Button
          variant="default"
          onClick={() => toast.loading("Processing your request...")}
        >
          Loading Toast
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.withProgress(
              "Returns filed successfully!",
              simulateOperation()
            )
          }
        >
          Progress Toast
        </Button>
      </div>
    </div>
  )
}
