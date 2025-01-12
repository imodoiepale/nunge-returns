import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PageBackground } from "@/components/ui/page-background"

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
    <PageBackground>
      <div className="mx-auto max-w-2xl text-center px-4">
        <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-cyan-600 to-purple-600 animate-gradient">
          Simple, Transparent Pricing
        </h1>
        <p className="mt-3 text-sm text-cyan-700">
          Choose the plan that best fits your needs. All plans include our core features.
        </p>
      </div>
      <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-4 px-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className={`flex flex-col backdrop-blur-md bg-white/50 border-purple-200 hover:border-purple-300 transition-colors duration-300 shadow-lg hover:shadow-purple-100/50 ${plan.className}`}>
            <CardHeader className="p-4">
              <CardTitle className="text-lg text-purple-700">{plan.name}</CardTitle>
              <CardDescription className="text-xs text-gray-600">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-4">
              <div className="text-xl font-bold text-purple-700">{plan.price}</div>
              <div className="mt-4 space-y-2">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-purple-600" />
                    <span className="text-xs text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="p-4">
              <Button asChild size="sm" className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700">
                <Link href="/file">Get Started</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </PageBackground>
  )
}