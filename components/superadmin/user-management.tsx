// components/superadmin/user-management.tsx
"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Users, 
  Mail, 
  Calendar, 
  Shield, 
  MoreVertical, 
  Ban, 
  CheckCircle, 
  Eye, 
  Filter,
  Download,
  RefreshCw,
  Trash2,
  User,
  Phone,
  MapPin,
  FileText,
  BarChart3,
  X,
  Loader2,
  AlertTriangle,
  UserCheck,
  UserX
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  location: string | null
  bio: string | null
  status: 'active' | 'suspended' | 'banned' | 'deleted'
  role: 'user' | 'admin' | 'super_admin'
  created_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  deleted_at: string | null
  deletion_reason: string | null
}

interface UserStats {
  totalAds: number
  activeAds: number
  soldAds: number
  totalViews: number
  reportedAds: number
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [userStats, setUserStats] = useState<Record<string, UserStats>>({})
  const [userDetailsOpen, setUserDetailsOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{user: UserProfile, type: 'soft' | 'hard'} | null>(null)
  const [deleteReason, setDeleteReason] = useState("")
  const [exportLoading, setExportLoading] = useState(false)

  const { isAdmin, user: currentUser } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  // Redirect non-admins
  useEffect(() => {
    if (currentUser && !isAdmin) {
      router.push("/")
    }
  }, [currentUser, isAdmin, router])

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setUsers(data as UserProfile[] || [])
      
      if (data && data.length > 0) {
        await fetchUsersStats(data.map(user => user.id))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const fetchUsersStats = async (userIds: string[]) => {
    try {
      const stats: Record<string, UserStats> = {}

      // Fetch ads data
      const { data: adsData } = await supabase
        .from('products')
        .select('user_id, status, views')
        .in('user_id', userIds)
        
      if (!adsData) return

      // Fetch reported ads count
      const { data: reportsData } = await supabase
        .from('reports')
        .select('product_id, products(user_id)')
        .in('products.user_id', userIds)

      const userAdAggregations: Record<string, UserStats> = {}

      // Initialize all users
      userIds.forEach(userId => {
        userAdAggregations[userId] = { 
          totalAds: 0, 
          activeAds: 0, 
          soldAds: 0, 
          totalViews: 0,
          reportedAds: 0
        }
      })

      // Process ads
      for (const ad of adsData) {
        const userStats = userAdAggregations[ad.user_id]
        userStats.totalAds += 1
        userStats.totalViews += (ad.views || 0)
        if (ad.status === 'active') userStats.activeAds += 1
        if (ad.status === 'sold') userStats.soldAds += 1
      }

      // Process reports
      if (reportsData) {
        for (const report of reportsData) {
          const userId = (report.products as any)?.user_id
          if (userId && userAdAggregations[userId]) {
            userAdAggregations[userId].reportedAds += 1
          }
        }
      }

      setUserStats(userAdAggregations)
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  // Enhanced user actions with proper error handling and soft delete
  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'ban' | 'soft_delete', reason?: string) => {
    setActionLoading(userId)
    
    try {
      let updateData: Partial<UserProfile> = {}
      
      switch (action) {
        case 'activate':
          updateData = { status: 'active' }
          break
        case 'suspend':
          updateData = { status: 'suspended' }
          break
        case 'ban':
          updateData = { status: 'banned' }
          break
        case 'soft_delete':
          updateData = { 
            status: 'deleted',
            deleted_at: new Date().toISOString(),
            deletion_reason: reason
          }
          break
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)

      if (error) throw error

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, ...updateData } : user
      ))

      toast.success(`User ${action.replace('_', ' ')} successfully`)
      
      // Close dialogs
      setDeleteDialog(null)
      setDeleteReason("")

    } catch (error) {
      console.error(`Error ${action} user:`, error)
      toast.error(`Failed to ${action} user`)
    } finally {
      setActionLoading(null)
    }
  }

  // Hard delete user (use with caution)
  const handleHardDelete = async (userId: string) => {
    setActionLoading(userId)
    
    try {
      // First, soft delete all user's ads
      const { error: adsError } = await supabase
        .from('products')
        .update({ status: 'deleted' })
        .eq('user_id', userId)

      if (adsError) throw adsError

      // Then delete the user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) throw profileError

      // Remove from local state
      setUsers(prev => prev.filter(user => user.id !== userId))
      toast.success('User permanently deleted')

      setDeleteDialog(null)
    } catch (error) {
      console.error('Error hard deleting user:', error)
      toast.error('Failed to delete user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewUserDetails = (user: UserProfile) => {
    setSelectedUser(user)
    setUserDetailsOpen(true)
  }

  const exportUsers = async () => {
    setExportLoading(true)
    try {
      const csvContent = [
        ['ID', 'Name', 'Email', 'Phone', 'Status', 'Role', 'Total Ads', 'Active Ads', 'Joined Date', 'Last Login'],
        ...filteredUsers.map((user, index) => [
          user.id,
          `"${user.full_name || 'N/A'}"`,
          user.email,
          user.phone || 'N/A',
          user.status,
          user.role,
          userStats[user.id]?.totalAds || 0,
          userStats[user.id]?.activeAds || 0,
          new Date(user.created_at).toLocaleDateString(),
          user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'
        ])
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      
      toast.success('Users exported successfully')
    } catch (error) {
      console.error('Error exporting users:', error)
      toast.error('Failed to export users')
    } finally {
      setExportLoading(false)
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone?.includes(searchQuery)
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [users, searchQuery, statusFilter])

  const getStatusBadge = (status: UserProfile['status']) => {
    const variants = {
      active: { class: "bg-green-600", icon: UserCheck, label: "Active" },
      suspended: { class: "bg-yellow-600", icon: UserX, label: "Suspended" },
      banned: { class: "bg-red-600", icon: Ban, label: "Banned" },
      deleted: { class: "bg-gray-600", icon: Trash2, label: "Deleted" }
    }
    
    const variant = variants[status]
    const Icon = variant.icon
    
    return (
      <Badge className={`${variant.class} hover:${variant.class} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {variant.label}
      </Badge>
    )
  }

  const getRoleBadge = (role: UserProfile['role']) => {
    const variants = {
      user: { class: "bg-blue-600", label: "User" },
      admin: { class: "bg-purple-600", label: "Admin" },
      super_admin: { class: "bg-orange-600", label: "Super Admin" }
    }
    
    return (
      <Badge className={variants[role].class}>
        {variants[role].label}
      </Badge>
    )
  }

  // Don't render if not admin
  if (currentUser && !isAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">User Management</h1>
        <div className="bg-gray-800 rounded-lg p-6">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={exportUsers}
            disabled={exportLoading}
            className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Download className="w-4 h-4 mr-2" />
            {exportLoading ? 'Exporting...' : 'Export CSV'}
          </Button>
          
          <Button 
            onClick={fetchUsers}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user, index) => {
              const stats = userStats[user.id] || { totalAds: 0, activeAds: 0, soldAds: 0, totalViews: 0, reportedAds: 0 }
              
              return (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-white text-lg">
                          {user.full_name || 'Unknown User'}
                        </h3>
                        {getStatusBadge(user.status)}
                        {getRoleBadge(user.role)}
                        <span className="text-sm text-gray-400">#{index + 1}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                        <div className="flex items-center gap-1 text-gray-300">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        
                        {user.phone && (
                          <div className="flex items-center gap-1 text-gray-300">
                            <Phone className="w-3 h-3" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1 text-gray-300">
                          <Calendar className="w-3 h-3" />
                          <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-gray-300">
                          <FileText className="w-3 h-3" />
                          <span>{stats.totalAds} ads • {stats.activeAds} active</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 sm:mt-0 sm:pl-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewUserDetails(user)}
                      className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-600"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-600"
                          disabled={actionLoading === user.id}
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <MoreVertical className="w-4 h-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                        <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-600" />
                        
                        {user.status !== 'active' && (
                          <DropdownMenuItem 
                            onClick={() => handleUserAction(user.id, 'activate')}
                            className="text-green-400 hover:bg-green-900 hover:text-green-300"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Activate User
                          </DropdownMenuItem>
                        )}
                        
                        {user.status !== 'suspended' && user.status !== 'deleted' && (
                          <DropdownMenuItem 
                            onClick={() => handleUserAction(user.id, 'suspend')}
                            className="text-yellow-400 hover:bg-yellow-900 hover:text-yellow-300"
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Suspend User
                          </DropdownMenuItem>
                        )}
                        
                        {user.status !== 'banned' && user.status !== 'deleted' && (
                          <DropdownMenuItem 
                            onClick={() => handleUserAction(user.id, 'ban')}
                            className="text-red-400 hover:bg-red-900 hover:text-red-300"
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Ban User
                          </DropdownMenuItem>
                        )}
                        
                        {user.status !== 'deleted' && (
                          <DropdownMenuItem 
                            onClick={() => setDeleteDialog({user, type: 'soft'})}
                            className="text-orange-400 hover:bg-orange-900 hover:text-orange-300"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Soft Delete
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator className="bg-gray-600" />
                        
                        <DropdownMenuItem 
                          onClick={() => setDeleteDialog({user, type: 'hard'})}
                          className="text-red-400 hover:bg-red-900 hover:text-red-300"
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Permanent Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}

            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No users found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="max-w-4xl bg-gray-800 border-gray-700 text-white">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  User Details: {selectedUser.full_name || 'Unknown User'}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Complete user information and statistics
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Information */}
                <Card className="bg-gray-750 border-gray-600 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-400">Full Name</label>
                        <p className="text-white">{selectedUser.full_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Email</label>
                        <p className="text-white">{selectedUser.email}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Phone</label>
                        <p className="text-white">{selectedUser.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Location</label>
                        <p className="text-white">{selectedUser.location || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Member Since</label>
                        <p className="text-white">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Last Login</label>
                        <p className="text-white">
                          {selectedUser.last_sign_in_at 
                            ? new Date(selectedUser.last_sign_in_at).toLocaleDateString()
                            : 'Never'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Status</label>
                        <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Role</label>
                        <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                      </div>
                    </div>
                    
                    {selectedUser.bio && (
                      <div>
                        <label className="text-sm text-gray-400">Bio</label>
                        <p className="text-white mt-1">{selectedUser.bio}</p>
                      </div>
                    )}

                    {selectedUser.status === 'deleted' && (
                      <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
                        <label className="text-sm text-red-400">Deletion Information</label>
                        <p className="text-white text-sm mt-1">
                          <strong>Reason:</strong> {selectedUser.deletion_reason || 'Not specified'}
                        </p>
                        <p className="text-white text-sm">
                          <strong>Deleted on:</strong> {selectedUser.deleted_at ? new Date(selectedUser.deleted_at).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Statistics */}
                <Card className="bg-gray-750 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {userStats[selectedUser.id] ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Total Ads</span>
                          <Badge variant="secondary" className="bg-blue-600">
                            {userStats[selectedUser.id].totalAds}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Active Ads</span>
                          <Badge variant="secondary" className="bg-green-600">
                            {userStats[selectedUser.id].activeAds}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Sold Ads</span>
                          <Badge variant="secondary" className="bg-purple-600">
                            {userStats[selectedUser.id].soldAds}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Total Views</span>
                          <Badge variant="secondary" className="bg-yellow-600">
                            {userStats[selectedUser.id].totalViews}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Reported Ads</span>
                          <Badge variant="secondary" className="bg-red-600">
                            {userStats[selectedUser.id].reportedAds}
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-gray-400 py-4">
                        <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                        <p>Loading statistics...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setUserDetailsOpen(false)}
                  className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setUserDetailsOpen(false)
                    fetchUsers()
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Data
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-500">
              {deleteDialog?.type === 'soft' ? 'Confirm Soft Delete' : 'Permanent Deletion Warning'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {deleteDialog?.type === 'soft' ? (
                <>
                  You are about to soft delete <strong className="text-white">{deleteDialog.user.email}</strong>.
                  This will hide the user from the system but keep their data in the database for auditing purposes.
                </>
              ) : (
                <>
                  <AlertTriangle className="w-6 h-6 text-red-500 inline mr-2" />
                  <strong className="text-red-400">DANGEROUS ACTION:</strong> You are about to permanently delete 
                  <strong className="text-white"> {deleteDialog?.user.email}</strong>. This will remove all their data 
                  and cannot be undone!
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {deleteDialog?.type === 'soft' && (
            <div className="space-y-4">
              <label htmlFor="delete-reason" className="block text-sm font-medium text-gray-300">
                Reason for Deletion <span className="text-red-500">*</span>
              </label>
              <Input
                id="delete-reason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Enter reason for deletion..."
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialog(null)
                setDeleteReason("")
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              disabled={actionLoading === deleteDialog?.user.id}
            >
              Cancel
            </Button>
            <Button
              className={deleteDialog?.type === 'soft' ? "bg-orange-600 hover:bg-orange-700" : "bg-red-600 hover:bg-red-700"}
              onClick={() => {
                if (deleteDialog?.type === 'soft') {
                  if (!deleteReason.trim()) {
                    toast.error('Please provide a deletion reason')
                    return
                  }
                  handleUserAction(deleteDialog.user.id, 'soft_delete', deleteReason)
                } else {
                  handleHardDelete(deleteDialog!.user.id)
                }
              }}
              disabled={actionLoading === deleteDialog?.user.id || (deleteDialog?.type === 'soft' && !deleteReason.trim())}
            >
              {actionLoading === deleteDialog?.user.id ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : deleteDialog?.type === 'soft' ? (
                <Trash2 className="w-4 h-4 mr-2" />
              ) : (
                <AlertTriangle className="w-4 h-4 mr-2" />
              )}
              {actionLoading === deleteDialog?.user.id ? 'Processing...' : 
               deleteDialog?.type === 'soft' ? 'Soft Delete' : 'Permanently Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
