// @ts-nocheck

"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, BookmarkPlus, Share2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

// Interfaces remain the same
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

interface ApplicationForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  linkedIn: string
  coverLetter: string
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
  const [showApplicationDialog, setShowApplicationDialog] = useState(false)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
      <div className="h-screen flex">
        <ScrollArea className={`${selectedPosition ? 'w-1/2' : 'w-full'} transition-all duration-300`}>
          <div className="p-8 space-y-8">
            <div className="text-center space-y-3">
              <h1 className="text-2xl font-bold tracking-tight text-indigo-900">Careers at Nunge Returns</h1>
              <p className="text-base text-indigo-600">
                Join our team and help revolutionize tax compliance in Kenya.
              </p>
            </div>

            <div className="flex gap-2 justify-center">
              <Select onValueChange={(value) => setFilter({ ...filter, department: value === "all" ? "" : value })}>
                <SelectTrigger className="w-[140px] text-xs bg-white/80 border-emerald-200">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Research">Research</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => setFilter({ ...filter, type: value === "all" ? "" : value })}>
                <SelectTrigger className="w-[140px] text-xs bg-white/80 border-emerald-200">
                  <SelectValue placeholder="Job Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Full-Time">Full-Time</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => setFilter({ ...filter, location: value === "all" ? "" : value })}>
                <SelectTrigger className="w-[140px] text-xs bg-white/80 border-emerald-200">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="Nairobi, Kenya">Nairobi, Kenya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {filteredPositions.map((position) => (
                <Card
                  key={position.id}
                  className={`cursor-pointer transition-all duration-300 backdrop-blur-md bg-white/80 border-emerald-200 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100/50 ${
                    selectedPosition?.id === position.id ? 'border-emerald-500' : ''
                  }`}
                  onClick={() => handleOpen(position)}
                >
                  <CardHeader className="p-3">
                    <div className="flex flex-col space-y-2">
                      <div>
                        <CardTitle className="text-sm font-semibold text-indigo-900">{position.title}</CardTitle>
                        <CardDescription className="text-xs mt-0.5 text-indigo-600">{position.location}</CardDescription>
                      </div>
                      <div className="flex gap-1.5">
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px]">{position.type}</Badge>
                        <Badge variant="outline" className="border-emerald-200 text-indigo-600 text-[10px]">{position.department}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </ScrollArea>

        {selectedPosition && (
          <div className="w-1/2 transition-all duration-300">
            <div className="h-screen flex flex-col bg-white/95 border-l border-emerald-100">
              <div className="sticky top-0 z-10 border-b border-emerald-100 bg-white/95 backdrop-blur-sm p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-indigo-900">{selectedPosition.title}</h2>
                    <p className="text-sm text-indigo-600">{selectedPosition.location}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button 
                      size="sm" 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => setShowApplicationDialog(true)}
                    >
                      Apply Now
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="border-emerald-200 text-indigo-600 hover:bg-emerald-50">
                        <BookmarkPlus className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="border-emerald-200 text-indigo-600 hover:bg-emerald-50">
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="border-emerald-200 text-indigo-600 hover:bg-emerald-50" onClick={() => setSelectedPosition(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-4 gap-x-8 gap-y-2 text-sm">
                  {[
                    { label: "Date posted", value: selectedPosition.datePosted },
                    { label: "Job number", value: selectedPosition.jobNumber },
                    { label: "Work site", value: selectedPosition.worksite },
                    { label: "Travel", value: selectedPosition.travel },
                    { label: "Role type", value: selectedPosition.roleType },
                    { label: "Profession", value: selectedPosition.profession },
                    { label: "Discipline", value: selectedPosition.discipline },
                    { label: "Employment type", value: selectedPosition.employmentType },
                  ].map((detail, index) => (
                    <div key={index} className="flex flex-col">
                      <span className="text-indigo-600">{detail.label}</span>
                      <span className="text-indigo-900">{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="space-y-8 p-6 pb-24">
                  {[
                    {
                      title: "Overview", content: selectedPosition.overview.map((p, i) =>
                        <p key={i} className="text-sm text-indigo-800 leading-relaxed mb-4">{p}</p>
                      )
                    },
                    {
                      title: "Responsibilities", content:
                        <ul className="list-disc pl-5 space-y-2">
                          {selectedPosition.responsibilities.map((r, i) =>
                            <li key={i} className="text-sm text-indigo-800">{r}</li>
                          )}
                        </ul>
                    },
                    {
                      title: "Required Qualifications", content:
                        <ul className="list-disc pl-5 space-y-2">
                          {selectedPosition.requiredQualifications.map((q, i) =>
                            <li key={i} className="text-sm text-indigo-800">{q}</li>
                          )}
                        </ul>
                    },
                    {
                      title: "Preferred Qualifications", content:
                        <ul className="list-disc pl-5 space-y-2">
                          {selectedPosition.preferredQualifications.map((q, i) =>
                            <li key={i} className="text-sm text-indigo-800">{q}</li>
                          )}
                        </ul>
                    },
                    {
                      title: "Additional Requirements", content:
                        <ul className="list-disc pl-5 space-y-2">
                          {selectedPosition.additionalRequirements.map((r, i) =>
                            <li key={i} className="text-sm text-indigo-800">{r}</li>
                          )}
                        </ul>
                    },
                    {
                      title: "Compensation", content:
                        <p className="text-sm text-indigo-800">{selectedPosition.compensation}</p>
                    }
                  ].map((section, index) => (
                    <section key={index} className="space-y-4">
                      <h3 className="text-lg font-semibold text-indigo-900">{section.title}</h3>
                      {section.content}
                    </section>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {showApplicationDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-[500px] h-[85vh] flex flex-col bg-white/95 border-emerald-200">
              <CardHeader className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-emerald-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-indigo-900">Apply for Position</CardTitle>
                    <CardDescription className="text-sm mt-1 text-indigo-600">{selectedPosition?.title}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-emerald-200 text-indigo-600 hover:bg-emerald-50"
                    onClick={() => setShowApplicationDialog(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <ScrollArea className="flex-1">
                <CardContent className="space-y-6 p-6">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: "firstName", label: "First Name", type: "text", placeholder: "Enter first name" },
                      { id: "lastName", label: "Last Name", type: "text", placeholder: "Enter last name" },
                    ].map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id} className="text-sm text-indigo-900">{field.label}</Label>
                        <Input 
                          id={field.id} 
                          type={field.type} 
                          placeholder={field.placeholder} 
                          className="text-sm bg-white/80 border-emerald-200 focus:border-emerald-300 focus:ring-emerald-200" 
                        />
                      </div>
                    ))}
                  </div>

                  {[
                    { id: "email", label: "Email", type: "email", placeholder: "Enter email address" },
                    { id: "phone", label: "Phone Number", type: "tel", placeholder: "Enter phone number" },
                    { id: "linkedin", label: "LinkedIn Profile", type: "url", placeholder: "Enter LinkedIn URL" },
                  ].map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id} className="text-sm text-indigo-900">{field.label}</Label>
                      <Input 
                        id={field.id} 
                        type={field.type} 
                        placeholder={field.placeholder} 
                        className="text-sm bg-white/80 border-emerald-200 focus:border-emerald-300 focus:ring-emerald-200" 
                      />
                    </div>
                  ))}

                  {[
                    { id: "cv", label: "CV/Resume" },
                    { id: "coverLetter", label: "Cover Letter" },
                  ].map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id} className="text-sm text-indigo-900">{field.label}</Label>
                      <div className="space-y-1">
                        <Input 
                          id={field.id} 
                          type="file" 
                          accept=".pdf,.doc,.docx" 
                          className="text-sm bg-white/80 border-emerald-200 focus:border-emerald-300 focus:ring-emerald-200" 
                        />
                        <p className="text-xs text-indigo-600">
                          Accepted formats: PDF, DOC, DOCX (Max size: 5MB)
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </ScrollArea>

              <div className="sticky bottom-0 p-6 bg-white/95 border-t border-emerald-100">
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-emerald-200 text-indigo-600 hover:bg-emerald-50"
                    onClick={() => setShowApplicationDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Submit Application
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}