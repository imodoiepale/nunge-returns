export default function CareersPage() {
  return (
    <div className="container py-24">
      <div className="mx-auto max-w-4xl space-y-8">
        <h1 className="text-4xl font-bold tracking-tighter">Careers at Nunge Returns</h1>
        <p className="text-xl text-muted-foreground">
          Join our team and help revolutionize tax compliance in Kenya. We're always looking for talented individuals passionate about technology and finance.
        </p>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tighter">Open Positions</h2>
          <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
            <li>Full Stack Developer</li>
            <li>UX/UI Designer</li>
            <li>Customer Support Specialist</li>
            <li>Marketing Manager</li>
          </ul>
        </div>
        <p className="text-xl text-muted-foreground">
          If you don't see a position that fits your skills but are excited about our mission, feel free to send us your resume. We're always interested in meeting great talent!
        </p>
      </div>
    </div>
  )
}

