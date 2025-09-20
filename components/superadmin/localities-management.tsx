// components/superadmin/localities-management.tsx
"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Plus, Edit, Trash2, MapPin, X, Check } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"

interface Locality {
  id: string
  name: string
  city: string
  state: string
  pincode: string
  item_count: number
  created_at: string
}

export function LocalitiesManagement() {
  const [localities, setLocalities] = useState<Locality[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [newLocality, setNewLocality] = useState({
    name: "",
    city: "",
    state: "",
    pincode: ""
  })

  useEffect(() => {
    fetchLocalities()
  }, [])

  const fetchLocalities = async () => {
    try {
      const supabase = await getSupabaseClient()
      
      // Check if localities table exists
      const { data, error } = await supabase
        .from('localities')
        .select(`
          id,
          name,
          city,
          state,
          pincode,
          created_at
        `)
        .order('name')

      if (error) {
        console.error("Supabase error:", error)
        // If localities table doesn't exist, create sample data
        if (error.code === '42P01') { // table does not exist
          console.log("Localities table doesn't exist, using sample data")
          setLocalities([
            { id: '1', name: 'Downtown', city: 'New York', state: 'NY', pincode: '10001', item_count: 25, created_at: new Date().toISOString() },
            { id: '2', name: 'Brooklyn', city: 'New York', state: 'NY', pincode: '11201', item_count: 18, created_at: new Date().toISOString() },
            { id: '3', name: 'Manhattan', city: 'New York', state: 'NY', pincode: '10016', item_count: 32, created_at: new Date().toISOString() },
            { id: '4', name: 'Queens', city: 'New York', state: 'NY', pincode: '11354', item_count: 15, created_at: new Date().toISOString() },
          ])
          setLoading(false)
          return
        }
        throw error
      }

      if (!data) {
        console.error("No localities data returned")
        setLocalities([])
        setLoading(false)
        return
      }

      // Get item counts for each locality
      const localitiesWithCounts = await Promise.all(
        data.map(async (locality) => {
          const { count, error: countError } = await supabase
            .from('products')
            .select('*', { count: 'exact' })
            .eq('location', locality.name)

          if (countError) console.error("Error counting items:", countError)

          return {
            ...locality,
            item_count: count || 0
          }
        })
      )

      setLocalities(localitiesWithCounts)
    } catch (error) {
      console.error("Error fetching localities:", error)
    } finally {
      setLoading(false)
    }
  }

  const addLocality = async () => {
    try {
      const supabase = await getSupabaseClient()
      const { data, error } = await supabase
        .from('localities')
        .insert([
          {
            name: newLocality.name,
            city: newLocality.city,
            state: newLocality.state,
            pincode: newLocality.pincode
          }
        ])
        .select()

      if (error) throw error

      setLocalities([...localities, { ...data[0], item_count: 0 }])
      setNewLocality({ name: "", city: "", state: "", pincode: "" })
      setIsAdding(false)
    } catch (error) {
      console.error("Error adding locality:", error)
    }
  }

  const deleteLocality = async (localityId: string) => {
    try {
      const supabase = await getSupabaseClient()
      const { error } = await supabase
        .from('localities')
        .delete()
        .eq('id', localityId)

      if (error) throw error

      setLocalities(localities.filter(loc => loc.id !== localityId))
      setDeleteConfirm(null)
    } catch (error) {
      console.error("Error deleting locality:", error)
    }
  }

  const filteredLocalities = localities.filter(loc =>
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.pincode.includes(searchTerm)
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Localities Management</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
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
        <h1 className="text-3xl font-bold text-white">Localities Management</h1>
        <Badge variant="outline" className="bg-green-900 text-green-400 border-green-700">
          {localities.length} localities
        </Badge>
      </div>

      <Card className="p-6 bg-gray-800 border-gray-700">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search localities..."
              className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Locality
          </Button>
        </div>

        {isAdding && (
          <Card className="p-4 mb-6 bg-green-900 border-green-700">
            <h3 className="font-medium mb-3 text-white">Add New Locality</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <Input
                placeholder="Locality Name"
                value={newLocality.name}
                onChange={(e) => setNewLocality({...newLocality, name: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <Input
                placeholder="City"
                value={newLocality.city}
                onChange={(e) => setNewLocality({...newLocality, city: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <Input
                placeholder="State"
                value={newLocality.state}
                onChange={(e) => setNewLocality({...newLocality, state: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <Input
                placeholder="Pincode"
                value={newLocality.pincode}
                onChange={(e) => setNewLocality({...newLocality, pincode: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={addLocality}
                disabled={!newLocality.name || !newLocality.city}
              >
                Add Locality
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsAdding(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
            </div>
          </Card>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 text-gray-400">Locality</th>
                <th className="text-left py-3 text-gray-400">City</th>
                <th className="text-left py-3 text-gray-400">State</th>
                <th className="text-left py-3 text-gray-400">Pincode</th>
                <th className="text-left py-3 text-gray-400">Items</th>
                <th className="text-left py-3 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocalities.map((locality) => (
                <tr key={locality.id} className="border-b border-gray-700">
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-400" />
                      <span className="font-medium text-white">{locality.name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-white">{locality.city}</td>
                  <td className="py-4 text-white">{locality.state}</td>
                  <td className="py-4">
                    <Badge variant="outline" className="bg-gray-700 text-gray-300 border-gray-600">
                      {locality.pincode}
                    </Badge>
                  </td>
                  <td className="py-4">
                    <Badge variant="outline" className="bg-gray-700 text-gray-300 border-gray-600">
                      {locality.item_count}
                    </Badge>
                  </td>
                  <td className="py-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-red-900 border-red-700 text-red-400 hover:bg-red-800"
                        onClick={() => setDeleteConfirm(locality.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLocalities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No localities found</p>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this locality? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteConfirm && deleteLocality(deleteConfirm)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Locality
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}