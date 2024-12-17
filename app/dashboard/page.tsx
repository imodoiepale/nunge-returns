export default function DashboardPage() {
  return (
    <div className="container py-24">
      <div className="mx-auto max-w-4xl space-y-8">
        <h1 className="text-4xl font-bold tracking-tighter">Your Dashboard</h1>
        <p className="text-xl text-muted-foreground">
          Welcome to your Nunge Returns dashboard. Here you can view your filing history, track current submissions, and manage your account.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border p-6">
            <h2 className="text-xl font-bold">Recent Filings</h2>
            <p className="mt-2 text-sm text-muted-foreground">View your recent nil returns submissions</p>
          </div>
          <div className="rounded-lg border p-6">
            <h2 className="text-xl font-bold">Account Summary</h2>
            <p className="mt-2 text-sm text-muted-foreground">Manage your account settings and preferences</p>
          </div>
        </div>
      </div>
    </div>
  )
}

