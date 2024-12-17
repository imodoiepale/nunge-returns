import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

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
        "Yes, our platform supports filing returns for previous tax years. You can access and file returns for up to 7 years back, subject to your subscription plan.",
    },
    {
      question: "How do I know if my return is accurate?",
      answer:
        "Our system includes multiple accuracy checks and validation steps. We review your return for common errors, missing information, and potential audit triggers before submission.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards, PayPal, and bank transfers. Payment is only required when you're ready to file your return, and you can try our platform for free.",
    },
    {
      question: "How do I get my refund?",
      answer:
        "You can choose to receive your refund via direct deposit to your bank account (fastest method), paper check by mail, or apply it to next year's taxes.",
    },
  ]

  return (
    <div className=" py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">Frequently Asked Questions</h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Find answers to common questions about our tax filing service
        </p>
      </div>
      <div className="mx-auto mt-16 max-w-3xl">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}
