import { CheckCircle2 } from "lucide-react"

export default function FeaturesPage() {
  const features = [
    {
      title: "Automated Tax Calculations",
      description: "Our advanced algorithms ensure accurate tax calculations based on your income, deductions, and applicable tax laws.",
    },
    {
      title: "Document Scanner",
      description: "Easily scan and upload your tax documents using our mobile-friendly document scanner with OCR technology.",
    },
    {
      title: "Real-Time Tax Estimates",
      description: "Get instant estimates of your tax liability or refund as you input your information.",
    },
    {
      title: "Multi-Year Filing",
      description: "File returns for multiple years with easy access to historical data and year-over-year comparisons.",
    },
    {
      title: "Expert Support",
      description: "Access to tax professionals for guidance and review of your returns before submission.",
    },
    {
      title: "Secure Data Storage",
      description: "Bank-level encryption ensures your sensitive financial information remains protected.",
    },
    {
      title: "Auto-Fill Information",
      description: "Smart form filling using information from previous years and uploaded documents.",
    },
    {
      title: "Mobile Accessibility",
      description: "File your returns on any device with our responsive platform.",
    },
  ]

  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">Powerful Features for Effortless Tax Filing</h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Everything you need to file your tax returns accurately and efficiently
        </p>
      </div>
      <div className="mx-auto mt-16 max-w-5xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="relative border p-8 rounded-lg">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <h3 className="font-semibold">{feature.title}</h3>
              </div>
              <p className="mt-4 text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
