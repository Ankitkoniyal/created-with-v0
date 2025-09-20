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
  TrendingUp
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
  name?: string;
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

  useEffect(() => {
    // Merge provided stats with defaults
    setSafeStats({ ...defaultStats, ...stats });
    fetchRecentData();
    fetchSignupData(timeRange);
  }, [stats, timeRange]);

  const fetchRecentData = async () => {
    try {
      const supabase = await getSupabaseClient();

      const [recentUsersRes, recentAdsRes] = await Promise.all([
        supabase.from('profiles').select('id, email, created_at, full_name').order('created_at', { ascending: false }).limit(5),
        supabase.from('products').select('id, title, price, category, created_at, status, user_id').order('created_at', { ascending: false }).limit(5),
      ]);

      // Get user emails for ads
      const adsWithEmails = await Promise.all(
        (recentAdsRes.data || []).map(async (ad) => {
          const { data: userData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', ad.user_id)
            .single();

          return {
            ...ad,
            user_email: userData?.email || 'Unknown'
          };
        })
      );

      setRecentUsers(recentUsersRes.data || []);
      setRecentAds(adsWithEmails);
    } catch (error) {
      console.error("Error fetching recent data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSignupData = async (range: "7d" | "30d" | "90d") => {
    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', getStartDate(range))
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      // Process data to count signups by day
      const signupsByDay: Record<string, number> = {};
      
      data?.forEach(user => {
        const date = new Date(user.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        
        signupsByDay[date] = (signupsByDay[date] || 0) + 1;
      });

      // Convert to array format
      const signupArray = Object.entries(signupsByDay).map(([date, count]) => ({
        date,
        count
      }));

      setSignupData(signupArray);
    } catch (error) {
      console.error("Error fetching signup data:", error);
      setSignupData([]);
    }
  };

  const getStartDate = (range: "7d" | "30d" | "90d") => {
    const now = new Date();
    const startDate = new Date();
    
    switch (range) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
    }
    
    return startDate.toISOString();
  };

  const approveAd = async (adId: string) => {
    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase
        .from('products')
        .update({ status: 'active' })
        .eq('id', adId);

      if (error) throw error;

      // Update local state
      setRecentAds(prev => prev.map(ad => 
        ad.id === adId ? { ...ad, status: 'active' } : ad
      ));
    } catch (error) {
      console.error("Error approving ad:", error);
    }
  };

  const approveAllAds = async () => {
    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase
        .from('products')
        .update({ status: 'active' })
        .eq('status', 'pending');

      if (error) throw error;

      // Update local state
      setRecentAds(prev => prev.map(ad => 
        ad.status === 'pending' ? { ...ad, status: 'active' } : ad
      ));
    } catch (error) {
      console.error("Error approving all ads:", error);
    }
  };

  const handleUserClick = (userId: string) => {
    onNavigate('users', userId);
  };

  const handleAdClick = (adId: string) => {
    onNavigate('ads', adId);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="h-8 w-64 bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 w-80 bg-gray-700 rounded mt-2 animate-pulse"></div>
          </div>
          <div className="h-10 w-64 bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Card key={i} className="p-4 bg-gray-800 border-gray-700 animate-pulse">
              <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-700 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const systemStats = [
    { 
      title: "Total Users", 
      value: safeStats.totalUsers.toLocaleString(), 
      icon: Users, 
      color: "text-blue-400", 
      bgColor: "bg-blue-900/30",
      onClick: () => onNavigate('users')
    },
    { 
      title: "Total Ads", 
      value: safeStats.totalAds.toLocaleString(), 
      icon: FileText, 
      color: "text-purple-400", 
      bgColor: "bg-purple-900/30",
      onClick: () => onNavigate('ads')
    },
    { 
      title: "Active Ads", 
      value: safeStats.activeAds.toLocaleString(), 
      icon: Eye, 
      color: "text-green-400", 
      bgColor: "bg-green-900/30",
      onClick: () => onNavigate('ads')
    },
    { 
      title: "Pending Review", 
      value: safeStats.pendingReview.toLocaleString(), 
      icon: Clock, 
      color: "text-yellow-400", 
      bgColor: "bg-yellow-900/30",
      onClick: () => onNavigate('pending')
    },
    { 
      title: "Reported Ads", 
      value: safeStats.reportedAds.toLocaleString(), 
      icon: Flag, 
      color: "text-red-400", 
      bgColor: "bg-red-900/30",
      onClick: () => onNavigate('reported')
    },
  ];

  const maxSignupCount = signupData.length > 0 ? Math.max(...signupData.map(d => d.count)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-gray-400">Welcome back, here's what's happening today</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search ads, users, reports..."
            className="w-full sm:w-64 pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {systemStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={stat.title} 
              className="p-4 bg-gray-800 border-gray-700 rounded-lg shadow-md hover:border-gray-600 transition-colors cursor-pointer"
              onClick={stat.onClick}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* User Signups Graph */}
      <Card className="p-6 bg-gray-800 border-gray-700 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">User Signups Over Time</h2>
          <Select value={timeRange} onValueChange={(value: "7d" | "30d" | "90d") => setTimeRange(value)}>
            <SelectTrigger className="w-[120px] bg-gray-700 border-gray-600 text-white rounded-lg">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white rounded-lg">
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {signupData.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
            No signup data available for this period.
          </div>
        ) : (
          <div className="h-64 flex items-end space-x-1 sm:space-x-2 p-2">
            {signupData.map((data, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center justify-end group relative"
              >
                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gray-800 text-white text-xs rounded-md py-1 px-2">
                  {data.count} signups on {data.date}
                </div>
                <div
                  className="w-full bg-blue-500 rounded-t-lg transition-all duration-300 ease-in-out hover:bg-blue-400"
                  style={{ height: `${maxSignupCount > 0 ? (data.count / maxSignupCount) * 100 : 0}%` }}
                ></div>
                <span className="text-xs text-gray-400 mt-1">
                  {data.date.split('/')[1]}/{data.date.split('/')[0]}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Signed Up Users */}
        <Card className="p-0 bg-gray-800 border-gray-700 rounded-lg shadow-md overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Recently Signed Up Users</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-400 hover:text-white"
              onClick={() => onNavigate('users')}
            >
              View all
            </Button>
          </div>
          {recentUsers.length === 0 ? (
            <div className="text-center py-12 px-4 text-gray-400">
              <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
              No new users recently.
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {recentUsers.map((user) => (
                <div 
                  key={user.id} 
                  className="p-4 hover:bg-gray-750/50 transition-colors cursor-pointer group"
                  onClick={() => handleUserClick(user.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                          {user.email}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500 transform rotate-270 group-hover:text-white transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recently Posted Ads */}
        <Card className="p-0 bg-gray-800 border-gray-700 rounded-lg shadow-md overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Recently Posted Ads</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-400 hover:text-white"
              onClick={() => onNavigate('ads')}
            >
              View all
            </Button>
          </div>
          {recentAds.length === 0 ? (
            <div className="text-center py-12 px-4 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              No recent ads.
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {recentAds.map((ad) => (
                <div 
                  key={ad.id} 
                  className="p-4 hover:bg-gray-750/50 transition-colors cursor-pointer group"
                  onClick={() => handleAdClick(ad.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white truncate group-hover:text-purple-400 transition-colors">
                          {ad.title}
                        </h3>
                        <p className="text-sm text-gray-300 mt-1">${ad.price.toLocaleString()} • {ad.category}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          By: {ad.user_email} • {new Date(ad.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {ad.status === 'pending' && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 h-8 px-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            approveAd(ad.id);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      )}
                      <ChevronDown className="w-4 h-4 text-gray-500 transform rotate-270 group-hover:text-white transition-colors mt-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {safeStats.pendingReview > 0 && (
            <div className="p-4 border-t border-gray-700 bg-gray-850">
              <Button
                className="w-full bg-green-600 hover:bg-green-700 justify-center"
                onClick={approveAllAds}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve All Pending Ads ({safeStats.pendingReview})
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* System Status */}
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
                  <span className="inline-block w-2 h-2 rounded-full bg-current mr-1"></span>
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