import { Shield, Lock, Server, UserCheck, AlertTriangle, FileCheck, Key, RefreshCw } from "lucide-react"

export default function SecurityPage() {
  const securityFeatures = [
    {
      icon: Shield,
      title: "End-to-End Encryption",
      description:
        "All data transmitted between your device and our servers is encrypted using industry-standard TLS 1.3 protocols.",
    },
    {
      icon: Lock,
      title: "Secure Data Storage",
      description:
        "Your data is encrypted at rest using AES-256 encryption and stored in secure, redundant data centers.",
    },
    {
      icon: Server,
      title: "Regular Security Audits",
      description:
        "We conduct regular security assessments and penetration testing to identify and address potential vulnerabilities.",
    },
    {
      icon: UserCheck,
      title: "Multi-Factor Authentication",
      description:
        "Optional two-factor authentication adds an extra layer of security to your account.",
    },
    {
      icon: AlertTriangle,
      title: "Fraud Detection",
      description:
        "Advanced algorithms monitor for suspicious activity and unauthorized access attempts.",
    },
    {
      icon: FileCheck,
      title: "Secure Document Handling",
      description:
        "All uploaded documents are encrypted and securely stored with strict access controls.",
    },
    {
      icon: Key,
      title: "Access Controls",
      description:
        "Role-based access control ensures that employees only have access to necessary information.",
    },
    {
      icon: RefreshCw,
      title: "Automatic Backups",
      description:
        "Your data is automatically backed up to multiple secure locations to prevent loss.",
    },
  ]

  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">Security First Approach</h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Your security is our top priority. Learn about the measures we take to protect
          your sensitive information.
        </p>
      </div>

      <div className="mx-auto mt-16 max-w-7xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {securityFeatures.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="relative rounded-lg border p-8 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <Icon className="h-6 w-6 text-primary" />
                  <h3 className="font-semibold">{feature.title}</h3>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>

        <div className="mt-16 rounded-lg border p-8">
          <h2 className="text-2xl font-semibold">Our Security Certifications</h2>
          <p className="mt-4 text-muted-foreground">
            We maintain compliance with major security standards and regularly undergo
            independent security audits:
          </p>
          <ul className="mt-4 list-disc pl-6 space-y-2">
            <li>SOC 2 Type II Certified</li>
            <li>ISO 27001 Certified</li>
            <li>PCI DSS Compliant</li>
            <li>GDPR Compliant</li>
          </ul>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-semibold">Report a Security Issue</h2>
          <p className="mt-4 text-muted-foreground">
            If you discover a security vulnerability, please report it to our security team
            immediately at security@nungereturns.com. We take all security reports
            seriously and will respond as quickly as possible.
          </p>
        </div>
      </div>
    </div>
  )
}
