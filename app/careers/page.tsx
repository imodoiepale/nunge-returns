"use client"
import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface JobPosition {
  id: string
  title: string
  location: string
  type: string
  department: string
  description: string
  requirements: string[]
  responsibilities: string[]
}

const jobPositions: JobPosition[] = [
  {
    id: "1",
    title: "Full Stack Developer",
    location: "Nairobi, Kenya",
    type: "Full-Time",
    department: "Engineering",
    description: "Join our engineering team to help build and scale our tax compliance platform.",
    requirements: [
      "3+ years of experience in full-stack development",
      "Proficiency in React, Node.js, and TypeScript",
      "Experience with cloud platforms (AWS/Azure)",
      "Strong problem-solving skills"
    ],
    responsibilities: [
      "Develop and maintain our web applications",
      "Collaborate with cross-functional teams",
      "Implement best practices for code quality",
      "Participate in code reviews and technical discussions"
    ]
  },
  {
    id: "2",
    title: "UX/UI Designer",
    location: "Nairobi, Kenya",
    type: "Full-Time",
    department: "Design",
    description: "Help create beautiful and intuitive user experiences for our products.",
    requirements: [
      "3+ years of UX/UI design experience",
      "Proficiency in Figma and design tools",
      "Strong portfolio demonstrating user-centered design",
      "Experience with design systems"
    ],
    responsibilities: [
      "Create user-centered designs",
      "Conduct user research and testing",
      "Collaborate with developers",
      "Maintain and evolve our design system"
    ]
  }
]

export default function CareersPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<JobPosition | null>(null)
  const [filter, setFilter] = useState({
    department: "",
    type: "",
    location: ""
  })

  const handleOpen = (position: JobPosition) => {
    setSelectedPosition(position)
    setIsOpen(true)
  }

  const filteredPositions = jobPositions.filter(position => {
    return (
      (!filter.department || position.department === filter.department) &&
      (!filter.type || position.type === filter.type) &&
      (!filter.location || position.location === filter.location)
    )
  })

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter">Careers at Nunge Returns</h1>
          <p className="text-xl text-muted-foreground">
            Join our team and help revolutionize tax compliance in Kenya. We're looking for talented individuals passionate about technology and finance.
          </p>
        </div>

        <div className="flex gap-4">
          <Select onValueChange={(value) => setFilter({ ...filter, department: value === "all" ? "" : value })}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Design">Design</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => setFilter({ ...filter, type: value === "all" ? "" : value })}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Full-Time">Full-Time</SelectItem>
              <SelectItem value="Part-Time">Part-Time</SelectItem>
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
            <Card key={position.id} className="cursor-pointer hover:bg-accent" onClick={() => handleOpen(position)}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{position.title}</CardTitle>
                    <CardDescription>{position.location}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge>{position.type}</Badge>
                    <Badge variant="outline">{position.department}</Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedPosition?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold">Description</h3>
                <p className="text-muted-foreground">{selectedPosition?.description}</p>
              </div>
              
              <div>
                <h3 className="font-semibold">Requirements</h3>
                <ul className="list-disc pl-6 text-muted-foreground">
                  {selectedPosition?.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold">Responsibilities</h3>
                <ul className="list-disc pl-6 text-muted-foreground">
                  {selectedPosition?.responsibilities.map((resp, i) => (
                    <li key={i}>{resp}</li>
                  ))}
                </ul>
              </div>

              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" placeholder="john.doe@example.com" type="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cv">CV</Label>
                  <Input id="cv" type="file" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Cover Letter</Label>
                  <Textarea id="message" placeholder="Tell us about yourself and why you're interested in joining our team." />
                </div>
                <div className="flex justify-end">
                  <Button type="submit">Submit Application</Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
