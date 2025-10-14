// components/superadmin/super-admin-overview.tsx
"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  FileText,
  Eye,
  Clock,
  Flag,
  CheckCircle,
  Search,
  BarChart3,
  ChevronDown,
  MoreHorizontal,
  UserPlus,
  TrendingUp,
  AlertTriangle
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DashboardStats {
  totalUsers: number;
  totalAds: number;
  activeAds: number;
  pendingReview: number;
  reportedAds: number;
}

interface RecentUser {
  id: string;
  email: string;
  created_at: string;
  full_name?: string | null;
}

interface RecentAd {
  id: string;
  title: string;
  price: number;
  category: string;
  created_at: string;
  status: string;
  user_email: string;
}

interface SignupData {
  date: string;
  count: number;
}

interface SuperAdminOverviewProps {
  stats?: Partial<DashboardStats>;
  onNavigate: (view: string, id?: string) => void;
}

const defaultStats: DashboardStats = {
  totalUsers: 0,
  totalAds: 0,
  activeAds: 0,
  pendingReview: 0,
  reportedAds: 0,
};

// Helper function to calculate date for filtering
const getDateRange = (range: "7d" | "30d" | "90d") => {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export function SuperAdminOverview({ 
  stats = defaultStats, 
  onNavigate
}: SuperAdminOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [safeStats, setSafeStats] = useState<DashboardStats>(defaultStats);
  const [recentAds, setRecentAds] = useState<RecentAd[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [signupData, setSignupData] = useState<SignupData[]>([]);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");

  // This useEffect handles initial load and range change for data fetching
  useEffect(() => {
    setSafeStats({ ...defaultStats, ...stats });
    fetchRecentData();
    fetchSignupData(timeRange);
  }, [stats, timeRange]);

  // This useEffect sets up the REALTIME listener for new signups
  useEffect(() => {
    let userChannel: any;

    const setupRealtime = async () => {
      const supabase = await getSupabaseClient();
      
      // Realtime Subscription for New User Signups
      userChannel = supabase
        .channel('new-user-signups')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'profiles' }, // Listen for new rows in profiles
          (payload) => {
            const newProfile = payload.new as RecentUser;
            
            // 1. Update Recent Users List
            setRecentUsers(prevUsers => [
              {
                id: newProfile.id,
                email: newProfile.email,
                created_at: newProfile.created_at,
                full_name: newProfile.full_name,
              },
              ...prevUsers.slice(0, 4) // Keep the list max 5
            ]);
            
            // 2. Update Total Users Count
            setSafeStats(prev => ({ ...prev, totalUsers: prev.totalUsers + 1 }));
            
            console.log('Realtime: New user signed up:', newProfile.email);
          }
        )
        .subscribe();
    };

    setupRealtime();
    
    // Cleanup function
    return () => {
      if (userChannel) {
        getSupabaseClient().then(supabase => supabase.removeChannel(userChannel));
      }
    };
  }, []); // Empty dependency array means this runs only once on mount


  const fetchRecentData = async () => {
    try {
      const supabase = await getSupabaseClient();

      // Fetch Recent Users & Ads
      const [recentUsersRes, recentAdsRes] = await Promise.all([
        supabase.from('profiles').select('id, email, created_at, full_name').order('created_at', { ascending: false }).limit(5),
        supabase.from('products').select('id, title, price, category, created_at, status, user_id').order('created_at', { ascending: false }).limit(5),
      ]);

      // Fetch user emails for recent ads (optimized to fetch user emails in a batch, though not fully shown here, this structure assumes a profiles table)
      const userIds = [...new Set((recentAdsRes.data || []).map(ad => ad.user_id))]
      const { data: profilesMapData } = await supabase.from('profiles').select('id, email').in('id', userIds)
      const userEmailMap: Record<string, string> = (profilesMapData || []).reduce((acc, p) => ({...acc, [p.id]: p.email}), {})
      
      const adsWithEmails = (recentAdsRes.data || []).map(ad => ({
        ...ad,
        user_email: userEmailMap[ad.user_id] || 'Unknown User',
      }));

      setRecentUsers(recentUsersRes.data as RecentUser[] || []);
      setRecentAds(adsWithEmails as RecentAd[]);
    } catch (error) {
      console.error("Error fetching recent data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Simplified fetchSignupData for demonstration
  const fetchSignupData = async (range: "7d" | "30d" | "90d") => {
    const startDate = getDateRange(range);
    try {
      const supabase = await getSupabaseClient();
      
      // NOTE: This requires a custom function or view in Supabase for aggregation by date.
      // For a client-side approximation:
      const { data } = await supabase
        .from('profiles')
        .select('created_at')
        .gt('created_at', startDate)
      
      const aggregation = (data || []).reduce((acc, user) => {
        const dateKey = user.created_at.substring(0, 10); // YYYY-MM-DD
        acc[dateKey] = (acc[dateKey] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Transform to chart data format
      const chartData: SignupData[] = Object.keys(aggregation).map(date => ({
        date,
        count: aggregation[date],
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setSignupData(chartData);

    } catch (error) {
      console.error("Error fetching signup data:", error);
    }
  }

  const approveAllAds = async () => {
    try {
      const supabase = await getSupabaseClient()
      const { error } = await supabase
        .from('products')
        .update({ status: 'active' })
        .eq('status', 'pending')
        
      if (error) throw error
      
      // Update local state to reflect change
      setSafeStats(prev => ({ ...prev, pendingReview: 0 }));
      alert("All pending ads approved successfully.")
    } catch (error) {
      console.error('Error approving all ads:', error)
      alert("Failed to approve all pending ads.")
    }
  }

  // Helper to format date
  const formatTime = (timestamp: string) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });


  if (loading) {
    return (
      <div className="text-center py-10">
        <span className="text-white">Loading Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card for Total Users */}
        <Card className="p-5 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Total Users</span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="mt-1">
            <p className="text-3xl font-bold text-white">{safeStats.totalUsers}</p>
            {/* <p className="text-xs text-green-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" /> 
              {stats.userGrowth}% last 30 days
            </p> */}
          </div>
        </Card>

        {/* Card for Total Ads */}
        <Card className="p-5 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Total Ads</span>
            <FileText className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="mt-1">
            <p className="text-3xl font-bold text-white">{safeStats.totalAds}</p>
            {/* <p className="text-xs text-green-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" /> 
              {stats.adGrowth}% last 30 days
            </p> */}
          </div>
        </Card>

        {/* Card for Active Ads */}
        <Card className="p-5 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Active Ads</span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="mt-1">
            <p className="text-3xl font-bold text-white">{safeStats.activeAds}</p>
            <p className="text-xs text-gray-400 mt-1">
              {Math.round((safeStats.activeAds / (safeStats.totalAds || 1)) * 100)}% of total
            </p>
          </div>
        </Card>

        {/* Card for Pending Review */}
        <Card 
          className="p-5 bg-gray-800 border-gray-700 cursor-pointer hover:border-yellow-500 transition-colors"
          onClick={() => onNavigate('pending')}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Pending Review</span>
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="mt-1">
            <p className="text-3xl font-bold text-white">{safeStats.pendingReview}</p>
            <p className="text-xs text-yellow-400 mt-1">
              {safeStats.pendingReview > 0 ? 'Action Required' : 'All Clear'}
            </p>
          </div>
        </Card>
        
        {/* Card for Reported Ads */}
        <Card 
          className="p-5 bg-gray-800 border-gray-700 cursor-pointer hover:border-red-500 transition-colors"
          onClick={() => onNavigate('reports')}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Reported Ads</span>
            <Flag className="w-5 h-5 text-red-500" />
          </div>
          <div className="mt-1">
            <p className="text-3xl font-bold text-white">{safeStats.reportedAds}</p>
            <p className="text-xs text-red-400 mt-1">
              {safeStats.reportedAds > 0 ? 'Critical Review' : 'No Active Reports'}
            </p>
          </div>
        </Card>
      </div>

      {/* Charts and Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Signups Chart (Simulated) */}
        <Card className="lg:col-span-2 p-6 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Signups Over Time</h3>
            <Select value={timeRange} onValueChange={setTimeRange as (value: string) => void}>
              <SelectTrigger className="w-[120px] bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600 text-white">
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="h-60 flex items-end gap-2 border-l border-b border-gray-700 pt-4">
            {signupData.length > 0 ? (
              signupData.map((dataPoint) => (
                <div 
                  key={dataPoint.date} 
                  className="flex flex-col items-center justify-end group h-full"
                  style={{ width: `${100 / signupData.length}%` }}
                >
                  <div 
                    className="bg-green-600 w-3 rounded-t-sm transition-all duration-300 relative"
                    style={{ height: `${(dataPoint.count / Math.max(...signupData.map(d => d.count))) * 90 + 10}%` }}
                  >
                     <span className="absolute -top-6 text-xs text-green-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {dataPoint.count}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 mt-1">{new Date(dataPoint.date).getDate()}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 w-full text-center">No signup data for this period.</p>
            )}
          </div>
          <div className="flex justify-between text-xs text-gray-400 pt-1">
             <span>{signupData.length > 0 ? new Date(signupData[0].date).toLocaleDateString() : ''}</span>
             <span>{signupData.length > 0 ? new Date(signupData[signupData.length - 1].date).toLocaleDateString() : ''}</span>
          </div>
        </Card>

        {/* Recent Users List */}
        <Card className="p-6 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-500" /> Recent Signups
            </h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('users')} className="text-gray-400 hover:text-white">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between border-b border-gray-700 pb-2 last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-white">{user.full_name || 'New User'}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-green-400 border-green-700 text-xs">New</Badge>
                  <p className="text-xs text-gray-500 mt-1">{formatTime(user.created_at)}</p>
                </div>
              </div>
            ))}
            {recentUsers.length === 0 && <p className="text-gray-500 text-sm text-center">No recent signups.</p>}
          </div>
        </Card>
      </div>
      
      {/* Recent Ads and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Ads List */}
        <Card className="lg:col-span-2 p-6 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-yellow-500" /> Recent Ads Posted
            </h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('ads')} className="text-gray-400 hover:text-white">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {recentAds.map((ad) => (
              <div key={ad.id} className="flex items-center justify-between border-b border-gray-700 pb-2 last:border-b-0">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-medium text-white truncate">{ad.title}</p>
                  <p className="text-xs text-gray-400 truncate">{ad.user_email} in {ad.category}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <Badge 
                    className={`text-xs ${ad.status === 'active' ? 'bg-green-600' : ad.status === 'pending' ? 'bg-yellow-600' : 'bg-red-600'}`}
                  >
                    {ad.status}
                  </Badge>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {recentAds.length === 0 && <p className="text-gray-500 text-sm text-center">No recent ads found.</p>}
          </div>
        </Card>
        
        {/* Quick Actions */}
        <Card className="p-6 bg-gray-800 border-gray-700 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          </div>
          
          {safeStats.pendingReview > 0 && (
            <div className="mt-4">
              <Button 
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                onClick={approveAllAds}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve All Pending Ads ({safeStats.pendingReview})
              </Button>
            </div>
          )}
          
          <div className="mt-2">
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              onClick={() => onNavigate('reports')}
              disabled={safeStats.reportedAds === 0}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Review Reported Ads ({safeStats.reportedAds})
            </Button>
          </div>
        </Card>
      </div>

      {/* System Status - Placeholder */}
      <Card className="p-0 bg-gray-800 border-gray-700 rounded-lg shadow-md overflow-hidden">
        <div className="p-5 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">System Status</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-700">
          {[
            { name: 'API Server', status: 'Online', color: 'text-green-400' },
            { name: 'Database', status: 'Connected', color: 'text-green-400' },
            { name: 'Storage', status: 'Normal', color: 'text-green-400' },
            { name: 'Cache', status: 'Active', color: 'text-green-400' },
          ].map((service, index) => (
            <div key={index} className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">{service.name}</span>
                <span className={`text-xs font-medium ${service.color}`}>
                  <span className="inline-block w-2 h-2 mr-1 rounded-full bg-current"></span>
                  {service.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
