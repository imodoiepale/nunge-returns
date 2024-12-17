export default function TrackPage() {
  return (
    <div className="container py-24">
      <div className="mx-auto max-w-4xl space-y-8">
        <h1 className="text-4xl font-bold tracking-tighter">Track Your Return Status</h1>
        <p className="text-xl text-muted-foreground">
          Enter your KRA PIN to check the status of your recent nil return filing.
        </p>
        <div className="rounded-lg border p-6">
          <form className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="pin" className="text-sm font-medium">KRA PIN</label>
              <input
                id="pin"
                type="text"
                className="w-full rounded-md border px-3 py-2"
                placeholder="Enter your KRA PIN"
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-primary px-4 py-2 text-primary-foreground"
            >
              Track Status
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

