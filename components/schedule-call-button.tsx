"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X } from "lucide-react"

export function ScheduleCallButton() {
  const [open, setOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" className="rounded-full" onClick={() => setOpen(true)}>
        Schedule a Call
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-[500px] h-[85vh] flex flex-col bg-white/95 border-emerald-200">
            <CardHeader className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-emerald-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-indigo-900">Schedule a Call</CardTitle>
                  <CardDescription className="text-sm mt-1 text-indigo-600">Book a consultation with our tax experts</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-emerald-200 text-indigo-600 hover:bg-emerald-50"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <ScrollArea className="flex-1">
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 p-6">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: "firstName", label: "First Name", type: "text", placeholder: "Enter first name" },
                      { id: "lastName", label: "Last Name", type: "text", placeholder: "Enter last name" },
                      { id: "email", label: "Email", type: "email", placeholder: "Enter email address" },
                      { id: "phone", label: "Phone Number", type: "tel", placeholder: "Enter phone number" },
                      { id: "company", label: "Company", type: "text", placeholder: "Enter company name" },
                      { id: "position", label: "Position", type: "text", placeholder: "Enter your position" },
                    ].map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id} className="text-sm text-indigo-900">{field.label}</Label>
                        <Input 
                          id={field.id} 
                          type={field.type} 
                          placeholder={field.placeholder}
                          required
                          className="text-sm bg-white/80 border-emerald-200 focus:border-emerald-300 focus:ring-emerald-200" 
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm text-indigo-900">Message</Label>
                    <textarea
                      id="message"
                      rows={4}
                      required
                      placeholder="Tell us about your tax needs"
                      className="w-full rounded-md text-sm bg-white/80 border-emerald-200 focus:border-emerald-300 focus:ring-emerald-200 p-3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferredTime" className="text-sm text-indigo-900">Preferred Time</Label>
                    <Input 
                      id="preferredTime" 
                      type="datetime-local"
                      required
                      className="text-sm bg-white/80 border-emerald-200 focus:border-emerald-300 focus:ring-emerald-200" 
                    />
                    <p className="text-xs text-indigo-600">
                      Please select your preferred date and time for the call
                    </p>
                  </div>
                </CardContent>

                <div className="sticky bottom-0 p-6 bg-white/95 border-t border-emerald-100">
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-emerald-200 text-indigo-600 hover:bg-emerald-50"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Schedule Call
                    </Button>
                  </div>
                </div>
              </form>
            </ScrollArea>
          </Card>
        </div>
      )}
    </Dialog>
  )
}
