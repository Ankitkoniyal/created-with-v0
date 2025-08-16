"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Eye,
  Flag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  User,
  Package,
  Clock,
  Shield,
  Ban,
  FileText,
  Calendar,
  TrendingUp,
} from "lucide-react"

interface Report {
  id: string
  type: "ad" | "user" | "message" | "review"
  reported_item_id: string
  reported_item_title: string
  reported_item_content: string
  reported_user_id: string
  reported_user_email: string
  reported_user_name: string | null
  reporter_id: string
  reporter_email: string
  reporter_name: string | null
  reason: string
  description: string
  status: "pending" | "investigating" | "resolved" | "dismissed"
  priority: "low" | "medium" | "high" | "critical"
  created_at: string
  updated_at: string
  assigned_to: string | null
  resolution_notes: string | null
  evidence_urls: string[]
}

const mockReports: Report[] = [
  {
    id: "1",
    type: "ad",
    reported_item_id: "ad123",
    reported_item_title: "iPhone 15 Pro Max - Excellent Condition",
    reported_item_content: "Barely used iPhone 15 Pro Max in perfect condition...",
    reported_user_id: "user1",
    reported_user_email: "john.doe@email.com",
    reported_user_name: "John Doe",
    reporter_id: "user2",
    reporter_email: "reporter@email.com",
    reporter_name: "Jane Smith",
    reason: "Suspicious Content",
    description: "This ad seems fake. The price is too good to be true and the photos look stock.",
    status: "pending",
    priority: "high",
    created_at: "2024-01-20T10:30:00Z",
    updated_at: "2024-01-20T10:30:00Z",
    assigned_to: null,
    resolution_notes: null,
    evidence_urls: [],
  },
  {
    id: "2",
    type: "user",
    reported_item_id: "user3",
    reported_item_title: "User Profile: Mike Johnson",
    reported_item_content: "User profile and activity",
    reported_user_id: "user3",
    reported_user_email: "mike.johnson@email.com",
    reported_user_name: "Mike Johnson",
    reporter_id: "user4",
    reporter_email: "victim@email.com",
    reporter_name: "Sarah Wilson",
    reason: "Harassment",
    description: "This user has been sending inappropriate messages and harassing me.",
    status: "investigating",
    priority: "critical",
    created_at: "2024-01-19T14:22:00Z",
    updated_at: "2024-01-20T09:15:00Z",
    assigned_to: "admin1",
    resolution_notes: "Investigating message history and user behavior patterns.",
    evidence_urls: ["/evidence/screenshot1.png", "/evidence/screenshot2.png"],
  },
  {
    id: "3",
    type: "ad",
    reported_item_id: "ad456",
    reported_item_title: "2019 Honda Civic - Low Mileage",
    reported_item_content: "Well-maintained Honda Civic with low mileage...",
    reported_user_id: "user5",
    reported_user_email: "seller@email.com",
    reported_user_name: "Car Dealer",
    reporter_id: "user6",
    reporter_email: "buyer@email.com",
    reporter_name: "Potential Buyer",
    reason: "Misleading Information",
    description: "The car has much higher mileage than advertised. Seller is being dishonest.",
    status: "resolved",
    priority: "medium",
    created_at: "2024-01-18T16:45:00Z",
    updated_at: "2024-01-19T11:30:00Z",
    assigned_to: "admin2",
    resolution_notes: "Contacted seller for clarification. Ad updated with correct mileage information.",
    evidence_urls: [],
  },
]

const reportReasons = [
  "Spam",
  "Suspicious Content",
  "Inappropriate Content",
  "Harassment",
  "Misleading Information",
  "Duplicate Listing",
  "Prohibited Item",
  "Copyright Violation",
  "Other",
]

export function ContentModeration() {
  const [reports, setReports] = useState<Report[]>(mockReports)
  const [filteredReports, setFilteredReports] = useState<Report[]>(mockReports)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState("")

  // Filter reports based on search and filters
  useEffect(() => {
    const filtered = reports.filter((report) => {
      const matchesSearch =
        report.reported_item_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reported_user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reporter_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.id.includes(searchTerm)

      const matchesStatus = statusFilter === "all" || report.status === statusFilter
      const matchesType = typeFilter === "all" || report.type === typeFilter
      const matchesPriority = priorityFilter === "all" || report.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesType && matchesPriority
    })

    setFilteredReports(filtered)
  }, [reports, searchTerm, statusFilter, typeFilter, priorityFilter])

  const handleUpdateStatus = async (reportId: string, newStatus: Report["status"]) => {
    setReports((prev) =>
      prev.map((report) =>
        report.id === reportId
          ? {
              ...report,
              status: newStatus,
              updated_at: new Date().toISOString(),
              ...(newStatus === "resolved" && { resolution_notes: resolutionNotes }),
            }
          : report,
      ),
    )
    setResolutionNotes("")
  }

  const handleAssignReport = async (reportId: string, adminId: string) => {
    setReports((prev) =>
      prev.map((report) =>
        report.id === reportId
          ? {
              ...report,
              assigned_to: adminId,
              status: "investigating",
              updated_at: new Date().toISOString(),
            }
          : report,
      ),
    )
  }

  const handleUpdatePriority = async (reportId: string, newPriority: Report["priority"]) => {
    setReports((prev) =>
      prev.map((report) =>
        report.id === reportId
          ? {
              ...report,
              priority: newPriority,
              updated_at: new Date().toISOString(),
            }
          : report,
      ),
    )
  }

  const getStatusBadge = (status: Report["status"]) => {
    const variants = {
      pending: { variant: "secondary" as const, color: "text-yellow-600", label: "Pending" },
      investigating: { variant: "default" as const, color: "text-blue-600", label: "Investigating" },
      resolved: { variant: "default" as const, color: "text-green-600", label: "Resolved" },
      dismissed: { variant: "outline" as const, color: "text-gray-600", label: "Dismissed" },
    }

    const config = variants[status]
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: Report["priority"]) => {
    const variants = {
      low: { variant: "outline" as const, color: "text-gray-600", label: "Low" },
      medium: { variant: "secondary" as const, color: "text-blue-600", label: "Medium" },
      high: { variant: "default" as const, color: "text-orange-600", label: "High" },
      critical: { variant: "destructive" as const, color: "text-red-600", label: "Critical" },
    }

    const config = variants[priority]
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    )
  }

  const getTypeIcon = (type: Report["type"]) => {
    switch (type) {
      case "ad":
        return <Package className="w-4 h-4" />
      case "user":
        return <User className="w-4 h-4" />
      case "message":
        return <MessageSquare className="w-4 h-4" />
      case "review":
        return <FileText className="w-4 h-4" />
      default:
        return <Flag className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Moderation</h1>
          <p className="text-gray-600">Review and manage user reports and flagged content</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            Moderation Stats
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
            <Shield className="w-4 h-4 mr-2" />
            Auto-Moderation
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search reports, users, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="ad">Advertisements</SelectItem>
              <SelectItem value="user">Users</SelectItem>
              <SelectItem value="message">Messages</SelectItem>
              <SelectItem value="review">Reviews</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Reports Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-900">Report</th>
                <th className="text-left p-4 font-medium text-gray-900">Reported Content</th>
                <th className="text-left p-4 font-medium text-gray-900">Reporter</th>
                <th className="text-left p-4 font-medium text-gray-900">Status</th>
                <th className="text-left p-4 font-medium text-gray-900">Priority</th>
                <th className="text-left p-4 font-medium text-gray-900">Date</th>
                <th className="text-left p-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        {getTypeIcon(report.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">#{report.id}</p>
                        <p className="text-sm text-gray-600 capitalize">{report.type} Report</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {report.reason}
                        </Badge>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="max-w-xs">
                      <p className="font-medium text-gray-900 truncate">{report.reported_item_title}</p>
                      <p className="text-sm text-gray-600">{report.reported_user_name || "No name"}</p>
                      <p className="text-xs text-gray-500">{report.reported_user_email}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{report.reporter_name || "Anonymous"}</p>
                      <p className="text-xs text-gray-500">{report.reporter_email}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      {getStatusBadge(report.status)}
                      {report.assigned_to && <p className="text-xs text-gray-500">Assigned to: {report.assigned_to}</p>}
                    </div>
                  </td>
                  <td className="p-4">{getPriorityBadge(report.priority)}</td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-3 h-3" />
                        {new Date(report.created_at).toLocaleDateString()}
                      </div>
                      <p className="text-xs text-gray-500">
                        Updated: {new Date(report.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedReport(report)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Report Details - #{selectedReport?.id}</DialogTitle>
                          </DialogHeader>
                          {selectedReport && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div>
                                    <h3 className="font-semibold mb-2">Report Information</h3>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-500">Type:</span>
                                        <div className="flex items-center gap-1">
                                          {getTypeIcon(selectedReport.type)}
                                          <span className="capitalize">{selectedReport.type}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-500">Reason:</span>
                                        <Badge variant="outline">{selectedReport.reason}</Badge>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-500">Priority:</span>
                                        {getPriorityBadge(selectedReport.priority)}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-500">Status:</span>
                                        {getStatusBadge(selectedReport.status)}
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <h3 className="font-semibold mb-2">Reporter</h3>
                                    <div className="bg-gray-50 p-3 rounded-lg text-sm">
                                      <p className="font-medium">{selectedReport.reporter_name || "Anonymous"}</p>
                                      <p className="text-gray-600">{selectedReport.reporter_email}</p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Reported on: {new Date(selectedReport.created_at).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <h3 className="font-semibold mb-2">Reported Content</h3>
                                    <div className="bg-red-50 p-3 rounded-lg text-sm">
                                      <p className="font-medium">{selectedReport.reported_item_title}</p>
                                      <p className="text-gray-600 mt-1">{selectedReport.reported_user_name}</p>
                                      <p className="text-gray-500">{selectedReport.reported_user_email}</p>
                                    </div>
                                  </div>

                                  <div>
                                    <h3 className="font-semibold mb-2">Assignment</h3>
                                    <Select
                                      value={selectedReport.assigned_to || "unassigned"}
                                      onValueChange={(value) =>
                                        handleAssignReport(selectedReport.id, value === "unassigned" ? "" : value)
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Assign to admin" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                        <SelectItem value="admin1">Admin 1</SelectItem>
                                        <SelectItem value="admin2">Admin 2</SelectItem>
                                        <SelectItem value="admin3">Admin 3</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h3 className="font-semibold mb-2">Report Description</h3>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                  {selectedReport.description}
                                </p>
                              </div>

                              {selectedReport.evidence_urls.length > 0 && (
                                <div>
                                  <h3 className="font-semibold mb-2">Evidence</h3>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {selectedReport.evidence_urls.map((url, index) => (
                                      <img
                                        key={index}
                                        src={url || "/placeholder.svg"}
                                        alt={`Evidence ${index + 1}`}
                                        className="w-full h-20 object-cover rounded border"
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}

                              {selectedReport.resolution_notes && (
                                <div>
                                  <h3 className="font-semibold mb-2">Resolution Notes</h3>
                                  <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                                    {selectedReport.resolution_notes}
                                  </p>
                                </div>
                              )}

                              <div className="space-y-4 pt-4 border-t">
                                <div>
                                  <h3 className="font-semibold mb-2">Priority</h3>
                                  <Select
                                    value={selectedReport.priority}
                                    onValueChange={(value) =>
                                      handleUpdatePriority(selectedReport.id, value as Report["priority"])
                                    }
                                  >
                                    <SelectTrigger className="w-48">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="low">Low</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="high">High</SelectItem>
                                      <SelectItem value="critical">Critical</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {selectedReport.status !== "resolved" && selectedReport.status !== "dismissed" && (
                                  <div>
                                    <h3 className="font-semibold mb-2">Resolution Notes</h3>
                                    <Textarea
                                      placeholder="Add resolution notes..."
                                      value={resolutionNotes}
                                      onChange={(e) => setResolutionNotes(e.target.value)}
                                      rows={3}
                                    />
                                  </div>
                                )}

                                <div className="flex gap-2">
                                  {selectedReport.status === "pending" && (
                                    <Button
                                      onClick={() => handleUpdateStatus(selectedReport.id, "investigating")}
                                      className="bg-blue-600 hover:bg-blue-700"
                                    >
                                      <Clock className="w-4 h-4 mr-1" />
                                      Start Investigation
                                    </Button>
                                  )}
                                  {selectedReport.status === "investigating" && (
                                    <>
                                      <Button
                                        onClick={() => handleUpdateStatus(selectedReport.id, "resolved")}
                                        className="bg-green-600 hover:bg-green-700"
                                        disabled={!resolutionNotes.trim()}
                                      >
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        Resolve
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => handleUpdateStatus(selectedReport.id, "dismissed")}
                                        className="text-gray-600"
                                      >
                                        <XCircle className="w-4 h-4 mr-1" />
                                        Dismiss
                                      </Button>
                                    </>
                                  )}
                                  <Button variant="outline" className="text-red-600 hover:text-red-700 bg-transparent">
                                    <Ban className="w-4 h-4 mr-1" />
                                    Take Action
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {report.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateStatus(report.id, "investigating")}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Clock className="w-4 h-4" />
                        </Button>
                      )}

                      {report.priority === "critical" && (
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <AlertTriangle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No reports found matching your criteria.</p>
          </div>
        )}
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Flag className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Reports</p>
              <p className="text-xl font-bold">{reports.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-xl font-bold">{reports.filter((r) => r.status === "pending").length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Investigating</p>
              <p className="text-xl font-bold">{reports.filter((r) => r.status === "investigating").length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Resolved</p>
              <p className="text-xl font-bold">{reports.filter((r) => r.status === "resolved").length}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
