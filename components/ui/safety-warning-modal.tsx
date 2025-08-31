"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Shield, Eye, Phone } from "lucide-react"

interface SafetyWarningModalProps {
  isOpen: boolean
  onClose: () => void
  onProceed: () => void
  type: "contact" | "phone"
}

export function SafetyWarningModal({ isOpen, onClose, onProceed, type }: SafetyWarningModalProps) {
  const handleProceed = () => {
    onProceed()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-amber-700">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Safety First
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <Shield className="h-8 w-8 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-amber-800 mb-1">
                {type === "contact" ? "Before contacting this seller:" : "Before viewing contact details:"}
              </h4>
              <p className="text-sm text-amber-700">Please keep these safety tips in mind when dealing with sellers.</p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-gray-700">Always meet in public, well-lit places</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-gray-700">Inspect items thoroughly before payment</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-gray-700">Never share banking details or passwords</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-gray-700">Be cautious of deals that seem too good to be true</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0" />
              <span className="text-gray-700">Trust your instincts and report suspicious activity</span>
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleProceed} className="flex-1 bg-amber-600 hover:bg-amber-700">
              <div className="flex items-center">
                {type === "contact" ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />I Understand, Continue
                  </>
                ) : (
                  <>
                    <Phone className="h-4 w-4 mr-2" />
                    Show Contact Info
                  </>
                )}
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
