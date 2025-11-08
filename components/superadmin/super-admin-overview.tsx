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
  BarChart3,
  UserPlus,
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

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

  // Fetch all dashboard data
  const fetchDashboardStats = async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase client not available");
      }

      // Fetch all stats in parallel
      const [
        usersRes,
        adsRes,
        pendingRes,
        reportedRes
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('products').select('id', { count: 'exact' }),
        supabase.from('products').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('reports').select('id', { count: 'exact' })
      ]);

      // Fetch active ads separately
      const activeAdsRes = await supabase
        .from('products')
        .select('id', { count: 'exact' })
        .eq('status', 'active');

      const newStats: DashboardStats = {
        totalUsers: usersRes.count || 0,
        totalAds: adsRes.count || 0,
        activeAds: activeAdsRes.count || 0,
        pendingReview: pendingRes.count || 0,
        reportedAds: reportedRes.count || 0,
      };

      console.log("Dashboard stats fetched:", newStats);
      setSafeStats(newStats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Failed to load dashboard statistics");
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboardStats(),
        fetchRecentData(),
        fetchSignupData(timeRange)
      ]);
      setLoading(false);
    };

    fetchAllData();
  }, [timeRange]);

  useEffect(() => {
    let userChannel: any;

    const setupRealtime = () => {
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        console.error("Supabase client not available for real-time");
        return;
      }
      
      userChannel = supabase
        .channel('new-user-signups')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'profiles' },
          (payload) => {
            const newProfile = payload.new as RecentUser;
            
            setRecentUsers(prevUsers => [
              {
                id: newProfile.id,
                email: newProfile.email,
                created_at: newProfile.created_at,
                full_name: newProfile.full_name,
              },
              ...prevUsers.slice(0, 4)
            ]);
            
            setSafeStats(prev => ({ ...prev, totalUsers: prev.totalUsers + 1 }));
            
            toast.success(`New user signed up: ${newProfile.email}`);
          }
        )
        .subscribe();
    };

    setupRealtime();
    
    return () => {
      if (userChannel) {
        const supabase = getSupabaseClient();
        if (supabase) {
          supabase.removeChannel(userChannel);
        }
      }
    };
  }, []);

  const fetchRecentData = async () => {
    try {
      const supabase = getSupabaseClient();

      if (!supabase) {
        throw new Error("Supabase client not available");
      }

      const [recentUsersRes, recentAdsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, email, created_at, full_name')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('products')
          .select('id, title, price, category, created_at, status, user_id')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      if (recentUsersRes.error) throw recentUsersRes.error;
      if (recentAdsRes.error) throw recentAdsRes.error;

      const userIds = [...new Set((recentAdsRes.data || []).map(ad => ad.user_id))];
      
      // Fetch user emails for the ads
      let userEmailMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profilesMapData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);
        
        if (!profilesError && profilesMapData) {
          userEmailMap = profilesMapData.reduce((acc, p) => ({
            ...acc, 
            [p.id]: p.email
          }), {});
        }
      }
      
      const adsWithEmails = (recentAdsRes.data || []).map(ad => ({
        ...ad,
        user_email: userEmailMap[ad.user_id] || 'Unknown User',
      }));

      setRecentUsers(recentUsersRes.data as RecentUser[] || []);
      setRecentAds(adsWithEmails as RecentAd[]);
    } catch (error) {
      console.error("Error fetching recent data:", error);
      toast.error("Failed to load recent data");
    }
  };

  const fetchSignupData = async (range: "7d" | "30d" | "90d") => {
    const startDate = getDateRange(range);
    try {
      const supabase = getSupabaseClient();

      if (!supabase) {
        throw new Error("Supabase client not available");
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Create date range for the selected period
      const dateRange: string[] = [];
      const endDate = new Date();
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        dateRange.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Aggregate data by date
      const aggregation = (data || []).reduce((acc, user) => {
        const dateKey = user.created_at.split('T')[0]; // Get YYYY-MM-DD
        acc[dateKey] = (acc[dateKey] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Fill in missing dates with 0
      const chartData: SignupData[] = dateRange.map(date => ({
        date,
        count: aggregation[date] || 0,
      }));

      console.log("Signup chart data:", chartData);
      setSignupData(chartData);

    } catch (error) {
      console.error("Error fetching signup data:", error);
      toast.error("Failed to load signup data");
    }
  }

  const approveAllAds = async () => {
    try {
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        throw new Error("Supabase client not available");
      }
      
      const { error } = await supabase
        .from('products')
        .update({ status: 'active' })
        .eq('status', 'pending');
        
      if (error) throw error;
      
      // Refresh stats after approval
      await fetchDashboardStats();
      await fetchRecentData();
      
      toast.success("All pending ads approved successfully!");
    } catch (error) {
      console.error('Error approving all ads:', error);
      toast.error("Failed to approve all pending ads");
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleViewAd = (adId: string) => {
    onNavigate('ads', adId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <span className="text-white text-lg">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2">
      <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Users */}
        <Card className="p-5 bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Total Users</span>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div className="mt-1">
            <p className="text-3xl font-bold text-white">{safeStats.totalUsers.toLocaleString()}</p>
          </div>
        </Card>

        {/* Total Ads */}
        <Card className="p-5 bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Total Ads</span>
            <FileText className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="mt-1">
            <p className="text-3xl font-bold text-white">{safeStats.totalAds.toLocaleString()}</p>
          </div>
        </Card>

        {/* Active Ads */}
        <Card className="p-5 bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Active Ads</span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="mt-1">
            <p className="text-3xl font-bold text-white">{safeStats.activeAds.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">
              {Math.round((safeStats.activeAds / (safeStats.totalAds || 1)) * 100)}% of total
            </p>
          </div>
        </Card>

        {/* Pending Review */}
        <Card 
          className="p-5 bg-gray-800 border-gray-700 cursor-pointer hover:border-yellow-500 transition-colors"
          onClick={() => onNavigate('pending')}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Pending Review</span>
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="mt-1">
            <p className="text-3xl font-bold text-white">{safeStats.pendingReview.toLocaleString()}</p>
            <p className="text-xs text-yellow-400 mt-1">
              {safeStats.pendingReview > 0 ? 'Action Required' : 'All Clear'}
            </p>
          </div>
        </Card>
        
        {/* Reported Ads */}
        <Card 
          className="p-5 bg-gray-800 border-gray-700 cursor-pointer hover:border-red-500 transition-colors"
          onClick={() => onNavigate('reported')}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">Reported Ads</span>
            <Flag className="w-5 h-5 text-red-500" />
          </div>
          <div className="mt-1">
            <p className="text-3xl font-bold text-white">{safeStats.reportedAds.toLocaleString()}</p>
            <p className="text-xs text-red-400 mt-1">
              {safeStats.reportedAds > 0 ? 'Critical Review' : 'No Active Reports'}
            </p>
          </div>
        </Card>
      </div>

      {/* Charts and Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signups Chart */}
        <Card className="lg:col-span-2 p-6 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Signups Over Time</h3>
            <Select value={timeRange} onValueChange={(value: "7d" | "30d" | "90d") => setTimeRange(value)}>
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
          <div className="h-60 flex items-end gap-1 border-l border-b border-gray-700 pt-4 pb-2 px-2">
            {signupData.length > 0 ? (
              signupData.map((dataPoint) => (
                <div 
                  key={dataPoint.date} 
                  className="flex flex-col items-center justify-end group h-full flex-1"
                >
                  <div 
                    className="bg-green-600 w-full max-w-8 rounded-t-sm transition-all duration-300 relative hover:bg-green-500 min-h-[20px]"
                    style={{ 
                      height: `${Math.max(20, (dataPoint.count / Math.max(...signupData.map(d => d.count), 1)) * 80)}%` 
                    }}
                  >
                    <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-green-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {dataPoint.count} signups
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 mt-1 truncate w-full text-center">
                    {formatDate(dataPoint.date)}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <p className="text-gray-400">No signup data for this period.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Users List */}
        <Card className="p-6 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-500" /> Recent Signups
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onNavigate('users')} 
              className="text-gray-400 hover:text-white hover:bg-gray-700"
            >
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between border-b border-gray-700 pb-2 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {user.full_name || 'New User'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <Badge variant="outline" className="text-green-400 border-green-700 text-xs">
                    New
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTime(user.created_at)}
                  </p>
                </div>
              </div>
            ))}
            {recentUsers.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No recent signups.</p>
            )}
          </div>
        </Card>
      </div>
      
      {/* Recent Ads Only - Quick Actions Removed */}
      <div className="grid grid-cols-1 gap-6">
        {/* Recent Ads List */}
        <Card className="p-6 bg-gray-800 border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-yellow-500" /> Recent Ads Posted
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onNavigate('ads')} 
              className="text-gray-400 hover:text-white hover:bg-gray-700"
            >
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {recentAds.map((ad) => (
              <div key={ad.id} className="flex items-center justify-between border-b border-gray-700 pb-2 last:border-b-0">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-medium text-white truncate">{ad.title}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {ad.user_email} • {ad.category} • ${ad.price}
                  </p>
                </div>
                <div className="text-right flex items-center gap-3 flex-shrink-0">
                  <Badge 
                    className={`text-xs ${
                      ad.status === 'active' ? 'bg-green-600' : 
                      ad.status === 'pending' ? 'bg-yellow-600' : 
                      'bg-red-600'
                    }`}
                  >
                    {ad.status}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleViewAd(ad.id)}
                    className="text-gray-400 hover:text-white p-1 h-8 w-8"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {recentAds.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No recent ads found.</p>
            )}
          </div>
        </Card>
      </div>

      {/* System Status */}
      <Card className="bg-gray-800 border-gray-700">
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
                <span className={`text-xs font-medium ${service.color} flex items-center gap-1`}>
                  <span className="inline-block w-2 h-2 rounded-full bg-current"></span>
                  {service.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
