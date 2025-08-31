import { Shield } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function SafetyBanner() {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-800 mb-2">Stay Safe While Trading</h3>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>• Meet in public places for transactions</li>
              <li>• Inspect items before making payment</li>
              <li>• Never share personal financial information</li>
              <li>• Use secure payment methods</li>
              <li>• Trust your instincts - if something feels wrong, walk away</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
