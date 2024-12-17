import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function PricingPage() {
  const plans = [
    {
      name: "Basic",
      description: "Perfect for students and first-time filers",
      price: "KES 50",
      features: [
        "Single nil return filing",
        "Basic email support",
        "24-hour processing",
        "Digital receipt",
        "Secure data handling"
      ]
    },
    {
      name: "Pro",
      description: "For regular filers who need more features",
      price: "KES 100",
      features: [
        "Multiple nil return filing",
        "Priority email support",
        "Sign up required",
        // "1-hour processing",
        "Digital receipt",
        "Secure data handling",
        "Filing history access",
        "Auto-fill from previous returns"
      ],
      className: "bg-[rgba(189,157,221,0.1)]"
    },
    {
      name: "Enterprise",
      description: "Custom solutions for businesses",
      price: "Contact Us",
      features: [
        "Unlimited nil return filing",
        "Unlimited actual tax returns filing",
        "24/7 priority support",
        "Instant processing",
        "Digital receipt",
        "Secure data handling",
        "Filing history access",
        "Auto-fill from previous returns",
        "Dedicated account manager",
        "Custom API integration",
        "Company and individual tax returns"
      ]
    }
  ]

  return (
    <div className="py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">Simple, Transparent Pricing</h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Choose the plan that best fits your needs. All plans include our core features.
        </p>
      </div>
      <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className={`flex flex-col ${plan.className}`}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="text-3xl font-bold">{plan.price}</div>
              <div className="mt-6 space-y-4">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/file">Get Started</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}