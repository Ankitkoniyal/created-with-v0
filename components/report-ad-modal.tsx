"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Flag } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ReportAdModalProps {
  adId: string
  adTitle: string
  children: React.ReactNode
}

const reportReasons = [
  { id: "spam", label: "Spam or repetitive content" },
  { id: "fraud", label: "Fraud or scam" },
  { id: "inappropriate", label: "Inappropriate content" },
  { id: "duplicate", label: "Duplicate listing" },
  { id: "misleading", label: "Misleading information" },
  { id: "prohibited", label: "Prohibited item" },
  { id: "other", label: "Other" },
]

export function ReportAdModal({ adId, adTitle, children }: ReportAdModalProps) {
  const [open, setOpen] = useState(false)
  const [selectedReason, setSelectedReason] = useState("")
  const [customMessage, setCustomMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast({
        title: "Error",
        description: "Please select a reason for reporting",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log("Report submitted:", {
      adId,
      reason: selectedReason,
      customMessage,
      timestamp: new Date().toISOString(),
    })

    toast({
      title: "Report Submitted",
      description: "Thank you for reporting. We'll review this ad and take appropriate action.",
    })

    // Reset form and close modal
    setSelectedReason("")
    setCustomMessage("")
    setOpen(false)
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-500" />
            Report This Ad
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Ad:</strong> {adTitle}
            </p>
            <p className="text-xs text-gray-500">ID: {adId}</p>
          </div>

          <div>
            <Label className="text-sm font-medium">Why are you reporting this ad?</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason} className="mt-2">
              {reportReasons.map((reason) => (
                <div key={reason.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.id} id={reason.id} />
                  <Label htmlFor={reason.id} className="text-sm cursor-pointer">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="custom-message" className="text-sm font-medium">
              Additional details (optional)
            </Label>
            <Textarea
              id="custom-message"
              placeholder="Please provide any additional information about why you're reporting this ad..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 bg-red-600 hover:bg-red-700">
              {isSubmitting ? "Submitting..." : "Send Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
