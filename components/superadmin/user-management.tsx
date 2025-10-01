// components/superadmin/user-management.tsx
"use client"

import { useState, useEffect } from "react"
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
  AlertTriangle,
  User,
  Phone,
  MapPin,
  FileText,
  BarChart3,
  X
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
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

interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  location: string | null
  bio: string | null
  status: 'active' | 'suspended' | 'banned'
  created_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
}

interface UserStats {
  totalAds: number
  activeAds: number
  soldAds: number
  totalViews: number
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userStats, setUserStats] = useState<Record<string, UserStats>>({})
  const [userDetailsOpen, setUserDetailsOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const supabase = await getSupabaseClient()
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching users:', error)
        return
      }

      setUsers(data || [])
      
      // Fetch stats for all users
      if (data && data.length > 0) {
        await fetchUsersStats(data.map(user => user.id))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsersStats = async (userIds: string[]) => {
    try {
      const supabase = await getSupabaseClient()
      const stats: Record<string, UserStats> = {}

      for (const userId of userIds) {
        const [adsResult, activeAdsResult, soldAdsResult] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact' }).eq('user_id', userId),
          supabase.from('products').select('*', { count: 'exact' }).eq('user_id', userId).eq('status', 'active'),
          supabase.from('products').select('*', { count: 'exact' }).eq('user_id', userId).eq('status', 'sold'),
        ])

        const totalViews = adsResult.data?.reduce((sum, ad) => sum + (ad.views || 0), 0) || 0

        stats[userId] = {
          totalAds: adsResult.count || 0,
          activeAds: activeAdsResult.count || 0,
          soldAds: soldAdsResult.count || 0,
          totalViews: totalViews
        }
      }

      setUserStats(stats)
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'ban' | 'delete') => {
    try {
      setActionLoading(userId)
      const supabase = await getSupabaseClient()

      let newStatus: User['status'] = 'active'
      
      switch (action) {
        case 'suspend':
          newStatus = 'suspended'
          break
        case 'ban':
          newStatus = 'banned'
          break
        case 'activate':
          newStatus = 'active'
          break
        case 'delete':
          // Implement soft delete or actual deletion
          await supabase.from('profiles').delete().eq('id', userId)
          setUsers(prev => prev.filter(user => user.id !== userId))
          return
      }

      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) {
        console.error(`Error ${action} user:`, error)
        return
      }

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ))

    } catch (error) {
      console.error(`Error ${action} user:`, error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewUserDetails = async (user: User) => {
    setSelectedUser(user)
    setUserDetailsOpen(true)
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery) ||
      user.location?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || user.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: User['status']) => {
    const variants = {
      active: { class: "bg-green-600", label: "Active" },
      suspended: { class: "bg-yellow-600", label: "Suspended" },
      banned: { class: "bg-red-600", label: "Banned" }
    }
    
    return variants[status]
  }

  const exportUsers = () => {
    const csvContent = [
      ['Serial No', 'Name', 'Email', 'Phone', 'Location', 'Status', 'Member Since', 'Last Login', 'Total Ads', 'Active Ads'],
      ...filteredUsers.map((user, index) => [
        index + 1,
        user.full_name || 'N/A',
        user.email,
        user.phone || 'N/A',
        user.location || 'N/A',
        user.status,
        new Date(user.created_at).toLocaleDateString(),
        user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never',
        userStats[user.id]?.totalAds || 0,
        userStats[user.id]?.activeAds || 0
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-64 bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-48 bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-20 bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-gray-400">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={exportUsers}
            className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          
          <Button 
            onClick={fetchUsers}
            className="bg-green-600 hover:bg-green-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
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
                placeholder="Search by name, email, phone, location..."
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
              const stats = userStats[user.id] || { totalAds: 0, activeAds: 0, soldAds: 0, totalViews: 0 }
              const statusBadge = getStatusBadge(user.status)
              
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
                        <Badge className={statusBadge.class}>
                          {statusBadge.label}
                        </Badge>
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
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <MoreVertical className="w-4 h-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                        <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-600" />
                        
                        {user.status === 'active' && (
                          <DropdownMenuItem 
                            onClick={() => handleUserAction(user.id, 'suspend')}
                            className="text-yellow-400 hover:bg-yellow-900 hover:text-yellow-300"
                          >
                            <Ban className="w-4 h-4 mr-2" />
                            Suspend User
                          </DropdownMenuItem>
                        )}
                        
                        {(user.status === 'suspended' || user.status === 'banned') && (
                          <DropdownMenuItem 
                            onClick={() => handleUserAction(user.id, 'activate')}
                            className="text-green-400 hover:bg-green-900 hover:text-green-300"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Activate User
                          </DropdownMenuItem>
                        )}
                        
                        {user.status !== 'banned' && (
                          <DropdownMenuItem 
                            onClick={() => handleUserAction(user.id, 'ban')}
                            className="text-red-400 hover:bg-red-900 hover:text-red-300"
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Ban User
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator className="bg-gray-600" />
                        
                        <DropdownMenuItem 
                          onClick={() => handleUserAction(user.id, 'delete')}
                          className="text-red-400 hover:bg-red-900 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete User
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
                    </div>
                    
                    {selectedUser.bio && (
                      <div>
                        <label className="text-sm text-gray-400">Bio</label>
                        <p className="text-white mt-1">{selectedUser.bio}</p>
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
                  onClick={() => handleViewUserDetails(selectedUser)}
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
    </div>
  )
}
