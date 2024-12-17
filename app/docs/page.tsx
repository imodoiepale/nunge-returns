export default function DocsPage() {
  return (
    <div className="container py-24">
      <div className="mx-auto max-w-4xl space-y-8">
        <h1 className="text-4xl font-bold tracking-tighter">Documentation</h1>
        <p className="text-xl text-muted-foreground">
          Welcome to the Nunge Returns documentation. Here you'll find guides on how to use our platform, FAQs, and detailed explanations of our features.
        </p>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tighter">Getting Started</h2>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Creating an account</li>
            <li>Filing your first nil return</li>
            <li>Understanding your dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

