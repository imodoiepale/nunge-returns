"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import Link from "next/link"

export default function FAQPage() {
  const faqs = [
    {
      question: "How secure is my data?",
      answer:
        "We employ bank-level encryption and security measures to protect your data. All information is encrypted both in transit and at rest, and we regularly undergo security audits to ensure the highest level of protection.",
    },
    {
      question: "What documents do I need to file my tax return?",
      answer:
        "You'll need your W-2 forms from employers, 1099 forms for contract work or investments, receipts for deductions, and social security numbers for you and your dependents. Our system will guide you through the specific documents needed based on your situation.",
    },
    {
      question: "How long does it take to complete a tax return?",
      answer:
        "Most users complete their returns in 30-60 minutes. However, the time can vary depending on the complexity of your tax situation and whether you have all necessary documents ready.",
    },
    {
      question: "What if I need help while filing?",
      answer:
        "We offer multiple support options including live chat, email support, and detailed help documentation. Professional users also get priority support with direct access to tax experts.",
    },
    {
      question: "Can I file taxes for multiple years?",
      answer:
        "Yes, you can file returns for previous tax years. However, please note that different rules and requirements may apply for past years, and our system will guide you through these differences.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards, debit cards, and bank transfers. Payment is only required after you've completed your return and are ready to file.",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-indigo-900">Frequently Asked Questions</h1>
          <p className="mt-2 text-indigo-600">
            Find answers to common questions about our tax filing service
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="p-6 rounded-lg bg-white/80 backdrop-blur-sm border border-emerald-200 hover:border-emerald-300 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-indigo-900 mb-3">{faq.question}</h3>
              <p className="text-indigo-800">{faq.answer}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-lg bg-white/80 backdrop-blur-sm border border-emerald-200 text-center">
          <h2 className="text-lg font-semibold text-indigo-900 mb-2">Still have questions?</h2>
          <p className="text-indigo-800 mb-4">
            Our support team is here to help you with any questions you may have.
          </p>
          <Link 
            href="/contact"
            className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors duration-300"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  )
}
