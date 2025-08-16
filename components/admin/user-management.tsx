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
  Ban,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react"

interface User {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  location: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  banned_until: string | null
  is_active: boolean
  total_ads: number
  total_messages: number
}

const mockUsers: User[] = [
  {
    id: "1",
    email: "john.doe@email.com",
    full_name: "John Doe",
    phone: "+1 (555) 123-4567",
    location: "Toronto, ON",
    bio: "Tech enthusiast and collector",
    avatar_url: null,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-20T14:22:00Z",
    last_sign_in_at: "2024-01-20T14:22:00Z",
    email_confirmed_at: "2024-01-15T10:35:00Z",
    banned_until: null,
    is_active: true,
    total_ads: 12,
    total_messages: 45,
  },
  {
    id: "2",
    email: "sarah.wilson@email.com",
    full_name: "Sarah Wilson",
    phone: "+1 (555) 987-6543",
    location: "Vancouver, BC",
    bio: null,
    avatar_url: null,
    created_at: "2024-01-10T08:15:00Z",
    updated_at: "2024-01-19T16:45:00Z",
    last_sign_in_at: "2024-01-19T16:45:00Z",
    email_confirmed_at: "2024-01-10T08:20:00Z",
    banned_until: null,
    is_active: true,
    total_ads: 8,
    total_messages: 23,
  },
  {
    id: "3",
    email: "mike.johnson@email.com",
    full_name: "Mike Johnson",
    phone: null,
    location: "Calgary, AB",
    bio: "Car dealer and automotive expert",
    avatar_url: null,
    created_at: "2024-01-05T12:00:00Z",
    updated_at: "2024-01-18T09:30:00Z",
    last_sign_in_at: "2024-01-18T09:30:00Z",
    email_confirmed_at: null,
    banned_until: "2024-02-01T00:00:00Z",
    is_active: false,
    total_ads: 25,
    total_messages: 67,
  },
]

export function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [filteredUsers, setFilteredUsers] = useState<User[]>(mockUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Filter users based on search and status
  useEffect(() => {
    const filtered = users.filter((user) => {
      const matchesSearch =
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.includes(searchTerm)

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.is_active && !user.banned_until) ||
        (statusFilter === "banned" && user.banned_until) ||
        (statusFilter === "unverified" && !user.email_confirmed_at) ||
        (statusFilter === "inactive" && !user.is_active)

      return matchesSearch && matchesStatus
    })

    setFilteredUsers(filtered)
  }, [users, searchTerm, statusFilter])

  const handleBanUser = async (userId: string) => {
    // In real implementation, this would call Supabase
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, banned_until: "2024-02-01T00:00:00Z", is_active: false } : user,
      ),
    )
  }

  const handleUnbanUser = async (userId: string) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, banned_until: null, is_active: true } : user)),
    )
  }

  const handleResetPassword = async (userId: string) => {
    // In real implementation, this would call Supabase admin API
    console.log("Reset password for user:", userId)
  }

  const getStatusBadge = (user: User) => {
    if (user.banned_until) {
      return (
        <Badge variant="destructive" className="text-xs">
          Banned
        </Badge>
      )
    }
    if (!user.email_confirmed_at) {
      return (
        <Badge variant="secondary" className="text-xs">
          Unverified
        </Badge>
      )
    }
    if (!user.is_active) {
      return (
        <Badge variant="outline" className="text-xs">
          Inactive
        </Badge>
      )
    }
    return (
      <Badge variant="default" className="text-xs bg-green-100 text-green-700">
        Active
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage and monitor all users</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Mail className="w-4 h-4 mr-2" />
            Send Notification
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
            <UserCheck className="w-4 h-4 mr-2" />
            Bulk Actions
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or user ID..."
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
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="text-left p-4 font-medium text-gray-900">User</th>
                <th className="text-left p-4 font-medium text-gray-900">Contact</th>
                <th className="text-left p-4 font-medium text-gray-900">Status</th>
                <th className="text-left p-4 font-medium text-gray-900">Activity</th>
                <th className="text-left p-4 font-medium text-gray-900">Joined</th>
                <th className="text-left p-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {user.avatar_url ? (
                          <img src={user.avatar_url || "/placeholder.svg"} alt="" className="w-10 h-10 rounded-full" />
                        ) : (
                          <span className="text-sm font-medium text-gray-600">
                            {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.full_name || "No name"}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      {user.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="w-3 h-3" />
                          {user.phone}
                        </div>
                      )}
                      {user.location && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-3 h-3" />
                          {user.location}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-2">
                      {getStatusBadge(user)}
                      {user.last_sign_in_at && (
                        <p className="text-xs text-gray-500">
                          Last seen: {new Date(user.last_sign_in_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Activity className="w-3 h-3 text-blue-500" />
                        <span>{user.total_ads} ads</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-3 h-3 text-green-500" />
                        <span>{user.total_messages} messages</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="w-3 h-3" />
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>User Details</DialogTitle>
                          </DialogHeader>
                          {selectedUser && (
                            <div className="space-y-6">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                                  {selectedUser.avatar_url ? (
                                    <img
                                      src={selectedUser.avatar_url || "/placeholder.svg"}
                                      alt=""
                                      className="w-16 h-16 rounded-full"
                                    />
                                  ) : (
                                    <span className="text-xl font-medium text-gray-600">
                                      {selectedUser.full_name?.charAt(0) || selectedUser.email.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold">{selectedUser.full_name || "No name"}</h3>
                                  <p className="text-gray-600">{selectedUser.email}</p>
                                  {getStatusBadge(selectedUser)}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium mb-2">Contact Information</h4>
                                  <div className="space-y-2 text-sm">
                                    <p>
                                      <strong>Email:</strong> {selectedUser.email}
                                    </p>
                                    <p>
                                      <strong>Phone:</strong> {selectedUser.phone || "Not provided"}
                                    </p>
                                    <p>
                                      <strong>Location:</strong> {selectedUser.location || "Not provided"}
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Account Details</h4>
                                  <div className="space-y-2 text-sm">
                                    <p>
                                      <strong>User ID:</strong> {selectedUser.id}
                                    </p>
                                    <p>
                                      <strong>Joined:</strong> {new Date(selectedUser.created_at).toLocaleDateString()}
                                    </p>
                                    <p>
                                      <strong>Last Active:</strong>{" "}
                                      {selectedUser.last_sign_in_at
                                        ? new Date(selectedUser.last_sign_in_at).toLocaleDateString()
                                        : "Never"}
                                    </p>
                                    <p>
                                      <strong>Email Verified:</strong> {selectedUser.email_confirmed_at ? "Yes" : "No"}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {selectedUser.bio && (
                                <div>
                                  <h4 className="font-medium mb-2">Bio</h4>
                                  <p className="text-sm text-gray-600">{selectedUser.bio}</p>
                                </div>
                              )}

                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResetPassword(selectedUser.id)}
                                >
                                  Reset Password
                                </Button>
                                {selectedUser.banned_until ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUnbanUser(selectedUser.id)}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Unban User
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleBanUser(selectedUser.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Ban className="w-4 h-4 mr-1" />
                                    Ban User
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {user.banned_until ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnbanUser(user.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBanUser(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No users found matching your criteria.</p>
          </div>
        )}
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-xl font-bold">{users.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-xl font-bold">{users.filter((u) => u.is_active && !u.banned_until).length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Banned Users</p>
              <p className="text-xl font-bold">{users.filter((u) => u.banned_until).length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Unverified</p>
              <p className="text-xl font-bold">{users.filter((u) => !u.email_confirmed_at).length}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
