"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Users,
  Mail,
  Calendar,
  Phone,
  FileText,
  MoreVertical,
  Ban,
  CheckCircle,
  Eye,
  Download,
  RefreshCw,
  Trash2,
  Shield,
  Loader2,
  AlertTriangle,
  User,
  UserCheck,
  UserX,
  Globe2,
  Activity,
  Target,
  ExternalLink,
} from "lucide-react"
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
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

const PAGE_SIZE = 25

const ACCOUNT_STATUS: Array<"active" | "deactivated" | "suspended" | "banned" | "deleted"> = [
  "active",
  "deactivated",
  "suspended",
  "banned",
  "deleted",
]

const USER_EXPORT_FORMATS = [
  { type: "csv", label: "CSV (Comma separated)", extension: "csv", mime: "text/csv", delimiter: "," },
  {
    type: "tsv",
    label: "Excel TSV (.xls)",
    extension: "xls",
    mime: "application/vnd.ms-excel",
    delimiter: "\t",
  },
  { type: "json", label: "JSON", extension: "json", mime: "application/json" },
] as const

const logAdminAction = async (action: string, entityId: string, payload?: Record<string, unknown>) => {
  try {
    await fetch("/api/admin/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, entityType: "user", entityId, payload }),
    })
  } catch (error) {
    console.warn("Audit log failed", error)
  }
}

type AccountStatus = (typeof ACCOUNT_STATUS)[number]

type Role = "user" | "admin" | "super_admin" | null

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
  status: AccountStatus
  role: Role
  deleted_at: string | null
  deletion_reason: string | null
}

interface UserStats {
  totalAds: number
  activeAds: number
  soldAds: number
  totalViews: number
  reportedAds: number
  favorites: number
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

interface UserActivityLog {
  id: string
  action: string
  created_at: string
  actor_email?: string | null
  metadata?: Record<string, unknown> | null
}

interface UserAdSummary {
  id: string
  title: string
  status: string
  views: number
  created_at: string
  price: number
}

const matchesFilters = (
  profile: UserProfile,
  search: string,
  status: string,
  role: string,
) => {
  const term = search.trim().toLowerCase()
  const searchMatch =
    !term ||
    profile.email.toLowerCase().includes(term) ||
    (profile.full_name?.toLowerCase().includes(term) ?? false) ||
    (profile.phone?.includes(term) ?? false) ||
    (profile.location?.toLowerCase().includes(term) ?? false)
  const statusMatch = status === "all" || profile.status === status
  const roleMatch = role === "all" || (profile.role ?? "user") === role
  return searchMatch && statusMatch && roleMatch
}

export default function UserManagement() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { user: currentUser, isAdmin } = useAuth()

  const [users, setUsers] = useState<UserProfile[]>([])
  const [userCount, setUserCount] = useState(0)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [fetchingMore, setFetchingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilterEnabled, setStatusFilterEnabled] = useState(true)
  const [roleFilterEnabled, setRoleFilterEnabled] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    user: UserProfile
    type: "soft" | "hard"
  } | null>(null)
  const [deleteReason, setDeleteReason] = useState("")
  const [hardDeleteConfirm, setHardDeleteConfirm] = useState("")

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailUser, setDetailUser] = useState<UserProfile | null>(null)
  const [detailStats, setDetailStats] = useState<UserStats | null>(null)
  const [detailAds, setDetailAds] = useState<UserAdSummary[]>([])
  const [detailLogs, setDetailLogs] = useState<UserActivityLog[]>([])
  const [banHistory, setBanHistory] = useState<BanHistory[]>([])
  const [userReports, setUserReports] = useState<UserReport[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  const [note, setNote] = useState("")

  useEffect(() => {
    if (currentUser && !isAdmin) router.push("/")
  }, [currentUser, isAdmin, router])

  const [userStats, setUserStats] = useState<Record<string, UserStats>>({})

  // Enhanced fetchUserStats with direct Supabase queries
  const fetchUserStats = useCallback(
    async (userIds: string[], { force = false }: { force?: boolean } = {}) => {
      const uniqueIds = Array.from(new Set(userIds.filter((id) => typeof id === "string" && id.length > 0)));
      if (uniqueIds.length === 0) return {};

      console.log(`📊 Fetching stats for ${uniqueIds.length} users...`);

      const result: Record<string, UserStats> = {};
      
      // Return cached stats if not forcing refresh
      if (!force) {
        uniqueIds.forEach((id) => {
          if (userStats[id]) {
            result[id] = userStats[id];
          }
        });
      }

      const missing = force ? uniqueIds : uniqueIds.filter((id) => !result[id]);
      if (missing.length === 0) {
        return result;
      }

      try {
        // OPTIMIZED: Batch queries instead of individual queries per user
        // Get all ads for all users in one query
        const { data: allAds, error: adsError } = await supabase
          .from('products')
          .select('id, user_id, status, views')
          .in('user_id', missing);

        if (adsError) {
          console.warn('Batch ads query error:', adsError);
        }

        // Get all favorites for all users in one query
        const { data: allFavorites, error: favoritesError } = await supabase
          .from('favorites')
          .select('id, user_id')
          .in('user_id', missing);

        if (favoritesError) {
          console.warn('Batch favorites query error:', favoritesError);
        }

        // Get all reports for users' ads in one query
        const { data: allReports, error: reportsError } = await supabase
          .from('reports')
          .select('id, reported_user_id, product_id')
          .in('reported_user_id', missing);

        if (reportsError) {
          console.warn('Batch reports query error:', reportsError);
        }

        // Group data by user_id
        const adsByUser = new Map<string, any[]>();
        const favoritesByUser = new Map<string, number>();
        const reportsByUser = new Map<string, number>();

        (allAds || []).forEach((ad: any) => {
          if (!adsByUser.has(ad.user_id)) {
            adsByUser.set(ad.user_id, []);
          }
          adsByUser.get(ad.user_id)!.push(ad);
        });

        (allFavorites || []).forEach((fav: any) => {
          favoritesByUser.set(fav.user_id, (favoritesByUser.get(fav.user_id) || 0) + 1);
        });

        (allReports || []).forEach((report: any) => {
          reportsByUser.set(report.reported_user_id, (reportsByUser.get(report.reported_user_id) || 0) + 1);
        });

        // Calculate stats for each user
        const fetchedStats: Record<string, UserStats> = {};
        missing.forEach((userId) => {
          const userAds = adsByUser.get(userId) || [];
          fetchedStats[userId] = {
            totalAds: userAds.length,
            activeAds: userAds.filter(ad => ad.status === 'active').length,
            soldAds: userAds.filter(ad => ad.status === 'sold').length,
            totalViews: userAds.reduce((sum, ad) => sum + (ad.views || 0), 0),
            reportedAds: reportsByUser.get(userId) || 0,
            favorites: favoritesByUser.get(userId) || 0,
          };
        });

        // Update global stats state
        setUserStats((prev) => {
          const merged = { ...prev, ...fetchedStats };
          return merged;
        });

        console.log(`✅ Successfully fetched stats for ${Object.keys(fetchedStats).length} users`);
        return { ...result, ...fetchedStats };
      } catch (error) {
        console.warn("Failed to fetch user stats", error);
        
        // Return default stats for missing users
        const defaultStats = Object.assign({}, ...missing.map(id => ({
          [id]: {
            totalAds: 0,
            activeAds: 0,
            soldAds: 0,
            totalViews: 0,
            reportedAds: 0,
            favorites: 0,
          }
        })));
        
        return { ...result, ...defaultStats };
      }
    },
    [userStats, supabase]
  );

  // Fixed fetchUsers with direct Supabase queries
  const fetchUsers = useCallback(
    async ({ reset = false }: { reset?: boolean } = {}) => {
      if (!isAdmin) return;
      
      const nextPage = reset ? 0 : page;
      if (reset) {
        setLoading(true);
        setHasMore(true);
        setSelectedIds(new Set());
      } else {
        setFetchingMore(true);
      }

      try {
        console.log("🔄 Fetching users from Supabase directly...");
        
        // Direct Supabase query - no API dependency
        let from = nextPage * PAGE_SIZE;
        let to = from + PAGE_SIZE - 1;

        // Build the query
        let query = supabase
          .from('profiles')
          .select('*', { count: 'exact' })
          .range(from, to)
          .order('created_at', { ascending: false });

        // Apply search filter
        if (searchQuery.trim()) {
          query = query.or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`);
        }

        // Apply status filter
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }

        // Apply role filter
        if (roleFilter !== 'all') {
          query = query.eq('role', roleFilter);
        }

        const { data: profiles, error, count } = await query;

        if (error) {
          console.error('❌ Supabase query error:', error);
          throw new Error(error.message || 'Failed to fetch users from database');
        }

        console.log(`✅ Fetched ${profiles?.length || 0} users`);

        // OPTIMIZED: Use profile email directly (faster than fetching auth data)
        // Auth data (last_sign_in_at, email_confirmed_at) is optional and can be loaded on-demand
        const authUsersMap = new Map();

        // Transform to UserProfile format
        const fetchedUsers: UserProfile[] = (profiles || []).map((profile: any) => {
          const authUser = authUsersMap.get(profile.id);
          
          return {
            id: profile.id,
            email: profile.email || authUser?.email || 'No email',
            full_name: profile.full_name,
            phone: profile.phone,
            location: profile.location,
            bio: profile.bio,
            avatar_url: profile.avatar_url,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            last_sign_in_at: profile.last_sign_in_at || authUser?.last_sign_in_at || null,
            email_confirmed_at: profile.email_confirmed_at || authUser?.email_confirmed_at || null,
            status: (profile.status as AccountStatus) || 'active',
            role: (profile.role as Role) || 'user',
            deleted_at: profile.deleted_at,
            deletion_reason: profile.deletion_reason,
          };
        });

        const hasMoreFlag = fetchedUsers.length === PAGE_SIZE;

        // Update state
        setUsers((prev) => {
          if (reset) return fetchedUsers;
          const existingIds = new Set(prev.map((user) => user.id));
          const merged = [...prev];
          fetchedUsers.forEach((user) => {
            if (!existingIds.has(user.id)) {
              merged.push(user);
            }
          });
          return merged;
        });

        setUserCount(count || fetchedUsers.length);
        setHasMore(hasMoreFlag);
        setPage(reset ? 1 : nextPage + 1);

        // OPTIMIZED: Lazy load stats - don't fetch immediately, let it load in background
        // Stats will be fetched on-demand when user views details or scrolls
        if (fetchedUsers.length > 0) {
          // Fetch stats in background without blocking UI
          setTimeout(() => {
            const userIds = fetchedUsers.map(user => user.id);
            fetchUserStats(userIds).catch(err => {
              console.warn("Background stats fetch failed:", err);
            });
          }, 100);
        }

        toast.success(`Loaded ${fetchedUsers.length} users`);

      } catch (err: any) {
        console.error('❌ Failed to fetch users:', err);
        toast.error(err.message || 'Failed to fetch users');
        
        if (reset) {
          setUsers([]);
          setUserStats({});
          setUserCount(0);
          setHasMore(false);
          setPage(0);
        }
      } finally {
        setLoading(false);
        setFetchingMore(false);
      }
    },
    [isAdmin, page, searchQuery, statusFilter, roleFilter, supabase, fetchUserStats]
  );

  useEffect(() => {
    fetchUsers({ reset: true });
  }, [fetchUsers]);

  useEffect(() => {
    if (!isAdmin) return;
    
    const channel = supabase
      .channel("super-admin-profiles")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          console.log("Real-time update received:", payload);
          // Refresh the user list when profiles change
          fetchUsers({ reset: true });
        }
      )
      .subscribe((status) => {
        console.log("Real-time subscription status:", status);
        if (status === 'SUBSCRIBED') {
          console.log("✅ Real-time updates enabled for profiles");
        }
      });

    return () => {
      supabase.removeChannel(channel).catch((error) => {
        console.warn("Failed to remove profiles channel", error);
      });
    };
  }, [isAdmin, supabase, fetchUsers]);

  // Auto-open dialog if userId is in URL
  useEffect(() => {
    const userId = searchParams?.get('userId')
    if (userId && users.length > 0 && !detailOpen) {
      const user = users.find(u => u.id === userId)
      if (user) {
        openDetailPanel(user)
        // Clean up URL after a short delay
        setTimeout(() => {
          const newUrl = new URL(window.location.href)
          newUrl.searchParams.delete('userId')
          router.replace(newUrl.pathname + newUrl.search, { scroll: false })
        }, 500)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, users, detailOpen, router])

  const handleUserAction = async (
    user: UserProfile,
    action: "activate" | "suspend" | "ban" | "soft_delete" | "restore",
    reason?: string,
  ) => {
    if (!user || !currentUser) return;
    
    setActionLoading(user.id);
    const previousUsers = users;
    
    const statusMap: Record<typeof action, AccountStatus> = {
      activate: "active",
      suspend: "suspended",
      ban: "banned",
      soft_delete: "deleted",
      restore: "active",
    };
  
    const status = statusMap[action];
    
    // Optimistically update UI
    setUsers((prev) => prev.map((u) => 
      u.id === user.id 
        ? { 
            ...u, 
            status,
            deleted_at: status === "deleted" ? new Date().toISOString() : (action === "restore" ? null : u.deleted_at),
            deletion_reason: action === "restore" ? null : (reason ?? note ?? u.deletion_reason),
          } 
        : u
    ));
    if (detailUser?.id === user.id) {
      setDetailUser({ 
        ...detailUser, 
        status,
        deleted_at: status === "deleted" ? new Date().toISOString() : (action === "restore" ? null : detailUser.deleted_at),
        deletion_reason: action === "restore" ? null : (reason ?? note ?? detailUser.deletion_reason),
      });
    }
    
    try {
      console.log(`🔄 Updating user ${user.id} status to: ${status}`);
      
      // Use API endpoint for proper status updates (handles auth metadata + profiles)
      const response = await fetch("/api/account/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user.id, 
          status,
          reason: action === "restore" ? null : (reason ?? note ?? null),
          restore: action === "restore",
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const errorMsg = payload.error || payload.details || `Failed to ${action} user`
        console.error(`❌ User action failed:`, {
          action,
          userId: user.id,
          status,
          responseStatus: response.status,
          payload,
        })
        throw new Error(errorMsg)
      }

      console.log('✅ User status updated successfully');
      
      // Clear dialogs and notes
      setDeleteDialog(null);
      setDeleteReason("");
      setNote("");
      
      // Send notification to user
      try {
        await fetch("/api/admin/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            title: action === "restore" ? "Account Restored" : `Account ${action.replace("_", " ")}`,
            message: action === "restore" 
              ? "Your account has been restored and is now active again."
              : `Your account has been ${action.replace("_", " ")}${reason || note ? `. Reason: ${reason || note}` : ""}.`,
            type: "account_status_change",
            priority: status === "banned" || status === "deleted" ? "critical" : action === "restore" ? "info" : "warning",
            data: { status, reason: action === "restore" ? null : (reason ?? note) },
          }),
        }).catch(() => {}); // Silently fail if notification endpoint doesn't exist
      } catch (notifError) {
        console.warn("Failed to send notification", notifError);
      }
      
      toast.success(action === "restore" ? "User account restored successfully" : `User ${action.replace("_", " ")} successful`);
      await logAdminAction(`user_${action}`, user.id, { status, reason: action === "restore" ? null : (reason ?? note) });
      
    } catch (err: any) {
      console.error('❌ Action failed:', err);
      toast.error(err.message || "Action failed");
      // Revert optimistic update
      setUsers(previousUsers);
      if (detailUser?.id === user.id) {
        setDetailUser(user);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleHardDelete = async (user: UserProfile) => {
    if (!user || !currentUser) return;
    
    setActionLoading(user.id);
    const previous = users;
    
    // Optimistically remove from UI
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    if (detailUser?.id === user.id) {
      setDetailOpen(false);
      setDetailUser(null);
    }
    
    try {
      console.log(`🗑️ Permanently deleting user ${user.id}`);
      
      // Use API endpoint for hard delete (if exists) or direct deletion
      // First, try to delete via API if it exists
      const response = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      }).catch(() => null);

      if (response && !response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to delete user");
      }

      // If no API endpoint, try direct deletion (may fail due to RLS)
      if (!response) {
        // Delete from profiles table
        const { error: profileError } = await supabase
          .from("profiles")
          .delete()
          .eq("id", user.id);

        if (profileError) {
          console.warn("Profile delete warning:", profileError);
          // Try to delete auth user via admin API
          throw new Error(profileError.message || "Failed to delete user profile. Admin privileges may be required.");
        }

        // Note: Auth user deletion requires admin API which we can't do from client
        // The profile deletion should cascade delete related data
        console.warn("⚠️ Profile deleted but auth user may still exist. Use Supabase dashboard to fully delete.");
      }

      await logAdminAction("user_hard_delete", user.id);
      toast.success("User permanently deleted");
      setDeleteDialog(null);
      
    } catch (err: any) {
      console.error('❌ Hard delete failed:', err);
      toast.error(err.message || "Failed to delete user");
      // Revert optimistic update
      setUsers(previous);
      if (user.id === detailUser?.id) {
        setDetailUser(user);
        setDetailOpen(true);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = useMemo(
    () => users.filter((user) => matchesFilters(user, searchQuery, statusFilter, roleFilter)),
    [users, searchQuery, statusFilter, roleFilter],
  );

  const exportUsers = (format: (typeof USER_EXPORT_FORMATS)[number]["type"]) => {
    if (!filteredUsers.length) {
      toast.error("No users to export");
      return;
    }

    const selectedFormat = USER_EXPORT_FORMATS.find((item) => item.type === format) ?? USER_EXPORT_FORMATS[0];
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

    const baseRows = filteredUsers.map((u) => ({
      id: u.id,
      name: u.full_name || "N/A",
      email: u.email,
      status: u.status,
      role: u.role ?? "user",
      joined: new Date(u.created_at).toLocaleDateString(),
      totalAds: userStats[u.id]?.totalAds ?? 0,
      activeAds: userStats[u.id]?.activeAds ?? 0,
      soldAds: userStats[u.id]?.soldAds ?? 0,
      totalViews: userStats[u.id]?.totalViews ?? 0,
      favorites: userStats[u.id]?.favorites ?? 0,
      reportedAds: userStats[u.id]?.reportedAds ?? 0,
    }));

    if (format === "json") {
      const payload = JSON.stringify(baseRows, null, 2);
      const blob = new Blob([payload], { type: selectedFormat.mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-${timestamp}.${selectedFormat.extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Exported users as JSON");
      return;
    }

    const headers = [
      "ID",
      "Name",
      "Email",
      "Status",
      "Role",
      "Joined",
      "Total Ads",
      "Active Ads",
      "Sold Ads",
      "Views",
      "Favorites",
      "Reported Ads",
    ];

    const delimiter = "delimiter" in selectedFormat ? selectedFormat.delimiter : ",";
    const serialized = [headers, ...baseRows.map((row) => Object.values(row))]
      .map((row) =>
        row
          .map((cell) => {
            if (typeof cell === "number") return cell;
            const value = `${cell ?? ""}`;
            return delimiter === "," ? `"${value.replace(/"/g, '""')}"` : value;
          })
          .join(delimiter),
      )
      .join("\n");

    const blob = new Blob([serialized], { type: selectedFormat.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${timestamp}.${selectedFormat.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported users as ${selectedFormat.label}`);
  };

  const openDetailPanel = async (user: UserProfile) => {
    setDetailUser(user);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      // Fetch comprehensive user history in parallel
      const [
        statsMap,
        adsResult,
        logsResult,
        banHistoryResult,
        reportsResult
      ] = await Promise.all([
        fetchUserStats([user.id], { force: true }),
        supabase
          .from("products")
          .select("id, title, status, views, created_at, price")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("admin_audit_log")
          .select("id, action, actor_email, metadata, created_at")
          .eq("entity_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
        // Fetch ban/suspend history
        supabase
          .from("banned_users")
          .select("id, banned_by, reason, status_before, status_after, banned_at, expires_at, is_active")
          .eq("user_id", user.id)
          .order("banned_at", { ascending: false }),
        // Fetch reports against this user
        supabase
          .from("reports")
          .select("id, reporter_id, product_id, reason, type, status, created_at")
          .eq("reported_user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      setDetailStats(statsMap[user.id] ?? null);
      setDetailAds((adsResult.data as UserAdSummary[]) ?? []);
      setDetailLogs((logsResult.data as UserActivityLog[]) ?? []);

      // Process ban history with admin emails
      const banHistoryData = (banHistoryResult.data || []) as any[];
      if (banHistoryData.length > 0) {
        // Get admin emails for banned_by
        const adminIds = [...new Set(banHistoryData.map(b => b.banned_by))];
        const adminEmailsMap = new Map<string, string>();
        
        try {
          const adminPromises = adminIds.map(async (adminId) => {
            try {
              const { data: adminProfile } = await supabase
                .from("profiles")
                .select("email")
                .eq("id", adminId)
                .single();
              return adminProfile ? { id: adminId, email: adminProfile.email } : null;
            } catch {
              return null;
            }
          });
          
          const adminResults = await Promise.all(adminPromises);
          adminResults.forEach(result => {
            if (result) {
              adminEmailsMap.set(result.id, result.email || "Unknown");
            }
          });
        } catch (err) {
          console.warn("Failed to fetch admin emails for ban history", err);
        }

        const enrichedBanHistory: BanHistory[] = banHistoryData.map(ban => ({
          ...ban,
          banned_by_email: adminEmailsMap.get(ban.banned_by) || "Unknown",
        }));
        setBanHistory(enrichedBanHistory);
      } else {
        setBanHistory([]);
      }

      // Process reports with reporter emails
      const reportsData = (reportsResult.data || []) as any[];
      if (reportsData.length > 0) {
        const reporterIds = [...new Set(reportsData.map(r => r.reporter_id))];
        const reporterEmailsMap = new Map<string, string>();
        
        try {
          const reporterPromises = reporterIds.map(async (reporterId) => {
            try {
              const { data: reporterProfile } = await supabase
                .from("profiles")
                .select("email")
                .eq("id", reporterId)
                .single();
              return reporterProfile ? { id: reporterId, email: reporterProfile.email } : null;
            } catch {
              return null;
            }
          });
          
          const reporterResults = await Promise.all(reporterPromises);
          reporterResults.forEach(result => {
            if (result) {
              reporterEmailsMap.set(result.id, result.email || "Unknown");
            }
          });
        } catch (err) {
          console.warn("Failed to fetch reporter emails", err);
        }

        const enrichedReports: UserReport[] = reportsData.map(report => ({
          ...report,
          reporter_email: reporterEmailsMap.get(report.reporter_id) || "Unknown",
        }));
        setUserReports(enrichedReports);
      } else {
        setUserReports([]);
      }
    } catch (err) {
      console.warn("Failed to fetch detail info", err);
      if (!detailStats) setDetailStats(null);
      setBanHistory([]);
      setUserReports([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const selectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedIds(new Set(filteredUsers.map((u) => u.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelection = (userId: string, checked: boolean | "indeterminate") => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked === true) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  };

  const bulkAction = async (action: "activate" | "suspend" | "ban") => {
    if (!selectedIds.size || !currentUser) return;
    
    setActionLoading("bulk");
    const ids = Array.from(selectedIds);
    const previous = users;
    const statusMap: Record<typeof action, AccountStatus> = {
      activate: "active",
      suspend: "suspended",
      ban: "banned",
    };
    const status = statusMap[action];

    // Optimistically update UI
    setUsers((prev) => prev.map((user) => (selectedIds.has(user.id) ? { ...user, status } : user)));
    
    try {
      // Use API endpoint for each user (ensures auth metadata is updated)
      const results = await Promise.allSettled(
        ids.map((userId) =>
          fetch("/api/account/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, status }),
          })
        )
      );

      const failed = results.filter((result) => result.status === "rejected" || (result.status === "fulfilled" && !result.value.ok));
      
      if (failed.length > 0) {
        const failedCount = failed.length;
        const successCount = ids.length - failedCount;
        
        if (successCount > 0) {
          toast.warning(`Updated ${successCount} accounts, ${failedCount} failed`);
        } else {
          throw new Error(`All ${failedCount} updates failed`);
        }
      } else {
        toast.success(`Updated ${ids.length} accounts`);
      }

      // Send notifications to affected users
      try {
        await Promise.allSettled(
          ids.map((userId) =>
            fetch("/api/admin/notifications/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId,
                title: `Account ${action}`,
                message: `Your account has been ${action}${status === "banned" ? ". Please contact support for more information." : "."}`,
                type: "account_status_change",
                priority: status === "banned" ? "critical" : "warning",
                data: { status },
              }),
            }).catch(() => {})
          )
        );
      } catch (notifError) {
        console.warn("Failed to send some notifications", notifError);
      }

      await logAdminAction(`bulk_${action}`, "bulk", { ids });
      setSelectedIds(new Set());
    } catch (err: any) {
      console.error("Bulk action error:", err);
      toast.error(err.message || "Bulk action failed");
      // Revert optimistic update
      setUsers(previous);
    } finally {
      setActionLoading(null);
    }
  };

  if (currentUser && !isAdmin)
    return <p className="text-gray-400 text-center">Access denied</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 text-sm">
            Total users: {userCount} • Loaded: {users.length} • Selected: {selectedIds.size}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedIds.size > 0 && (
            <>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                disabled={actionLoading === "bulk"}
                onClick={() => bulkAction("activate")}
              >
                Activate ({selectedIds.size})
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-yellow-500 text-yellow-300 hover:bg-yellow-900"
                disabled={actionLoading === "bulk"}
                onClick={() => bulkAction("suspend")}
              >
                Suspend ({selectedIds.size})
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={actionLoading === "bulk"}
                onClick={() => bulkAction("ban")}
              >
                Ban ({selectedIds.size})
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                disabled={!filteredUsers.length}
                className="border-gray-600 bg-gradient-to-r from-gray-800 to-gray-700 text-gray-100 hover:from-gray-700 hover:to-gray-600"
              >
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900 border-gray-700 text-gray-100">
              <DropdownMenuLabel className="text-xs uppercase text-gray-400">Choose format</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              {USER_EXPORT_FORMATS.map((option) => (
                <DropdownMenuItem key={option.type} onClick={() => exportUsers(option.type)} className="focus:bg-gray-700">
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => fetchUsers({ reset: true })} disabled={loading} className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, phone, or location"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter} disabled={!statusFilterEnabled}>
            <SelectTrigger className="w-[160px] bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Account status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600 text-white">
              <SelectItem value="all">All statuses</SelectItem>
              {ACCOUNT_STATUS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter} disabled={!roleFilterEnabled}>
            <SelectTrigger className="w-[160px] bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600 text-white">
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5" /> Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-gray-400">
              <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-green-500" /> Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-gray-400">No users match the current filters.</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-gray-700 pb-2">
                <Checkbox
                  checked={selectedIds.size === filteredUsers.length && filteredUsers.length > 0}
                  onCheckedChange={selectAll}
                />
                <span className="text-sm text-gray-400">Select all {filteredUsers.length}</span>
              </div>
              {filteredUsers.map((user) => {
                const stats = userStats[user.id]
                return (
                  <Card key={user.id} className="bg-gray-700 border-gray-600 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex gap-3">
                        <Checkbox
                          checked={selectedIds.has(user.id)}
                          onCheckedChange={(checked) => toggleSelection(user.id, checked)}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-lg font-semibold text-white">
                              {user.full_name || "Unnamed"}
                            </span>
                            {(() => {
                              const map = {
                                active: { className: "bg-green-600", icon: UserCheck },
                                suspended: { className: "bg-yellow-600", icon: UserX },
                                banned: { className: "bg-red-600", icon: Ban },
                                deleted: { className: "bg-gray-600", icon: Trash2 },
                                deactivated: { className: "bg-gray-500", icon: UserX },
                              }
                              const status = user.status
                              const config = map[status] ?? { className: "bg-gray-500", icon: User }
                              const Icon = config.icon
                              return (
                                <Badge className={`${config.className} flex items-center gap-1`}>
                                  <Icon className="w-3 h-3" /> {status}
                                </Badge>
                              )
                            })()}
                            <Badge variant="outline" className="border-blue-500 text-blue-300">
                              {user.role ?? "user"}
                            </Badge>
                          </div>
                          <div className="mt-1 grid grid-cols-1 gap-2 text-sm text-gray-300 md:grid-cols-2 lg:grid-cols-3">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {user.email}
                            </span>
                            {user.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {user.phone}
                              </span>
                            )}
                            {user.location && (
                              <span className="flex items-center gap-1">
                                <Globe2 className="w-3 h-3" /> {user.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Joined {new Date(user.created_at).toLocaleDateString()}
                            </span>
                            {user.last_sign_in_at && (
                              <span className="flex items-center gap-1">
                                <Activity className="w-3 h-3" /> Last active {new Date(user.last_sign_in_at).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-400">
                            <Badge variant="outline" className="border-gray-600 text-gray-300">
                              Ads: {stats?.totalAds ?? "–"}
                            </Badge>
                            <Badge variant="outline" className="border-gray-600 text-gray-300">
                              Active: {stats?.activeAds ?? "–"}
                            </Badge>
                            <Badge variant="outline" className="border-gray-600 text-gray-300">
                              Sold: {stats?.soldAds ?? "–"}
                            </Badge>
                            <Badge variant="outline" className="border-gray-600 text-gray-300">
                              Views: {stats?.totalViews ?? "–"}
                            </Badge>
                            <Badge variant="outline" className="border-gray-600 text-gray-300">
                              Reports: {stats?.reportedAds ?? "–"}
                            </Badge>
                            <Badge variant="outline" className="border-gray-600 text-gray-300">
                              Favorites: {stats?.favorites ?? "–"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            // Open user details in new window
                            const url = `${window.location.origin}/superadmin/users/${user.id}`
                            window.open(url, '_blank', 'noopener,noreferrer')
                          }}
                          className="border-gray-500 bg-gray-800 text-gray-100 hover:bg-gray-700 hover:text-white"
                          title="View user details in new window"
                        >
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" disabled={actionLoading === user.id} className="border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white">
                              {actionLoading === user.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <MoreVertical className="w-4 h-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 text-white">
                            <DropdownMenuLabel>Moderation</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {user.status !== "active" && (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleUserAction(user, "activate").catch(err => {
                                    console.error("Activate failed:", err)
                                    toast.error(err.message || "Failed to activate user")
                                  })
                                }}
                                className="focus:bg-gray-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" /> Activate
                              </DropdownMenuItem>
                            )}
                            {user.status !== "suspended" && (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleUserAction(user, "suspend").catch(err => {
                                    console.error("Suspend failed:", err)
                                    toast.error(err.message || "Failed to suspend user")
                                  })
                                }}
                                className="focus:bg-yellow-900/30 text-yellow-300"
                              >
                                <UserX className="w-4 h-4 mr-2" /> Suspend
                              </DropdownMenuItem>
                            )}
                            {user.status !== "banned" && (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleUserAction(user, "ban").catch(err => {
                                    console.error("Ban failed:", err)
                                    toast.error(err.message || "Failed to ban user")
                                  })
                                }}
                                className="focus:bg-red-900/30 text-red-300"
                              >
                                <Ban className="w-4 h-4 mr-2" /> Ban account
                              </DropdownMenuItem>
                            )}
                            {user.status !== "deleted" && (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setDeleteDialog({ user, type: "soft" })
                                }}
                                className="focus:bg-yellow-900/30 text-yellow-300"
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Soft delete
                              </DropdownMenuItem>
                            )}
                            {user.status === "deleted" && (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleUserAction(user, "restore").catch(err => {
                                    console.error("Restore failed:", err)
                                    toast.error(err.message || "Failed to restore user")
                                  })
                                }}
                                className="focus:bg-green-900/30 text-green-300"
                              >
                                <UserCheck className="w-4 h-4 mr-2" /> Restore account
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-400 focus:text-red-300 focus:bg-red-900/30"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setDeleteDialog({ user, type: "hard" })
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Permanent delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
                )
              })}

              {hasMore && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300"
                    disabled={fetchingMore}
                    onClick={() => fetchUsers()}
                  >
                    {fetchingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading more...
                      </>
                    ) : (
                      <>Load more ({users.length}/{userCount || "∞"})</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteDialog} onOpenChange={(open) => (!open ? setDeleteDialog(null) : null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>
              {deleteDialog?.type === "soft" ? "Soft delete account" : "Permanently delete account"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {deleteDialog?.type === "soft"
                ? "The user will be deactivated but data retained. They can be restored by an admin."
                : "⚠️ WARNING: This action is PERMANENT and CANNOT be undone. All user data, ads, messages, and files will be permanently deleted. This action cannot be recovered."}
            </DialogDescription>
          </DialogHeader>
          {deleteDialog?.type === "soft" && (
            <div className="space-y-3">
              <Label className="text-xs uppercase text-gray-400">Reason (optional)</Label>
              <Textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={3}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          )}
          {deleteDialog?.type === "hard" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-red-500/50 bg-red-900/20 p-4">
                <p className="text-sm text-red-300 font-semibold mb-2">⚠️ Permanent Deletion Warning</p>
                <ul className="text-xs text-red-200 space-y-1 list-disc list-inside">
                  <li>User account will be permanently removed</li>
                  <li>All ads, messages, and favorites will be deleted</li>
                  <li>All uploaded images will be removed from storage</li>
                  <li>This action CANNOT be undone</li>
                  <li>No recovery or restore possible</li>
                </ul>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-gray-400">
                  Type <span className="text-red-400 font-bold">DELETE</span> to confirm permanent deletion
                </Label>
                <Input
                  value={hardDeleteConfirm}
                  onChange={(e) => setHardDeleteConfirm(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="bg-gray-700 border-gray-600 text-white font-mono"
                />
                <p className="text-xs text-gray-500">
                  This is a safety measure to prevent accidental permanent deletion.
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialog(null)
                setDeleteReason("")
                setHardDeleteConfirm("")
              }}
              className="border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              variant={deleteDialog?.type === "soft" ? "outline" : "destructive"}
              className={deleteDialog?.type === "soft" ? "border-yellow-500 bg-yellow-900/20 text-yellow-300 hover:bg-yellow-900/40" : "bg-red-600 hover:bg-red-700 text-white"}
              onClick={(e) => {
                e.preventDefault()
                if (!deleteDialog) return
                
                // Require confirmation text for hard delete
                if (deleteDialog.type === "hard" && hardDeleteConfirm !== "DELETE") {
                  toast.error("Please type 'DELETE' to confirm permanent deletion")
                  return
                }
                
                if (deleteDialog.type === "soft") {
                  handleUserAction(deleteDialog.user, "soft_delete", deleteReason).catch(err => {
                    console.error("Soft delete failed:", err)
                  })
                } else {
                  handleHardDelete(deleteDialog.user).catch(err => {
                    console.error("Hard delete failed:", err)
                  })
                }
              }}
              disabled={actionLoading === deleteDialog?.user.id || (deleteDialog?.type === "hard" && hardDeleteConfirm !== "DELETE")}
            >
              {actionLoading === deleteDialog?.user.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-1" />
                  {deleteDialog?.type === "soft" ? "Soft delete" : "Delete permanently"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) {
            setDetailUser(null)
            setDetailStats(null)
            setDetailAds([])
            setDetailLogs([])
            setBanHistory([])
            setUserReports([])
          }
        }}
      >
        <DialogContent className="max-w-4xl bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>User Insight</DialogTitle>
            <DialogDescription className="text-gray-400">
              Account overview, activity logs, and latest listings.
            </DialogDescription>
          </DialogHeader>
          {detailUser ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm text-gray-300">Profile</CardTitle>
                    <Badge variant="outline" className="border-blue-500 text-blue-300">
                      {detailUser.role ?? "user"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-gray-200">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" /> {detailUser.full_name || "Unnamed"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" /> {detailUser.email}
                    </div>
                    {detailUser.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" /> {detailUser.phone}
                      </div>
                    )}
                    {detailUser.location && (
                      <div className="flex items-center gap-2">
                        <Globe2 className="w-4 h-4" /> {detailUser.location}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Joined {new Date(detailUser.created_at).toLocaleDateString()}
                    </div>
                    {detailUser.last_sign_in_at && (
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Last active {new Date(detailUser.last_sign_in_at).toLocaleString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm text-gray-300">Stats</CardTitle>
                    <Badge variant="outline" className="border-green-500 text-green-300">
                      {detailUser.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-3 text-center">
                    {detailLoading ? (
                      <div className="col-span-2 flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    ) : (
                      <>
                        <InsightMetric label="Total ads" value={detailStats?.totalAds ?? 0} />
                        <InsightMetric label="Active" value={detailStats?.activeAds ?? 0} />
                        <InsightMetric label="Sold" value={detailStats?.soldAds ?? 0} />
                        <InsightMetric label="Views" value={detailStats?.totalViews ?? 0} />
                        <InsightMetric label="Reports" value={detailStats?.reportedAds ?? 0} />
                        <InsightMetric label="Favorites" value={detailStats?.favorites ?? 0} />
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm text-gray-300">Recent listings</CardTitle>
                    <Badge variant="outline" className="border-gray-600 text-gray-300">
                      {detailAds.length}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {detailLoading ? (
                      <div className="flex justify-center py-6 text-gray-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    ) : detailAds.length === 0 ? (
                      <p className="text-gray-400">No recent listings.</p>
                    ) : (
                      detailAds.map((ad) => (
                        <div key={ad.id} className="rounded border border-gray-700 p-3">
                          <div className="flex items-center justify-between text-gray-200">
                            <span className="font-medium line-clamp-1">{ad.title}</span>
                            <Badge variant="outline" className="border-gray-600 text-gray-300">
                              {ad.status}
                            </Badge>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                            <span>{new Date(ad.created_at).toLocaleDateString()}</span>
                            <span>Views: {ad.views ?? 0}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm text-gray-300">Activity log</CardTitle>
                    <Badge variant="outline" className="border-gray-600 text-gray-300">
                      {detailLogs.length}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {detailLoading ? (
                      <div className="flex justify-center py-6 text-gray-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    ) : detailLogs.length === 0 ? (
                      <p className="text-gray-400">No recent activity logged.</p>
                    ) : (
                      detailLogs.map((log) => (
                        <div key={log.id} className="rounded border border-gray-700 p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-200">
                              {log.action.replace(/_/g, " ")}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          {log.actor_email && (
                            <div className="text-xs text-gray-400">By {log.actor_email}</div>
                          )}
                          {log.metadata && (
                            <div className="mt-2 rounded bg-gray-900/60 p-2 text-xs text-gray-300">
                              <pre className="overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Ban/Suspend History */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                    <Ban className="w-4 h-4" /> Ban/Suspend History
                  </CardTitle>
                  <Badge variant="outline" className="border-red-500 text-red-300">
                    {banHistory.length} {banHistory.length === 1 ? 'record' : 'records'}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-sm max-h-64 overflow-y-auto">
                  {detailLoading ? (
                    <div className="flex justify-center py-6 text-gray-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : banHistory.length === 0 ? (
                    <p className="text-gray-400">No ban or suspension history.</p>
                  ) : (
                    banHistory.map((ban) => (
                      <div key={ban.id} className="rounded border border-gray-700 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={ban.status_after === 'banned' 
                                ? 'border-red-500 text-red-300' 
                                : ban.status_after === 'suspended'
                                ? 'border-yellow-500 text-yellow-300'
                                : 'border-gray-600 text-gray-300'
                              }
                            >
                              {ban.status_after}
                            </Badge>
                            {ban.is_active && (
                              <Badge className="bg-red-600 text-white">Active</Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(ban.banned_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-300">
                          <div><strong>Reason:</strong> {ban.reason || 'No reason provided'}</div>
                          <div><strong>From:</strong> {ban.status_before} → <strong>To:</strong> {ban.status_after}</div>
                          <div><strong>By:</strong> {ban.banned_by_email || 'Unknown admin'}</div>
                          {ban.expires_at && (
                            <div><strong>Expires:</strong> {new Date(ban.expires_at).toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Reports Against User */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Reports Against User
                  </CardTitle>
                  <Badge variant="outline" className="border-orange-500 text-orange-300">
                    {userReports.length} {userReports.length === 1 ? 'report' : 'reports'}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-sm max-h-64 overflow-y-auto">
                  {detailLoading ? (
                    <div className="flex justify-center py-6 text-gray-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : userReports.length === 0 ? (
                    <p className="text-gray-400">No reports against this user.</p>
                  ) : (
                    userReports.map((report) => (
                      <div key={report.id} className="rounded border border-gray-700 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={report.status === 'pending' 
                                ? 'border-yellow-500 text-yellow-300' 
                                : report.status === 'resolved'
                                ? 'border-green-500 text-green-300'
                                : 'border-gray-600 text-gray-300'
                              }
                            >
                              {report.status}
                            </Badge>
                            <Badge variant="outline" className="border-gray-600 text-gray-300">
                              {report.type}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(report.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-300">
                          <div><strong>Reason:</strong> {report.reason}</div>
                          <div><strong>Reported by:</strong> {report.reporter_email || 'Unknown'}</div>
                          {report.product_id && (
                            <div className="text-gray-400">Related to product: {report.product_id.slice(0, 8)}...</div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <div className="rounded border border-gray-700 bg-gray-800 p-4">
                <Label className="text-xs uppercase text-gray-400">Admin note (optional)</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Add context before taking action"
                  className="mt-2 bg-gray-700 border-gray-600 text-white"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={(e) => {
                      e.preventDefault()
                      if (detailUser) {
                        handleUserAction(detailUser, "activate", note).catch(err => {
                          console.error("Activate failed:", err)
                        })
                      }
                    }}
                    disabled={!detailUser || actionLoading === detailUser.id}
                  >
                    {actionLoading === detailUser?.id ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-1" />
                    )}
                    Reactivate
                  </Button>
                  <Button
                    size="sm"
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    onClick={(e) => {
                      e.preventDefault()
                      if (detailUser) {
                        handleUserAction(detailUser, "suspend", note).catch(err => {
                          console.error("Suspend failed:", err)
                        })
                      }
                    }}
                    disabled={!detailUser || actionLoading === detailUser.id}
                  >
                    {actionLoading === detailUser?.id ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <UserX className="w-4 h-4 mr-1" />
                    )}
                    Suspend
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={(e) => {
                      e.preventDefault()
                      if (detailUser) {
                        handleUserAction(detailUser, "ban", note).catch(err => {
                          console.error("Ban failed:", err)
                        })
                      }
                    }}
                    disabled={!detailUser || actionLoading === detailUser.id}
                  >
                    {actionLoading === detailUser?.id ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Ban className="w-4 h-4 mr-1" />
                    )}
                    Ban account
                  </Button>
                  {detailUser?.status !== "deleted" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-yellow-500 bg-yellow-900/20 text-yellow-300 hover:bg-yellow-900/40"
                      onClick={(e) => {
                        e.preventDefault()
                        if (detailUser) {
                          setDeleteDialog({ user: detailUser, type: "soft" })
                        }
                      }}
                      disabled={!detailUser}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Soft delete
                    </Button>
                  )}
                  {detailUser?.status === "deleted" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-green-500 bg-green-900/20 text-green-300 hover:bg-green-900/40"
                      onClick={(e) => {
                        e.preventDefault()
                        if (detailUser) {
                          handleUserAction(detailUser, "restore").catch(err => {
                            console.error("Restore failed:", err)
                            toast.error(err.message || "Failed to restore user")
                          })
                        }
                      }}
                      disabled={!detailUser || actionLoading === detailUser.id}
                    >
                      {actionLoading === detailUser?.id ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <UserCheck className="w-4 h-4 mr-1" />
                      )}
                      Restore account
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-600 bg-red-900/20 text-red-300 hover:bg-red-900/40"
                    onClick={(e) => {
                      e.preventDefault()
                      if (detailUser) {
                        setDeleteDialog({ user: detailUser, type: "hard" })
                      }
                    }}
                    disabled={!detailUser}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Hard delete
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400">Select a user to view details.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InsightMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-gray-700 bg-gray-900/60 p-3">
      <div className="text-xs uppercase text-gray-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
    </div>
  )
}