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
  reports: Array<{
    reason: string
    reported_by: string
    reported_at: string
  }>
}

export function ReportedAds() {
  const [ads, setAds] = useState<ReportedAd[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionConfirm, setActionConfirm] = useState<{type: string, adId: string} | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReportedAds()
  }, [])

  const fetchReportedAds = async () => {
    try {
      setLoading(true)
      setError(null)
      const supabase = await getSupabaseClient()
      
      // First check if reports table exists by doing a simple query
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('id')
        .limit(1)

      if (reportsError) {
        if (reportsError.code === '42P01') {
          console.log("Reports table doesn't exist")
          setAds([])
          setError("Reports table doesn't exist in the database.")
          return
        }
        throw reportsError
      }

      // Get all reports with product information
      const { data: reportedData, error: reportedError } = await supabase
        .from('reports')
        .select(`
          id,
          reason,
          reported_by,
          created_at,
          product_id,
          products (
            id,
            title,
            description,
            price,
            category,
            created_at,
            user_id,
            status
          )
        `)
        .order('created_at', { ascending: false })

      if (reportedError) {
        console.error("Error fetching reports:", reportedError)
        setError(`Error fetching reports: ${reportedError.message}`)
        return
      }

      if (!reportedData || reportedData.length === 0) {
        console.log("No reported ads found")
        setAds([])
        return
      }

      // Get user emails for all products
      const productIds = [...new Set(reportedData.map(report => report.products?.id).filter(Boolean))]
      const userEmails = new Map()
      
      if (productIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', reportedData
            .map(report => report.products?.user_id)
            .filter((id, index, arr) => id && arr.indexOf(id) === index)
          )

        if (!usersError && usersData) {
          usersData.forEach(user => {
            userEmails.set(user.id, user.email)
          })
        }
      }

      // Group reports by product
      const adsMap = new Map()
      
      reportedData.forEach(report => {
        if (!report.products) return
        
        const productId = report.products.id
        
        if (!adsMap.has(productId)) {
          adsMap.set(productId, {
            id: report.products.id,
            title: report.products.title,
            description: report.products.description,
            price: report.products.price,
            category: report.products.category,
            created_at: report.products.created_at,
            user_id: report.products.user_id,
            user_email: userEmails.get(report.products.user_id) || 'Unknown',
            report_count: 0,
            reports: []
          })
        }
        
        const ad = adsMap.get(productId)
        ad.report_count++
        ad.reports.push({
          reason: report.reason || 'No reason provided',
          reported_by: report.reported_by || 'Anonymous',
          reported_at: report.created_at
        })
      })

      setAds(Array.from(adsMap.values()))
    } catch (error) {
      console.error("Error fetching reported ads:", error)
      setError(`An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const takeAction = async (adId: string, action: 'remove' | 'keep') => {
    try {
      const supabase = await getSupabaseClient()
      
      if (action === 'remove') {
        const { error } = await supabase
          .from('products')
          .update({ status: 'removed' })
          .eq('id', adId)
        if (error) throw error
      }
      
      // Remove reports for this ad
      const { error: reportError } = await supabase
        .from('reports')
        .delete()
        .eq('product_id', adId)
      
      if (reportError) {
        // If deletion fails, just log it but don't throw (might be already deleted)
        console.warn("Error deleting reports:", reportError)
      }
      
      // Remove from local state
      setAds(prev => prev.filter(ad => ad.id !== adId))
      setActionConfirm(null)
    } catch (error) {
      console.error("Error taking action on ad:", error)
      setError(`Failed to ${action} ad: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const filteredAds = ads.filter(ad =>
    ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ad.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ad.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Reported Ads</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2].map(i => (
            <Card key={i} className="p-6 bg-gray-800">
              <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Reported Ads</h1>
        <Badge variant="outline" className="bg-red-900 text-red-400 border-red-700">
          {ads.length} ads reported
        </Badge>
      </div>

      {error && (
        <Card className="p-4 bg-red-900/20 border-red-700">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto text-red-400 hover:bg-red-800/30"
              onClick={() => setError(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-6 bg-gray-800 border-gray-700">
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search reported ads..."
              className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-700 whitespace-nowrap">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button 
            variant="outline" 
            className="border-gray-600 text-white hover:bg-gray-700 whitespace-nowrap"
            onClick={fetchReportedAds}
          >
            Refresh
          </Button>
        </div>

        <div className="space-y-4">
          {filteredAds.length === 0 ? (
            <div className="text-center py-12">
              <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">
                {ads.length === 0 ? "No reported ads found" : "No ads match your search"}
              </p>
              {ads.length === 0 && (
                <Button 
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                  onClick={fetchReportedAds}
                >
                  Check Again
                </Button>
              )}
            </div>
          ) : (
            filteredAds.map((ad) => (
              <Card key={ad.id} className="p-6 bg-gray-750 border-gray-600">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-white mb-2">{ad.title}</h3>
                    <p className="text-gray-300">₹{ad.price.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Category: {ad.category}</p>
                    <p className="text-sm text-gray-400">Posted by: {ad.user_email}</p>
                    <Badge variant="outline" className="bg-red-900 text-red-400 border-red-700 mt-2">
                      {ad.report_count} report{ad.report_count !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-red-900 border-red-700 text-red-400 hover:bg-red-800"
                      onClick={() => setActionConfirm({type: 'remove', adId: ad.id})}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Remove Ad
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => setActionConfirm({type: 'keep', adId: ad.id})}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Keep Ad
                    </Button>
                  </div>
                </div>
                
                {ad.description && (
                  <p className="text-gray-300 mb-4 line-clamp-2">{ad.description}</p>
                )}
                
                <div className="mt-4">
                  <h4 className="font-medium mb-2 text-white">Report Reasons:</h4>
                  <div className="space-y-2">
                    {ad.reports.slice(0, 3).map((report, index) => (
                      <div key={index} className="text-sm text-gray-300 p-3 bg-gray-800 rounded-lg">
                        <p><strong>Reason:</strong> {report.reason}</p>
                        <p><strong>Reported by:</strong> {report.reported_by}</p>
                        <p><strong>Date:</strong> {new Date(report.reported_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                    {ad.reports.length > 3 && (
                      <p className="text-sm text-gray-400 mt-2">+ {ad.reports.length - 3} more reports...</p>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>

      {/* Action Confirmation Dialog */}
      <Dialog open={!!actionConfirm} onOpenChange={() => setActionConfirm(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription className="text-gray-400">
              {actionConfirm?.type === 'remove' 
                ? "Are you sure you want to remove this ad? It will be marked as removed and all reports will be cleared."
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
                  takeAction(actionConfirm.adId, actionConfirm.type as 'remove' | 'keep')
                }
              }}
            >
              <Check className="w-4 h-4 mr-2" />
              {actionConfirm?.type === 'remove' ? 'Remove Ad' : 'Keep Ad'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}