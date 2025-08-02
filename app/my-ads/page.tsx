// app/my-ads/page.tsx
"use client";

import { useMemo, useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/lib/auth-context";
import { AdManagementCard } from "@/components/ad-management-card"; // This component needs to be created
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/use-toast";

// Ad type that matches your Supabase table and includes the joined profile
interface Ad {
  id: string;
  title: string;
  description: string;
  price: number | null;
  category_id: string | null;
  user_id: string;
  images: string[] | null;
  location: string | null;
  condition: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  negotiable?: boolean;
  profiles: {
    full_name: string | null;
  } | null;
}

export default function MyAdsPage() {
  const { user, loading: authLoading } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    price: "",
    condition: "",
    negotiable: false,
  });

  const fetchUserAds = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('ads')
      .select(`*, profiles(full_name)`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching my ads:", error.message);
      toast({
        title: "Error",
        description: "Failed to fetch your ads.",
        variant: "destructive"
      });
    } else {
      setAds(data as Ad[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading) {
      fetchUserAds();
    }
  }, [user, authLoading]);

  const handleEditAd = (ad: Ad) => {
    setEditingAd(ad);
    setEditFormData({
      title: ad.title,
      description: ad.description,
      price: ad.price?.toString() || "",
      condition: ad.condition || "",
      negotiable: ad.negotiable || false,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingAd) return;
    setIsSaving(true);

    const { error } = await supabase
      .from('ads')
      .update({
        title: editFormData.title,
        description: editFormData.description,
        price: editFormData.price ? parseFloat(editFormData.price) : null,
        condition: editFormData.condition,
        negotiable: editFormData.negotiable,
        updated_at: new Date().toISOString(),
      })
      .eq('id', editingAd.id);

    setIsSaving(false);
    setEditingAd(null);

    if (error) {
      console.error("Error saving ad:", error.message);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Ad updated successfully!",
      });
      fetchUserAds(); // Re-fetch ads to show the updated data
    }
  };

  const handleMarkAsSold = async (adId: string) => {
    const { error } = await supabase
      .from('ads')
      .update({ status: "sold" as const, updated_at: new Date().toISOString() })
      .eq('id', adId)
      .eq('user_id', user?.id); // Double-check user ownership

    if (error) {
      console.error("Error marking ad as sold:", error.message);
      toast({
        title: "Error",
        description: "Failed to mark ad as sold.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Ad marked as sold!",
      });
      fetchUserAds(); // Re-fetch ads
    }
  };

  const handleDeleteAd = async (adId: string) => {
    const { error } = await supabase
      .from('ads')
      .delete()
      .eq('id', adId)
      .eq('user_id', user?.id); // Double-check user ownership

    if (error) {
      console.error("Error deleting ad:", error.message);
      toast({
        title: "Error",
        description: "Failed to delete ad.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Ad deleted successfully!",
      });
      fetchUserAds(); // Re-fetch ads
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-gray-50 text-center py-10">Loading user session...</div>;
  }
  if (!user) {
    return <div className="min-h-screen bg-gray-50 text-center py-10">Please sign in to view your ads</div>;
  }
  if (loading) {
    return <div className="min-h-screen bg-gray-50 text-center py-10">Loading your ads...</div>;
  }
  
  const activeAds = ads.filter((ad) => ad.status === "active");
  const soldAds = ads.filter((ad) => ad.status === "sold");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Ads</h1>
            <p className="text-gray-600 mt-1">
              {activeAds.length} active, {soldAds.length} sold
            </p>
          </div>
          <Button asChild>
            <Link href="/create-ad">
              <Plus className="h-4 w-4 mr-2" />
              Post New Ad
            </Link>
          </Button>
        </div>

        {ads.length > 0 ? (
          <div className="space-y-8">
            {activeAds.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  Active Ads
                  <Badge variant="secondary">{activeAds.length}</Badge>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {activeAds.map((ad) => (
                    <AdManagementCard
                      key={ad.id}
                      ad={ad}
                      onEdit={handleEditAd}
                      onMarkAsSold={handleMarkAsSold}
                      onDelete={handleDeleteAd}
                    />
                  ))}
                </div>
              </div>
            )}

            {soldAds.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  Sold Ads
                  <Badge variant="outline">{soldAds.length}</Badge>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {soldAds.map((ad) => (
                    <AdManagementCard
                      key={ad.id}
                      ad={ad}
                      onEdit={handleEditAd}
                      onMarkAsSold={handleMarkAsSold}
                      onDelete={handleDeleteAd}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No ads yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                You haven't posted any ads yet. Start selling by posting your first ad!
              </p>
              <Button asChild>
                <Link href="/create-ad">
                  <Plus className="h-4 w-4 mr-2" />
                  Post Your First Ad
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Edit Ad Dialog */}
        <Dialog open={!!editingAd} onOpenChange={() => setEditingAd(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Ad</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  disabled={isSaving}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={3}
                  disabled={isSaving}
                />
              </div>
              <div>
                <Label htmlFor="edit-price">Price (₹)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={editFormData.price}
                  onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                  disabled={isSaving}
                />
              </div>
              <div>
                <Label htmlFor="edit-condition">Condition</Label>
                <Select
                  value={editFormData.condition}
                  onValueChange={(value) => setEditFormData({ ...editFormData, condition: value })}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="like_new">Like New</SelectItem>
                    <SelectItem value="second_hand">Second Hand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-negotiable"
                  checked={editFormData.negotiable}
                  onChange={(e) => setEditFormData({ ...editFormData, negotiable: e.target.checked })}
                  disabled={isSaving}
                />
                <Label htmlFor="edit-negotiable">Price is negotiable</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingAd(null)} className="flex-1" disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} className="flex-1" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}