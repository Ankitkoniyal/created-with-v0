// components/superadmin/reported-ads.tsx
"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Filter, Eye, CheckCircle, XCircle, Flag, User, X, Check, AlertCircle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"

interface ReportDetail {
  id: string;
  reason: string
  reported_by: string | null
  reported_at: string
}

interface ReportedAd {
  id: string
  title: string
  description: string
  price: number
  category: string
  created_at: string
  user_id: string
  user_email: string
  report_count: number
  status: 'active' | 'inactive' | 'sold' | 'rejected' | 'pending'
  reports: ReportDetail[]
}

export function ReportedAds() {
  const [ads, setAds] = useState<ReportedAd[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionConfirm, setActionConfirm] = useState<{type: 'remove' | 'keep', adId: string} | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReportedAds()
  }, [])
  
  const fetchReportedAds = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = await getSupabaseClient()
      
      // Step 1: Fetch all reports, including the related product and the user who reported it
      // NOTE: This assumes your 'reports' table has a 'product_id' foreign key.
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select(`
          id, 
          reason, 
          created_at, 
          reported_by:reporter_user_id (email),
          product_id,
          products ( id, title, description, price, category, created_at, user_id, status, profiles:user_id (email) )
        `)
        .order('created_at', { ascending: false })

      if (reportsError) {
        if (reportsError.code === '42P01') {
          setError("Reports table doesn't exist in the database.")
          setAds([])
          return
        }
        throw reportsError
      }

      if (!reportsData || reportsData.length === 0) {
        setAds([])
        return
      }
      
      // Step 2: Aggregate reports by product_id
      const adsMap = reportsData.reduce((acc, report) => {
        const product = report.products as any;
        const reportDetail: ReportDetail = {
            id: report.id,
            reason: report.reason,
            reported_by: report.reported_by?.email || 'Anonymous',
            reported_at: report.created_at,
        };

        if (!product) return acc; // Skip if product data is missing

        const existingAd = acc[product.id];
        if (existingAd) {
          existingAd.report_count += 1;
          existingAd.reports.push(reportDetail);
        } else {
          acc[product.id] = {
            id: product.id,
            title: product.title,
            description: product.description,
            price: product.price || 0,
            category: product.category || 'N/A',
            created_at: product.created_at,
            user_id: product.user_id,
            user_email: product.profiles?.email || 'Unknown User',
            status: product.status,
            report_count: 1,
            reports: [reportDetail],
          };
        }
        return acc;
      }, {} as Record<string, ReportedAd>);
      
      setAds(Object.values(adsMap))

    } catch (e: any) {
      console.error("Error fetching reported ads:", e)
      setError(e.message || "An unexpected error occurred while fetching reports.")
    } finally {
      setLoading(false)
    }
  }

  // ==========================================================
  // CORE FUNCTIONALITY: TAKE ACTION ON REPORTED AD
  // ==========================================================
  const takeAction = async (adId: string, action: 'remove' | 'keep') => {
    try {
      const supabase = await getSupabaseClient()
      
      if (action === 'remove') {
        // 1. Set the ad status to 'rejected'
        const { error: adError } = await supabase
          .from('products')
          .update({ status: 'rejected' })
          .eq('id', adId)
        
        if (adError) throw adError
      }
      
      // 2. Clear the reports for this ad (by deleting all rows linked to product_id)
      const { error: reportError } = await supabase
        .from('reports') 
        .delete()
        .eq('product_id', adId)
        
      if (reportError) throw reportError
      
      // Remove the ad from the reported list in the UI
      setAds(prevAds => prevAds.filter(ad => ad.id !== adId))
      setActionConfirm(null) // Close dialog
      alert(`Ad action: ${action} successfully. Reports cleared.`)


    } catch (e) {
      console.error('Error taking action on reported ad:', e)
      alert(`Failed to complete action: ${action}.`)
    }
  }

  const filteredAds = ads.filter(ad => 
    ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ad.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: ReportedAd['status']) => {
    switch (status) {
        case 'active': return 'bg-green-600';
        case 'pending': return 'bg-yellow-600';
        case 'rejected': return 'bg-red-600';
        default: return 'bg-gray-600';
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Reported Ads ({ads.length})</h1>
      {error && (
        <Card className="p-4 bg-red-900 border-red-700 text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-300" />
            <p className="text-sm">{error} Please ensure you have a `reports` table with a `product_id` FK.</p>
        </Card>
      )}

      <Card className="p-4 bg-gray-800 border-gray-700 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by ad title or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-gray-800 border-gray-700 shadow-lg">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Flag className="w-5 h-5 text-red-500" /> 
          Ads with Reports
        </h2>
        
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-10 text-gray-400">Loading reported ads...</div>
          ) : filteredAds.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400">No ads are currently reported.</p>
            </div>
          ) : (
            filteredAds.map((ad) => (
              <Card key={ad.id} className="p-4 bg-gray-700 border-gray-600 shadow-md">
                <div className="flex justify-between items-start mb-3 border-b border-gray-600 pb-2">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {ad.title} 
                      <Badge className={`${getStatusColor(ad.status)} hover:bg-current text-xs`}>
                          {ad.status.toUpperCase()}
                      </Badge>
                    </h3>
                    <p className="text-sm text-gray-400 flex items-center gap-1">
                      <User className="w-3 h-3"/> {ad.user_email} 
                      <span className="mx-2 text-gray-600">|</span>
                      <Flag className="w-3 h-3 text-red-500"/> {ad.report_count} Reports
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => setActionConfirm({ type: 'keep', adId: ad.id })}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Keep Ad & Clear Reports
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => setActionConfirm({ type: 'remove', adId: ad.id })}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Remove Ad
                    </Button>
                  </div>
                </div>
                
                <h4 className="text-base font-semibold text-red-400 mb-2">Report Details:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {ad.reports.map((report, index) => (
                        <div key={report.id || index} className="p-3 bg-gray-600 rounded-md">
                            <p className="text-sm text-white font-medium">{report.reason}</p>
                            <p className="text-xs text-gray-400 mt-1">
                                Reported by: {report.reported_by} on {new Date(report.reported_at).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>

      {/* Action Confirmation Dialog */}
      <Dialog open={!!actionConfirm} onOpenChange={() => setActionConfirm(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription className="text-gray-400">
              {actionConfirm?.type === 'remove' 
                ? "Are you sure you want to remove this ad? It will be marked as rejected and all reports will be cleared."
                : "Are you sure you want to keep this ad? All reports will be cleared and the ad will remain active."
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setActionConfirm(null)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              className={`flex-1 ${actionConfirm?.type === 'remove' ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
              onClick={() => {
                if (actionConfirm) {
                  takeAction(actionConfirm.adId, actionConfirm.type)
                }
              }}
            >
              <Check className="w-4 h-4 mr-2" />
              {actionConfirm?.type === 'remove' ? 'Remove Ad & Clear Reports' : 'Keep Ad & Clear Reports'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
