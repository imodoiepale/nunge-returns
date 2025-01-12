export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-indigo-900">Terms of Service</h1>
          <p className="mt-2 text-sm text-indigo-600">Last updated: December 17, 2024</p>
        </div>

        <div className="space-y-8">
          {[
            {
              title: "1. Acceptance of Terms",
              content: "By accessing or using Nunge Returns services, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service."
            },
            {
              title: "2. Service Description",
              content: "Nunge Returns provides online tax preparation and filing services. We help users prepare and file their tax returns electronically with relevant tax authorities."
            },
            {
              title: "3. User Accounts",
              content: "When you create an account with us, you must provide accurate and complete information. You are responsible for maintaining the security of your account and password."
            },
            {
              title: "4. Privacy and Data Protection",
              content: "Your privacy is important to us. Our Privacy Policy describes how we handle your personal information and protect your data."
            },
            {
              title: "5. Service Fees",
              content: "Fees for our services are clearly displayed before you begin using them. You agree to pay all fees associated with your use of our services."
            }
          ].map((section, index) => (
            <div 
              key={index}
              className="p-6 rounded-lg bg-white/80 backdrop-blur-sm border border-emerald-200 hover:border-emerald-300 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <h2 className="text-xl font-semibold text-indigo-900 mb-4">{section.title}</h2>
              <p className="text-indigo-800">{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
