"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Star,
  Trash2,
  Flag,
  Calendar,
  DollarSign,
  MapPin,
  User,
  Package,
  TrendingUp,
  AlertTriangle,
} from "lucide-react"

interface Ad {
  id: string
  title: string
  description: string
  price: number
  category: string
  subcategory: string | null
  condition: string
  brand: string | null
  model: string | null
  location: string
  images: string[]
  user_id: string
  user_email: string
  user_name: string | null
  status: "pending" | "approved" | "rejected" | "expired" | "sold"
  is_featured: boolean
  views: number
  created_at: string
  updated_at: string
  reported_count: number
}

const mockAds: Ad[] = [
  {
    id: "1",
    title: "iPhone 15 Pro Max - Excellent Condition",
    description: "Barely used iPhone 15 Pro Max in perfect condition. Comes with original box and charger.",
    price: 1200,
    category: "Electronics",
    subcategory: "Smartphones",
    condition: "New",
    brand: "Apple",
    model: "iPhone 15 Pro Max",
    location: "Toronto, ON",
    images: ["/placeholder.svg"],
    user_id: "user1",
    user_email: "john.doe@email.com",
    user_name: "John Doe",
    status: "pending",
    is_featured: false,
    views: 45,
    created_at: "2024-01-20T10:30:00Z",
    updated_at: "2024-01-20T10:30:00Z",
    reported_count: 0,
  },
  {
    id: "2",
    title: "2019 Honda Civic - Low Mileage",
    description: "Well-maintained Honda Civic with low mileage. Perfect for daily commuting.",
    price: 18500,
    category: "Vehicles",
    subcategory: "Cars",
    condition: "Used",
    brand: "Honda",
    model: "Civic",
    location: "Vancouver, BC",
    images: ["/placeholder.svg"],
    user_id: "user2",
    user_email: "sarah.wilson@email.com",
    user_name: "Sarah Wilson",
    status: "approved",
    is_featured: true,
    views: 234,
    created_at: "2024-01-18T14:22:00Z",
    updated_at: "2024-01-19T09:15:00Z",
    reported_count: 1,
  },
  {
    id: "3",
    title: "Modern Sofa Set - Like New",
    description: "Beautiful modern sofa set, barely used. Moving sale.",
    price: 800,
    category: "Furniture",
    subcategory: "Sofa",
    condition: "Used",
    brand: "IKEA",
    model: "KIVIK",
    location: "Calgary, AB",
    images: ["/placeholder.svg"],
    user_id: "user3",
    user_email: "mike.johnson@email.com",
    user_name: "Mike Johnson",
    status: "rejected",
    is_featured: false,
    views: 67,
    created_at: "2024-01-15T16:45:00Z",
    updated_at: "2024-01-16T11:30:00Z",
    reported_count: 3,
  },
]

export function AdManagement() {
  const [ads, setAds] = useState<Ad[]>(mockAds)
  const [filteredAds, setFilteredAds] = useState<Ad[]>(mockAds)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null)
  const [isAdDialogOpen, setIsAdDialogOpen] = useState(false)

  // Filter ads based on search, status, and category
  useEffect(() => {
    const filtered = ads.filter((ad) => {
      const matchesSearch =
        ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.id.includes(searchTerm) ||
        ad.category.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || ad.status === statusFilter
      const matchesCategory = categoryFilter === "all" || ad.category === categoryFilter

      return matchesSearch && matchesStatus && matchesCategory
    })

    setFilteredAds(filtered)
  }, [ads, searchTerm, statusFilter, categoryFilter])

  const handleApproveAd = async (adId: string) => {
    setAds((prev) => prev.map((ad) => (ad.id === adId ? { ...ad, status: "approved" as const } : ad)))
  }

  const handleRejectAd = async (adId: string) => {
    const reason = prompt("Reason for rejection (optional):")
    setAds((prev) => prev.map((ad) => (ad.id === adId ? { ...ad, status: "rejected" as const } : ad)))
  }

  const handleFeatureAd = async (adId: string) => {
    setAds((prev) => prev.map((ad) => (ad.id === adId ? { ...ad, is_featured: !ad.is_featured } : ad)))
  }

  const handleDeleteAd = async (adId: string) => {
    if (confirm("Are you sure you want to permanently delete this ad?")) {
      setAds((prev) => prev.filter((ad) => ad.id !== adId))
    }
  }

  const getStatusBadge = (status: Ad["status"]) => {
    const variants = {
      pending: { variant: "secondary" as const, color: "text-yellow-600", label: "Pending" },
      approved: { variant: "default" as const, color: "text-green-600", label: "Approved" },
      rejected: { variant: "destructive" as const, color: "text-red-600", label: "Rejected" },
      expired: { variant: "outline" as const, color: "text-gray-600", label: "Expired" },
      sold: { variant: "secondary" as const, color: "text-blue-600", label: "Sold" },
    }

    const config = variants[status]
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    )
  }

  const categories = ["Electronics", "Vehicles", "Furniture", "Fashion", "Real Estate", "Services"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advertisement Management</h1>
          <p className="text-gray-600">Review, approve, and manage all advertisements</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Package className="w-4 h-4 mr-2" />
            Bulk Actions
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by title, user email, ad ID, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Ads Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-900">Advertisement</th>
                <th className="text-left p-4 font-medium text-gray-900">User</th>
                <th className="text-left p-4 font-medium text-gray-900">Status</th>
                <th className="text-left p-4 font-medium text-gray-900">Performance</th>
                <th className="text-left p-4 font-medium text-gray-900">Date</th>
                <th className="text-left p-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAds.map((ad) => (
                <tr key={ad.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={ad.images[0] || "/placeholder.svg"}
                        alt=""
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{ad.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {ad.category}
                          </Badge>
                          {ad.subcategory && (
                            <Badge variant="outline" className="text-xs">
                              {ad.subcategory}
                            </Badge>
                          )}
                          {ad.is_featured && (
                            <Badge className="text-xs bg-yellow-100 text-yellow-700">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <DollarSign className="w-3 h-3 text-green-600" />
                          <span className="text-sm font-medium text-green-600">${ad.price}</span>
                          <MapPin className="w-3 h-3 text-gray-400 ml-2" />
                          <span className="text-xs text-gray-500">{ad.location}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{ad.user_name || "No name"}</p>
                        <p className="text-xs text-gray-500">{ad.user_email}</p>
                        <p className="text-xs text-gray-400">ID: {ad.user_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-2">
                      {getStatusBadge(ad.status)}
                      {ad.reported_count > 0 && (
                        <div className="flex items-center gap-1">
                          <Flag className="w-3 h-3 text-red-500" />
                          <span className="text-xs text-red-600">{ad.reported_count} reports</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Eye className="w-3 h-3 text-blue-500" />
                        <span>{ad.views} views</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {ad.condition} • {ad.brand && `${ad.brand} ${ad.model || ""}`.trim()}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-3 h-3" />
                        {new Date(ad.created_at).toLocaleDateString()}
                      </div>
                      <p className="text-xs text-gray-500">Updated: {new Date(ad.updated_at).toLocaleDateString()}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Dialog open={isAdDialogOpen} onOpenChange={setIsAdDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedAd(ad)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Advertisement Details</DialogTitle>
                          </DialogHeader>
                          {selectedAd && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <img
                                    src={selectedAd.images[0] || "/placeholder.svg"}
                                    alt=""
                                    className="w-full h-64 object-cover rounded-lg"
                                  />
                                </div>
                                <div className="space-y-4">
                                  <div>
                                    <h3 className="text-lg font-semibold">{selectedAd.title}</h3>
                                    <p className="text-2xl font-bold text-green-600">${selectedAd.price}</p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-gray-500">Category</p>
                                      <p className="font-medium">{selectedAd.category}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Condition</p>
                                      <p className="font-medium">{selectedAd.condition}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Brand</p>
                                      <p className="font-medium">{selectedAd.brand || "Not specified"}</p>
                                    </div>
                                    <div>
                                      <p className="text-gray-500">Model</p>
                                      <p className="font-medium">{selectedAd.model || "Not specified"}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Location</p>
                                    <p className="font-medium">{selectedAd.location}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500">Status</p>
                                    <div className="flex items-center gap-2">
                                      {getStatusBadge(selectedAd.status)}
                                      {selectedAd.is_featured && (
                                        <Badge className="text-xs bg-yellow-100 text-yellow-700">Featured</Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium mb-2">Description</h4>
                                <p className="text-sm text-gray-600">{selectedAd.description}</p>
                              </div>

                              <div>
                                <h4 className="font-medium mb-2">Seller Information</h4>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <p className="font-medium">{selectedAd.user_name || "No name provided"}</p>
                                  <p className="text-sm text-gray-600">{selectedAd.user_email}</p>
                                  <p className="text-xs text-gray-500">User ID: {selectedAd.user_id}</p>
                                </div>
                              </div>

                              <div className="flex gap-2 pt-4 border-t">
                                {selectedAd.status === "pending" && (
                                  <>
                                    <Button
                                      onClick={() => handleApproveAd(selectedAd.id)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => handleRejectAd(selectedAd.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                                <Button
                                  variant="outline"
                                  onClick={() => handleFeatureAd(selectedAd.id)}
                                  className={selectedAd.is_featured ? "text-yellow-600" : ""}
                                >
                                  <Star className="w-4 h-4 mr-1" />
                                  {selectedAd.is_featured ? "Unfeature" : "Feature"}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => handleDeleteAd(selectedAd.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {ad.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApproveAd(ad.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRejectAd(ad.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFeatureAd(ad.id)}
                        className={ad.is_featured ? "text-yellow-600" : "text-gray-600"}
                      >
                        <Star className="w-4 h-4" />
                      </Button>

                      {ad.reported_count > 0 && (
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

        {filteredAds.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No advertisements found matching your criteria.</p>
          </div>
        )}
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Ads</p>
              <p className="text-xl font-bold">{ads.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-xl font-bold">{ads.filter((a) => a.status === "pending").length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-xl font-bold">{ads.filter((a) => a.status === "approved").length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-xl font-bold">{ads.filter((a) => a.status === "rejected").length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Flag className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Reported</p>
              <p className="text-xl font-bold">{ads.filter((a) => a.reported_count > 0).length}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
