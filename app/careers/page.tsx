"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, BookmarkPlus, Share2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface JobDetail {
  label: string
  value: string
}

interface JobPosition {
  id: string
  title: string
  location: string
  type: string
  department: string
  jobNumber: string
  worksite: string
  travel: string
  roleType: string
  profession: string
  discipline: string
  employmentType: string
  datePosted: string
  description: string
  overview: string[]
  responsibilities: string[]
  requiredQualifications: string[]
  preferredQualifications: string[]
  additionalRequirements: string[]
  compensation: string
}

const jobPositions: JobPosition[] = [
  {
    id: "1",
    title: "Research Intern - Data Center and AI Networking",
    location: "Nairobi, Kenya",
    type: "Internship",
    department: "Research",
    jobNumber: "1790686",
    worksite: "Up to 50% work from home",
    travel: "None",
    roleType: "Individual Contributor",
    profession: "Research, Applied, & Data Sciences",
    discipline: "Applied Sciences",
    employmentType: "Internship",
    datePosted: "Dec 05, 2024",
    description: "Transport and Telemetry Research Position",
    overview: [
      "Research Internships at Microsoft provide a dynamic environment for research careers with a network of world-class research labs led by globally-recognized scientists and engineers, who pursue innovation in a range of scientific and technical disciplines to help solve complex challenges in diverse fields, including computing, healthcare, economics, and the environment.",
      "As a Research Intern in the Strategic Planning and Architecture (SPARC) group, you will contribute to the design and development of transport features and telemetry systems for data center and AI networking environments. This role encompasses topics such as congestion control, load balancing, network reliability, and telemetry, with a focus on a specific subset of these areas relevant to the internship. You will have the opportunity to validate these solutions within a testbed environment and may utilize simulation tools to guide solution design.",
      "Applicants should demonstrate depth of knowledge in networking and demonstrate experience in low-level programming, experimentation, and modeling. Experience in software and hardware network programming is a plus, as it will aid in developing and prototyping networking solutions."
    ],
    responsibilities: [
      "Design and develop transport features for data center networks",
      "Create and implement telemetry systems",
      "Validate solutions in testbed environments",
      "Use simulation tools for solution design",
      "Collaborate with research teams on networking innovations"
    ],
    requiredQualifications: [
      "Currently enrolled in a PhD program in Computer Science or a related STEM field"
    ],
    preferredQualifications: [
      "Background in computer networking with a thorough understanding of transport protocols, congestion control",
      "Familiarity with network simulation environments (e.g., NS3, OMNET++) or experience with hardware RTL development (Verilog/VHDL) and prototyping (FPGA / ASIC)",
      "Experience building networked systems and programming networking hardware, e.g. NICs and/or switches in datacenters",
      "Familiarity with large language models, and experience training them at scale, or running inference"
    ],
    additionalRequirements: [
      "Research Interns are expected to be physically located in their manager's Microsoft worksite location for the duration of their internship",
      "In addition to the qualifications below, you'll need to submit a minimum of two reference letters for this position as well as a cover letter and any relevant work or research samples",
      "After you submit your application, a request for letters may be sent to your list of references on your behalf. Note that reference letters cannot be requested until after you have submitted your application"
    ],
    compensation: "The base pay range for this internship is USD $6,550 - $12,880 per month"
  },
  {
    id: "2",
    title: "Software Engineer - Cloud and AI",
    location: "Nairobi, Kenya",
    type: "Full-Time",
    department: "Engineering",
    jobNumber: "1790687",
    worksite: "Microsoft Kenya",
    travel: "Up to 20%",
    roleType: "Individual Contributor",
    profession: "Software Engineering",
    discipline: "Computer Science",
    employmentType: "Full-Time",
    datePosted: "Dec 05, 2024",
    description: "Cloud and AI Engineer",
    overview: [
      "Cloud and AI engineers at Microsoft are responsible for designing, developing and operating the cloud-based services that power Microsoft's online products such as Bing, Office 365, and Xbox Live. As a cloud and AI engineer, you will be responsible for building and maintaining the cloud infrastructure, developing software applications, and working with data scientists to develop and deploy AI models. You will be part of a global engineering team that is responsible for delivering high-quality cloud-based services to customers around the world."
    ],
    responsibilities: [
      "Design, develop and operate cloud-based services",
      "Develop software applications using a variety of programming languages such as C#, Java, Python",
      "Work with data scientists to develop and deploy AI models",
      "Collaborate with cross-functional teams to identify and prioritize engineering projects",
      "Develop and maintain technical documentation"
    ],
    requiredQualifications: [
      "Bachelor's degree in Computer Science or related field",
      "Experience with cloud-based services such as Azure, AWS, Google Cloud Platform",
      "Experience with software development using languages such as C#, Java, Python",
      "Experience with data structures, algorithms, and software design patterns"
    ],
    preferredQualifications: [
      "Master's degree in Computer Science or related field",
      "Experience with AI/ML frameworks such as TensorFlow, PyTorch",
      "Experience with data engineering tools such as Apache Spark, Apache Hadoop",
      "Experience with DevOps practices such as continuous integration and continuous deployment",
      "Experience with agile development methodologies such as Scrum, Kanban"
    ],
    additionalRequirements: [
      "Must be able to work in a fast-paced environment and prioritize multiple projects",
      "Must be able to work independently and as part of a team",
      "Must be able to communicate technical information to non-technical stakeholders"
    ],
    compensation: "The base pay range for this position is USD $100,000 - $150,000 per year"
  },
  {
    id: "3",
    title: "Research Engineer - AI and Mixed Reality",
    location: "Nairobi, Kenya",
    type: "Full-Time",
    department: "Research",
    jobNumber: "1790688",
    worksite: "Microsoft Kenya",
    travel: "Up to 20%",
    roleType: "Individual Contributor",
    profession: "Research, Applied, & Data Sciences",
    discipline: "Computer Vision",
    employmentType: "Full-Time",
    datePosted: "Dec 05, 2024",
    description: "AI and Mixed Reality Research Engineer",
    overview: [
      "As a Research Engineer in the AI and Mixed Reality group, you will be responsible for developing and deploying AI models for a variety of applications such as computer vision, natural language processing, and robotics. You will work closely with researchers and engineers to develop and deploy AI models, and will be responsible for developing and maintaining technical documentation."
    ],
    responsibilities: [
      "Develop and deploy AI models for a variety of applications",
      "Work closely with researchers and engineers to develop and deploy AI models",
      "Develop and maintain technical documentation",
      "Collaborate with cross-functional teams to identify and prioritize engineering projects",
      "Develop and maintain technical documentation"
    ],
    requiredQualifications: [
      "Bachelor's degree in Computer Science or related field",
      "Experience with AI/ML frameworks such as TensorFlow, PyTorch",
      "Experience with data engineering tools such as Apache Spark, Apache Hadoop",
      "Experience with DevOps practices such as continuous integration and continuous deployment",
      "Experience with agile development methodologies such as Scrum, Kanban"
    ],
    preferredQualifications: [
      "Master's degree in Computer Science or related field",
      "Experience with mixed reality technologies such as HoloLens, ARKit",
      "Experience with computer vision and machine learning algorithms",
      "Experience with data structures, algorithms, and software design patterns"
    ],
    additionalRequirements: [
      "Must be able to work in a fast-paced environment and prioritize multiple projects",
      "Must be able to work independently and as part of a team",
      "Must be able to communicate technical information to non-technical stakeholders"
    ],
    compensation: "The base pay range for this position is USD $100,000 - $150,000 per year"
  }
]

export default function CareersPage() {
  const [selectedPosition, setSelectedPosition] = useState<JobPosition | null>(null)
  const [filter, setFilter] = useState({
    department: "",
    type: "",
    location: ""
  })

  const handleOpen = (position: JobPosition) => {
    setSelectedPosition(position)
  }

  const filteredPositions = jobPositions.filter(position => {
    return (
      (!filter.department || position.department === filter.department) &&
      (!filter.type || position.type === filter.type) &&
      (!filter.location || position.location === filter.location)
    )
  })

  const renderJobDetails = (details: JobDetail[]) => (
    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
      {details.map((detail, index) => (
        <div key={index} className="flex flex-col">
          <span className="text-muted-foreground">{detail.label}</span>
          <span>{detail.value}</span>
        </div>
      ))}
    </div>
  )

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight">Careers at Nunge Returns</h1>
            <p className="text-lg text-muted-foreground">
              Join our team and help revolutionize tax compliance in Kenya.
            </p>
          </div>

          <div className="flex gap-4">
            <Select onValueChange={(value) => setFilter({ ...filter, department: value === "all" ? "" : value })}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Research">Research</SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => setFilter({ ...filter, type: value === "all" ? "" : value })}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Full-Time">Full-Time</SelectItem>
                <SelectItem value="Internship">Internship</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => setFilter({ ...filter, location: value === "all" ? "" : value })}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="Nairobi, Kenya">Nairobi, Kenya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredPositions.map((position) => (
              <Card 
                key={position.id} 
                className={`cursor-pointer transition-colors ${
                  selectedPosition?.id === position.id ? 'border-primary' : 'hover:bg-accent'
                }`}
                onClick={() => handleOpen(position)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">{position.title}</CardTitle>
                      <CardDescription className="text-sm">{position.location}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">{position.type}</Badge>
                      <Badge variant="outline" className="text-xs">{position.department}</Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {selectedPosition && (
        <div className="w-[1080px] border-l mt-12">
          <div className="sticky top-[3rem] z-10 border-b bg-background p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold">{selectedPosition.title}</h2>
                <p className="text-base text-muted-foreground">{selectedPosition.location}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <BookmarkPlus className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Share2 className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setSelectedPosition(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="mt-6">
              {renderJobDetails([
                { label: "Date posted", value: selectedPosition.datePosted },
                { label: "Job number", value: selectedPosition.jobNumber },
                { label: "Work site", value: selectedPosition.worksite },
                { label: "Travel", value: selectedPosition.travel },
                { label: "Role type", value: selectedPosition.roleType },
                { label: "Profession", value: selectedPosition.profession },
                { label: "Discipline", value: selectedPosition.discipline },
                { label: "Employment type", value: selectedPosition.employmentType }
              ])}
            </div>
          </div>
          
          <div className="h-[calc(150vh-20rem)] overflow-y-auto p-6 space-y-8">
            <section className="space-y-4">
              <h3 className="text-xl font-semibold">Overview</h3>
              {selectedPosition.overview.map((paragraph, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed">{paragraph}</p>
              ))}
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-semibold">Responsibilities</h3>
              <ul className="list-disc pl-6 space-y-2">
                {selectedPosition.responsibilities.map((resp, i) => (
                  <li key={i} className="text-sm text-muted-foreground">{resp}</li>
                ))}
              </ul>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-semibold">Required Qualifications</h3>
              <ul className="list-disc pl-6 space-y-2">
                {selectedPosition.requiredQualifications.map((qual, i) => (
                  <li key={i} className="text-sm text-muted-foreground">{qual}</li>
                ))}
              </ul>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-semibold">Preferred Qualifications</h3>
              <ul className="list-disc pl-6 space-y-2">
                {selectedPosition.preferredQualifications.map((qual, i) => (
                  <li key={i} className="text-sm text-muted-foreground">{qual}</li>
                ))}
              </ul>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-semibold">Additional Requirements</h3>
              <ul className="list-disc pl-6 space-y-2">
                {selectedPosition.additionalRequirements.map((req, i) => (
                  <li key={i} className="text-sm text-muted-foreground">{req}</li>
                ))}
              </ul>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-semibold">Compensation</h3>
              <p className="text-sm text-muted-foreground">{selectedPosition.compensation}</p>
            </section>

            <section className="pt-4">
              <div className="sticky bottom-0 bg-background p-4">
                <Button className="w-full" size="lg">
                  Apply
                </Button>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  )
  }
