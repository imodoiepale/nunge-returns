export default function PrivacyPage() {
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold">Privacy Policy</h1>
        <p className="mt-6 text-muted-foreground">Last updated: December 17, 2024</p>

        <div className="mt-12 space-y-12">
          <section>
            <h2 className="text-2xl font-semibold">Information We Collect</h2>
            <div className="mt-6 space-y-4">
              <p>We collect information that you provide directly to us, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Personal identification information (name, email address, phone number)</li>
                <li>Financial information necessary for tax filing</li>
                <li>Employment and income information</li>
                <li>Social security numbers and tax identification numbers</li>
                <li>Documents uploaded to our platform</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">How We Use Your Information</h2>
            <div className="mt-6 space-y-4">
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Process and file your tax returns</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Improve our services and develop new features</li>
                <li>Comply with legal obligations and tax regulations</li>
                <li>Prevent fraud and enhance security</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Data Security</h2>
            <div className="mt-6 space-y-4">
              <p>
                We implement robust security measures to protect your information, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>End-to-end encryption for data transmission</li>
                <li>Secure data storage with regular backups</li>
                <li>Access controls and authentication measures</li>
                <li>Regular security audits and assessments</li>
                <li>Employee training on data protection</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Data Sharing and Disclosure</h2>
            <div className="mt-6 space-y-4">
              <p>We may share your information with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Tax authorities as required by law</li>
                <li>Service providers who assist in our operations</li>
                <li>Legal authorities when required by law</li>
                <li>Third parties with your explicit consent</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Your Rights</h2>
            <div className="mt-6 space-y-4">
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Opt-out of marketing communications</li>
                <li>File a complaint with regulatory authorities</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Contact Us</h2>
            <div className="mt-6">
              <p>
                If you have any questions about our privacy policy or practices, please contact
                our privacy team at privacy@nungereturns.com
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
