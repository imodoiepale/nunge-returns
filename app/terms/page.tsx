export default function TermsPage() {
  return (
    <div className=" py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold">Terms of Service</h1>
        <p className="mt-6 text-muted-foreground">Last updated: December 17, 2024</p>

        <div className="mt-12 space-y-12">
          <section>
            <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
            <div className="mt-6 space-y-4">
              <p>
                By accessing or using Nunge Returns services, you agree to be bound by these
                Terms of Service. If you disagree with any part of the terms, you may not
                access the service.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">2. Service Description</h2>
            <div className="mt-6 space-y-4">
              <p>
                Nunge Returns provides online tax preparation and filing services. We help
                users prepare and file their tax returns electronically with relevant tax
                authorities.
              </p>
              <p>Our services include:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Tax return preparation and filing</li>
                <li>Document storage and management</li>
                <li>Tax calculation and estimation</li>
                <li>Customer support and guidance</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">3. User Responsibilities</h2>
            <div className="mt-6 space-y-4">
              <p>You agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the confidentiality of your account</li>
                <li>Notify us of any unauthorized account access</li>
                <li>Comply with all applicable tax laws and regulations</li>
                <li>Use the service only for lawful purposes</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">4. Payment Terms</h2>
            <div className="mt-6 space-y-4">
              <p>
                Certain services require payment. You agree to pay all fees according to the
                pricing plan you select. Fees are non-refundable except where required by
                law.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">5. Intellectual Property</h2>
            <div className="mt-6 space-y-4">
              <p>
                All content, features, and functionality of our service are owned by Nunge
                Returns and are protected by international copyright, trademark, and other
                intellectual property laws.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">6. Limitation of Liability</h2>
            <div className="mt-6 space-y-4">
              <p>
                Nunge Returns shall not be liable for any indirect, incidental, special,
                consequential, or punitive damages resulting from your use of or inability to
                use the service.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">7. Changes to Terms</h2>
            <div className="mt-6 space-y-4">
              <p>
                We reserve the right to modify these terms at any time. We will notify users
                of any material changes via email or through the service.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">8. Contact Information</h2>
            <div className="mt-6">
              <p>
                For questions about these Terms of Service, please contact us at
                legal@nungereturns.com
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
