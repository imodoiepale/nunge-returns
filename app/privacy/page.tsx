import { PageBackground } from "@/components/ui/page-background"

export default function PrivacyPage() {
  return (
    <PageBackground>
      <div className="mx-auto max-w-2xl px-4">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-cyan-600 to-purple-600 animate-gradient">Privacy Policy</h1>
        <p className="mt-4 text-sm text-cyan-700">Last updated: December 17, 2024</p>

        <div className="mt-8 space-y-8">
          <section className="space-y-2 p-4 rounded-lg border border-purple-200 bg-white/50 backdrop-blur-md hover:border-purple-300 transition-colors duration-300 shadow-lg">
            <h2 className="text-lg font-bold text-purple-700">Information We Collect</h2>
            <div className="mt-3 space-y-2">
              <p className="text-sm text-gray-600">We collect information that you provide directly to us, including:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                <li>Personal identification information (name, email address, phone number)</li>
                <li>Financial information necessary for tax filing</li>
                <li>Employment and income information</li>
                <li>Social security numbers and tax identification numbers</li>
                <li>Documents uploaded to our platform</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2 p-4 rounded-lg border border-cyan-200 bg-white/50 backdrop-blur-md hover:border-cyan-300 transition-colors duration-300 shadow-lg">
            <h2 className="text-lg font-bold text-cyan-700">How We Use Your Information</h2>
            <div className="mt-3 space-y-2">
              <p className="text-sm text-gray-600">We use the information we collect to:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                <li>Process and file your tax returns</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Improve our services and develop new features</li>
                <li>Comply with legal obligations and tax regulations</li>
                <li>Prevent fraud and enhance security</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2 p-4 rounded-lg border border-purple-200 bg-white/50 backdrop-blur-md hover:border-purple-300 transition-colors duration-300 shadow-lg">
            <h2 className="text-lg font-bold text-purple-700">Data Security</h2>
            <div className="mt-3 space-y-2">
              <p className="text-sm text-gray-600">
                We implement robust security measures to protect your information, including:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                <li>End-to-end encryption for data transmission</li>
                <li>Secure data storage with regular backups</li>
                <li>Access controls and authentication measures</li>
                <li>Regular security audits and assessments</li>
                <li>Employee training on data protection</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2 p-4 rounded-lg border border-cyan-200 bg-white/50 backdrop-blur-md hover:border-cyan-300 transition-colors duration-300 shadow-lg">
            <h2 className="text-lg font-bold text-cyan-700">Data Sharing and Disclosure</h2>
            <div className="mt-3 space-y-2">
              <p className="text-sm text-gray-600">We may share your information with:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                <li>Tax authorities as required by law</li>
                <li>Service providers who assist in our operations</li>
                <li>Legal authorities when required by law</li>
                <li>Third parties with your explicit consent</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2 p-4 rounded-lg border border-purple-200 bg-white/50 backdrop-blur-md hover:border-purple-300 transition-colors duration-300 shadow-lg">
            <h2 className="text-lg font-bold text-purple-700">Your Rights</h2>
            <div className="mt-3 space-y-2">
              <p className="text-sm text-gray-600">You have the right to:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Opt-out of marketing communications</li>
                <li>File a complaint with regulatory authorities</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2 p-4 rounded-lg border border-cyan-200 bg-white/50 backdrop-blur-md hover:border-cyan-300 transition-colors duration-300 shadow-lg">
            <h2 className="text-lg font-bold text-cyan-700">Contact Us</h2>
            <div className="mt-3">
              <p className="text-sm text-gray-600">
                If you have any questions about our privacy policy or practices, please contact
                our privacy team at privacy@nungereturns.com
              </p>
            </div>
          </section>
        </div>
      </div>
    </PageBackground>
  )
}
