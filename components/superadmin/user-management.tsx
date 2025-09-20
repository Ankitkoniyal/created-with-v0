// components/superadmin/super-admin-nav.tsx
"use client";

import {
  Crown,
  Settings,
  Users,
  BarChart3,
  FileText,
  Search,
  LogOut,
  MapPin,
  Tag,
  Database,
  Eye,
  Clock,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavStats {
  totalAds: number;
  activeAds: number;
  pendingReview: number;
  reportedAds: number;
}

interface SuperAdminNavProps {
  stats?: Partial<NavStats>;
  onNavigate: (view: string) => void;
  activeView: string;
}

// Default stats to prevent undefined errors
const defaultStats: NavStats = {
  totalAds: 0,
  activeAds: 0,
  pendingReview: 0,
  reportedAds: 0,
};

const superAdminNavItems = [
  {
    title: "Dashboard",
    href: "/superadmin",
    icon: BarChart3,
    badgeKey: "pendingReview" as keyof NavStats,
    view: "overview" as const,
  },
  {
    title: "Ads Management",
    href: "/superadmin/ads",
    icon: FileText,
    badgeKey: "activeAds" as keyof NavStats,
    view: "ads" as const,
  },
  {
    title: "Pending Review",
    href: "/superadmin/pending",
    icon: Clock,
    badgeKey: "pendingReview" as keyof NavStats,
    view: "pending" as const,
  },
  {
    title: "Reported Ads",
    href: "/superadmin/reported",
    icon: Flag,
    badgeKey: "reportedAds" as keyof NavStats,
    view: "reported" as const,
  },
  {
    title: "User Management",
    href: "/superadmin/users",
    icon: Users,
    badgeKey: null,
    view: "users" as const,
  },
  {
    title: "Categories",
    href: "/superadmin/categories",
    icon: Tag,
    badgeKey: null,
    view: "categories" as const,
  },
  {
    title: "Localities",
    href: "/superadmin/localities",
    icon: MapPin,
    badgeKey: null,
    view: "localities" as const,
  },
  {
    title: "Analytics",
    href: "/superadmin/analytics",
    icon: Database,
    badgeKey: null,
    view: "analytics" as const,
  },
  {
    title: "System Settings",
    href: "/superadmin/settings",
    icon: Settings,
    badgeKey: null,
    view: "settings" as const,
  },
];

export function SuperAdminNav({ stats = defaultStats, onNavigate, activeView }: SuperAdminNavProps) {
  // Merge provided stats with defaults to ensure all properties exist
  const safeStats = { ...defaultStats, ...stats };

  const handleSignOut = async () => {
    // Implement sign out logic here
    const supabase = await getSupabaseClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="w-72 bg-gray-900 text-white p-6 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700">
        <div className="w-12 h-12 bg-gradient-to-r from-green-700 to-green-800 rounded-lg flex items-center justify-center">
          <Crown className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-white">Marketplace Admin</h2>
          <p className="text-sm text-gray-400">Super Admin Panel</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search ads, users, reports..."
          className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      <nav className="space-y-1 flex-1">
        {superAdminNavItems.map((item) => {
          const isActive = activeView === item.view;
          const Icon = item.icon;
          const badgeValue = item.badgeKey ? safeStats[item.badgeKey] : null;
          
          return (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={cn(
                "flex items-center justify-between w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-green-700 text-white" 
                  : "text-gray-300 hover:bg-gray-800 hover:text-white",
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.title}</span>
              </div>
              {badgeValue !== null && badgeValue > 0 && (
                <span className={cn("px-2 py-1 text-xs font-semibold rounded-full",
                  isActive ? "bg-white text-green-700" : "bg-green-700 text-white"
                )}>
                  {badgeValue}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-gray-700">
        <button 
          onClick={handleSignOut}
          className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-900 rounded-lg transition-colors flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}