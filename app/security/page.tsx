"use client"

import { Shield, Lock, Server, UserCheck, ShieldCheck, FileKey } from "lucide-react"

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
      icon: ShieldCheck,
      title: "Compliance Standards",
      description:
        "We adhere to international security standards and maintain compliance with relevant data protection regulations.",
    },
    {
      icon: FileKey,
      title: "Secure File Handling",
      description:
        "All tax documents and sensitive files are encrypted and handled with the highest security measures.",
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-indigo-900">Security First Approach</h1>
          <p className="mt-2 text-indigo-600 max-w-2xl mx-auto">
            Your security is our top priority. We employ industry-leading security measures to protect your sensitive information.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="p-6 rounded-lg bg-white/80 backdrop-blur-sm border border-emerald-200 hover:border-emerald-300 transition-all duration-300 shadow-sm hover:shadow-md group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-2 rounded-full bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200 transition-colors duration-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-indigo-900">{feature.title}</h3>
                </div>
                <p className="text-indigo-800">{feature.description}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-16 p-6 rounded-lg bg-white/80 backdrop-blur-sm border border-emerald-200">
          <h2 className="text-xl font-semibold text-indigo-900 mb-4">Our Security Commitment</h2>
          <p className="text-indigo-800">
            At Nunge Returns, we understand the sensitive nature of tax information. That's why we've implemented comprehensive security measures to ensure your data remains protected at all times. Our team of security experts continuously monitors and updates our systems to maintain the highest level of protection.
          </p>
        </div>
      </div>
    </div>
  )
}
