// app/superadmin/users/[id]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, Mail, Phone, Globe2, Calendar, Activity, User, Package, Eye, 
  AlertTriangle, MapPin, FileText, Ban, Shield, TrendingUp, Clock, 
  CheckCircle, XCircle, Loader2, ExternalLink
} from "lucide-react"
import { toast } from "sonner"
interface UserProfile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  location: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string | null
  last_sign_in_at: string | null
  email_confirmed_at: string | null
  status: string
  role: string
  deleted_at: string | null
  deletion_reason: string | null
}

interface UserAd {
  id: string
  title: string
  status: string
  views: number
  created_at: string
  price: number
  category: string
  location: string
}

interface BanHistory {
  id: string
  banned_by: string
  banned_by_email?: string
  reason: string
  status_before: string
  status_after: string
  banned_at: string
  expires_at: string | null
  is_active: boolean
}

interface UserReport {
  id: string
  reporter_id: string
  reporter_email?: string
  product_id: string | null
  reason: string
  type: string
  status: string
  created_at: string
}

interface UserStats {
  totalAds: number
  activeAds: number
  soldAds: number
  totalViews: number
  reportedAds: number
  favorites: number
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const userId = params.id as string

  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [userAds, setUserAds] = useState<UserAd[]>([])
  const [banHistory, setBanHistory] = useState<BanHistory[]>([])
  const [userReports, setUserReports] = useState<UserReport[]>([])
  const [stats, setStats] = useState<UserStats>({
    totalAds: 0,
    activeAds: 0,
    soldAds: 0,
    totalViews: 0,
    reportedAds: 0,
    favorites: 0,
  })

  useEffect(() => {
    fetchUserDetails()
  }, [userId])

  const fetchUserDetails = async () => {
    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [
        profileResult,
        adsResult,
        banHistoryResult,
        reportsResult,
        favoritesResult
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('products').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('banned_users').select('id, banned_by, reason, status_before, status_after, banned_at, expires_at, is_active').eq('user_id', userId).order('banned_at', { ascending: false }),
        supabase.from('reports').select('id, reporter_id, product_id, reason, type, status, created_at').eq('reported_user_id', userId).order('created_at', { ascending: false }).limit(50),
        supabase.from('favorites').select('id').eq('user_id', userId),
      ])

      if (profileResult.error) {
        throw new Error('User not found')
      }
      
      setUser(profileResult.data)
      setUserAds(adsResult.data || [])

      // Process ban history with admin emails
      const banHistoryData = (banHistoryResult.data || []) as any[]
      if (banHistoryData.length > 0) {
        const adminIds = [...new Set(banHistoryData.map(b => b.banned_by))]
        const adminEmailsMap = new Map<string, string>()
        
        const adminPromises = adminIds.map(async (adminId) => {
          try {
            const { data: adminProfile } = await supabase
              .from("profiles")
              .select("email")
              .eq("id", adminId)
              .single()
            return adminProfile ? { id: adminId, email: adminProfile.email } : null
          } catch {
            return null
          }
        })
        
        const adminResults = await Promise.all(adminPromises)
        adminResults.forEach(result => {
          if (result) {
            adminEmailsMap.set(result.id, result.email || "Unknown")
          }
        })

        const enrichedBanHistory: BanHistory[] = banHistoryData.map(ban => ({
          ...ban,
          banned_by_email: adminEmailsMap.get(ban.banned_by) || "Unknown",
        }))
        setBanHistory(enrichedBanHistory)
      }

      // Process reports with reporter emails
      const reportsData = (reportsResult.data || []) as any[]
      if (reportsData.length > 0) {
        const reporterIds = [...new Set(reportsData.map(r => r.reporter_id))]
        const reporterEmailsMap = new Map<string, string>()
        
        const reporterPromises = reporterIds.map(async (reporterId) => {
          try {
            const { data: reporterProfile } = await supabase
              .from("profiles")
              .select("email")
              .eq("id", reporterId)
              .single()
            return reporterProfile ? { id: reporterId, email: reporterProfile.email } : null
          } catch {
            return null
          }
        })
        
        const reporterResults = await Promise.all(reporterPromises)
        reporterResults.forEach(result => {
          if (result) {
            reporterEmailsMap.set(result.id, result.email || "Unknown")
          }
        })

        const enrichedReports: UserReport[] = reportsData.map(report => ({
          ...report,
          reporter_email: reporterEmailsMap.get(report.reporter_id) || "Unknown",
        }))
        setUserReports(enrichedReports)
      }

      // Calculate stats
      const ads = adsResult.data || []
      setStats({
        totalAds: ads.length,
        activeAds: ads.filter(ad => ad.status === 'active').length,
        soldAds: ads.filter(ad => ad.status === 'sold').length,
        totalViews: ads.reduce((sum, ad) => sum + (ad.views || 0), 0),
        reportedAds: reportsData.length,
        favorites: favoritesResult.data?.length || 0,
      })

    } catch (error: any) {
      console.error('Failed to fetch user details:', error)
      toast.error(error.message || 'Failed to load user details')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(price)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600 text-white'
      case 'suspended': return 'bg-yellow-600 text-white'
      case 'banned': return 'bg-red-600 text-white'
      case 'deleted': return 'bg-gray-600 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="w-6 h-6 animate-spin text-green-500" />
          <span className="text-lg">Loading user details...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-white mb-2">User Not Found</h2>
          <p className="text-gray-400 mb-6">The user you're looking for doesn't exist.</p>
          <Button 
            onClick={() => router.push('/superadmin?view=users')}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to User Management
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-6">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.push('/superadmin?view=users')}
            className="mb-4 border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {user.full_name || "Unnamed User"}
              </h1>
              <p className="text-gray-400 text-lg">{user.email}</p>
            </div>
            <div className="flex gap-3">
              <Badge className={`${getStatusColor(user.status)} px-4 py-1.5 text-sm`}>
                {user.status.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="border-blue-500 text-blue-400 px-4 py-1.5 text-sm">
                {user.role || 'user'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: "Total Ads", value: stats.totalAds, icon: Package, color: "text-blue-400" },
            { label: "Active", value: stats.activeAds, icon: CheckCircle, color: "text-green-400" },
            { label: "Sold", value: stats.soldAds, icon: TrendingUp, color: "text-purple-400" },
            { label: "Views", value: stats.totalViews, icon: Eye, color: "text-yellow-400" },
            { label: "Reports", value: stats.reportedAds, icon: AlertTriangle, color: "text-red-400" },
            { label: "Favorites", value: stats.favorites, icon: Shield, color: "text-pink-400" },
          ].map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index} className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                    <span className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* User Profile Card */}
          <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-gray-700/50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Email</p>
                    <p className="font-medium text-white break-all">{user.email}</p>
                  </div>
                </div>
                
                {user.phone && (
                  <div className="flex items-start gap-3 p-4 bg-gray-700/50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Phone</p>
                      <p className="font-medium text-white">{user.phone}</p>
                    </div>
                  </div>
                )}
                
                {user.location && (
                  <div className="flex items-start gap-3 p-4 bg-gray-700/50 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Location</p>
                      <p className="font-medium text-white">{user.location}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-3 p-4 bg-gray-700/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Joined</p>
                    <p className="font-medium text-white">{new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {user.last_sign_in_at && (
                  <div className="flex items-start gap-3 p-4 bg-gray-700/50 rounded-lg">
                    <Activity className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Last Active</p>
                      <p className="font-medium text-white">{new Date(user.last_sign_in_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                
                {user.email_confirmed_at && (
                  <div className="flex items-start gap-3 p-4 bg-gray-700/50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Email Verified</p>
                      <p className="font-medium text-green-400">Verified</p>
                    </div>
                  </div>
                )}
              </div>
              
              {user.bio && (
                <div className="p-4 bg-gray-700/30 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Bio</h4>
                  <p className="text-white">{user.bio}</p>
                </div>
              )}
              
              {user.deletion_reason && (
                <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
                  <h4 className="text-sm font-medium text-red-400 mb-1 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Deletion Reason
                  </h4>
                  <p className="text-red-300 text-sm">{user.deletion_reason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => router.push(`/superadmin?view=users&action=activate&userId=${user.id}`)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Activate User
              </Button>
              <Button 
                variant="outline"
                className="w-full border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                onClick={() => router.push(`/superadmin?view=users&action=suspend&userId=${user.id}`)}
              >
                <Clock className="w-4 h-4 mr-2" />
                Suspend User
              </Button>
              <Button 
                variant="outline"
                className="w-full border-red-500 text-red-400 hover:bg-red-500/10"
                onClick={() => router.push(`/superadmin?view=users&action=ban&userId=${user.id}`)}
              >
                <Ban className="w-4 h-4 mr-2" />
                Ban User
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Ban/Suspend History */}
        {banHistory.length > 0 && (
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Ban className="w-5 h-5 text-red-400" />
                Ban/Suspend History
                <Badge variant="outline" className="border-red-500 text-red-400 ml-2">
                  {banHistory.length} {banHistory.length === 1 ? 'record' : 'records'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {banHistory.map((ban) => (
                  <div key={ban.id} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge 
                          className={ban.status_after === 'banned' 
                            ? 'bg-red-600 text-white' 
                            : ban.status_after === 'suspended'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-600 text-white'
                          }
                        >
                          {ban.status_after.toUpperCase()}
                        </Badge>
                        {ban.is_active && (
                          <Badge className="bg-red-600 text-white">ACTIVE</Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(ban.banned_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-400">Reason:</span>
                          <p className="text-white font-medium mt-1">{ban.reason || 'No reason provided'}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Status Change:</span>
                          <p className="text-white font-medium mt-1">
                            {ban.status_before} → {ban.status_after}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-400">Action By:</span>
                          <p className="text-white font-medium mt-1">{ban.banned_by_email || 'Unknown admin'}</p>
                        </div>
                        {ban.expires_at && (
                          <div>
                            <span className="text-gray-400">Expires:</span>
                            <p className="text-white font-medium mt-1">{new Date(ban.expires_at).toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reports Against User */}
        {userReports.length > 0 && (
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                Reports Against User
                <Badge variant="outline" className="border-orange-500 text-orange-400 ml-2">
                  {userReports.length} {userReports.length === 1 ? 'report' : 'reports'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {userReports.map((report) => (
                  <div key={report.id} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="outline"
                          className={report.status === 'pending' 
                            ? 'border-yellow-500 text-yellow-400' 
                            : report.status === 'resolved'
                            ? 'border-green-500 text-green-400'
                            : 'border-gray-500 text-gray-400'
                          }
                        >
                          {report.status.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="border-gray-500 text-gray-400">
                          {report.type}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(report.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-400">Reason:</span>
                        <p className="text-white font-medium mt-1">{report.reason}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-400">Reported By:</span>
                          <p className="text-white font-medium mt-1">{report.reporter_email || 'Unknown'}</p>
                        </div>
                        {report.product_id && (
                          <div>
                            <span className="text-gray-400">Related Product:</span>
                            <p className="text-white font-medium mt-1 font-mono text-xs">
                              {report.product_id.slice(0, 8)}...
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Listings */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Package className="w-5 h-5" />
              Recent Listings
            </CardTitle>
            <Badge variant="outline" className="border-gray-500 text-gray-400">
              {userAds.length} total
            </Badge>
          </CardHeader>
          <CardContent>
            {userAds.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No listings found</p>
                <p className="text-gray-500 text-sm mt-2">This user hasn't created any ads yet.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {userAds.map((ad) => (
                  <div 
                    key={ad.id} 
                    className="flex items-center justify-between p-4 bg-gray-700/50 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => router.push(`/product/${ad.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white truncate mb-1">{ad.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="font-medium text-green-400">{formatPrice(ad.price)}</span>
                        <span>•</span>
                        <span>{ad.category}</span>
                        <span>•</span>
                        <span>{ad.location}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {ad.views || 0} views
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(ad.created_at).toLocaleDateString()} at {new Date(ad.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <Badge 
                        variant="outline"
                        className={
                          ad.status === 'active' ? 'border-green-500 text-green-400' :
                          ad.status === 'sold' ? 'border-blue-500 text-blue-400' :
                          'border-gray-500 text-gray-400'
                        }
                      >
                        {ad.status}
                      </Badge>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
