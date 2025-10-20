"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import {
  Card, CardHeader, CardTitle, CardContent
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search, Users, Mail, Calendar, Phone, FileText,
  MoreVertical, Ban, CheckCircle, Eye, Download,
  RefreshCw, Trash2, Shield, Loader2, AlertTriangle, User, UserCheck, UserX
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogFooter,
  DialogTitle, DialogDescription
} from "@/components/ui/dialog"
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue
} from "@/components/ui/select"

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  location: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  status: "active" | "suspended" | "banned" | "deleted"
  role: "user" | "admin" | "super_admin"
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
  const router = useRouter()
  const supabase = createClient()
  const { user: currentUser, isAdmin } = useAuth()

  const [users, setUsers] = useState<UserProfile[]>([])
  const [userStats, setUserStats] = useState<Record<string, UserStats>>({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [userDetailsOpen, setUserDetailsOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ user: UserProfile, type: "soft" | "hard" } | null>(null)
  const [deleteReason, setDeleteReason] = useState("")

  // redirect non-admins
  useEffect(() => {
    if (currentUser && !isAdmin) router.push("/")
  }, [currentUser, isAdmin, router])

  // fetch all users
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setUsers(data as UserProfile[])
      await fetchUserStats(data.map(u => u.id))
    } catch (err) {
      console.error(err)
      toast.error("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const fetchUserStats = async (userIds: string[]) => {
    if (!userIds.length) return
    try {
      const stats: Record<string, UserStats> = {}
      userIds.forEach(id => stats[id] = { totalAds: 0, activeAds: 0, soldAds: 0, totalViews: 0, reportedAds: 0 })

      const { data: ads } = await supabase
        .from("products")
        .select("user_id, status, views")
        .in("user_id", userIds)

      ads?.forEach(ad => {
        const s = stats[ad.user_id]
        if (s) {
          s.totalAds++
          s.totalViews += ad.views || 0
          if (ad.status === "active") s.activeAds++
          if (ad.status === "sold") s.soldAds++
        }
      })

      const { data: reports } = await supabase
        .from("reports")
        .select("product_id, products!inner(user_id)")
        .in("products.user_id", userIds)

      reports?.forEach(r => {
        const product = (r as any).products
        if (product?.user_id) stats[product.user_id].reportedAds++
      })

      setUserStats(stats)
    } catch (err) {
      console.error(err)
    }
  }

  const handleUserAction = async (
    userId: string,
    action: "activate" | "suspend" | "ban" | "soft_delete",
    reason?: string
  ) => {
    setActionLoading(userId)
    try {
      const update: Partial<UserProfile> = {
        ...(action === "activate" && { status: "active" }),
        ...(action === "suspend" && { status: "suspended" }),
        ...(action === "ban" && { status: "banned" }),
        ...(action === "soft_delete" && {
          status: "deleted",
          deleted_at: new Date().toISOString(),
          deletion_reason: reason || null
        }),
      }

      const { error } = await supabase.from("profiles").update(update).eq("id", userId)
      if (error) throw error

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...update } : u))
      if (selectedUser?.id === userId) setSelectedUser({ ...selectedUser, ...update })

      toast.success(`User ${action.replace("_", " ")} successful`)
      setDeleteDialog(null)
      setDeleteReason("")
    } catch (err) {
      console.error(err)
      toast.error("Action failed")
    } finally {
      setActionLoading(null)
    }
  }

  const handleHardDelete = async (userId: string) => {
    setActionLoading(userId)
    try {
      await supabase.from("products").update({ status: "deleted" }).eq("user_id", userId)
      await supabase.from("profiles").delete().eq("id", userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
      setUserDetailsOpen(false)
      toast.success("User permanently deleted")
    } catch (err) {
      toast.error("Failed to delete user")
    } finally {
      setActionLoading(null)
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const match =
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (u.phone?.includes(searchQuery) ?? false)
      const matchStatus = statusFilter === "all" || u.status === statusFilter
      return match && matchStatus
    })
  }, [users, searchQuery, statusFilter])

  const exportUsers = async () => {
    try {
      const csv = [
        ["ID", "Name", "Email", "Status", "Role", "Joined", "Total Ads"],
        ...filteredUsers.map(u => [
          u.id, u.full_name || "N/A", u.email, u.status, u.role,
          new Date(u.created_at).toLocaleDateString(),
          userStats[u.id]?.totalAds || 0
        ])
      ].map(r => r.join(",")).join("\n")

      const blob = new Blob([csv], { type: "text/csv" })
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `users-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      toast.success("Export successful")
    } catch {
      toast.error("Export failed")
    }
  }

  const getStatusBadge = (status: UserProfile["status"]) => {
    const map = {
      active: { color: "bg-green-600", icon: UserCheck },
      suspended: { color: "bg-yellow-600", icon: UserX },
      banned: { color: "bg-red-600", icon: Ban },
      deleted: { color: "bg-gray-600", icon: Trash2 },
    }
    const Icon = map[status].icon
    return (
      <Badge className={`${map[status].color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" /> {status}
      </Badge>
    )
  }

  if (currentUser && !isAdmin)
    return <p className="text-gray-400 text-center">Access denied</p>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400">{loading ? "Loading..." : `${filteredUsers.length} users found`}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportUsers} disabled={!filteredUsers.length}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button onClick={fetchUsers}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-700 text-white border-gray-600"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-gray-700 text-white border-gray-600 w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600 text-white">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5" /> Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10 text-gray-400">
              <Loader2 className="w-6 h-6 mr-2 animate-spin" /> Loading...
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map(user => (
                <div key={user.id} className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold">{user.full_name || "Unnamed"}</span>
                      {getStatusBadge(user.status)}
                    </div>
                    <div className="text-sm text-gray-300 flex flex-wrap gap-3">
                      <span><Mail className="inline w-3 h-3" /> {user.email}</span>
                      {user.phone && <span><Phone className="inline w-3 h-3" /> {user.phone}</span>}
                      <span><Calendar className="inline w-3 h-3" /> {new Date(user.created_at).toLocaleDateString()}</span>
                      <span><FileText className="inline w-3 h-3" /> {userStats[user.id]?.totalAds || 0} ads</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setSelectedUser(user); setUserDetailsOpen(true) }}>
                      <Eye className="w-4 h-4 mr-1" /> Details
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-white">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {user.status !== "active" &&
                          <DropdownMenuItem onClick={() => handleUserAction(user.id, "activate")}>Activate</DropdownMenuItem>}
                        {user.status !== "suspended" &&
                          <DropdownMenuItem onClick={() => handleUserAction(user.id, "suspend")}>Suspend</DropdownMenuItem>}
                        {user.status !== "banned" &&
                          <DropdownMenuItem onClick={() => handleUserAction(user.id, "ban")}>Ban</DropdownMenuItem>}
                        {user.status !== "deleted" &&
                          <DropdownMenuItem onClick={() => setDeleteDialog({ user, type: "soft" })}>Soft Delete</DropdownMenuItem>}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-500"
                          onClick={() => setDeleteDialog({ user, type: "hard" })}
                        >
                          Permanent Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}

              {!filteredUsers.length && <p className="text-center text-gray-400 py-6">No users found</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>
              {deleteDialog?.type === "soft" ? "Soft Delete User" : "Permanent Delete"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {deleteDialog?.type === "soft"
                ? "This hides the user but keeps their data."
                : "This permanently removes the user and cannot be undone."}
            </DialogDescription>
          </DialogHeader>

          {deleteDialog?.type === "soft" && (
            <Input
              placeholder="Reason for deletion..."
              value={deleteReason}
              onChange={e => setDeleteReason(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
            />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button
              className={deleteDialog?.type === "soft" ? "bg-orange-600" : "bg-red-600"}
              onClick={() => {
                if (deleteDialog?.type === "soft") {
                  if (!deleteReason.trim()) return toast.error("Please enter reason")
                  handleUserAction(deleteDialog.user.id, "soft_delete", deleteReason)
                } else {
                  handleHardDelete(deleteDialog!.user.id)
                }
              }}
            >
              {actionLoading === deleteDialog?.user.id
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : deleteDialog?.type === "soft" ? "Soft Delete" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
