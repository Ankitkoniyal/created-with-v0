"use client"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Plus, Edit, Trash2, Tag, X, Check } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
interface Category {
  id: string
  name: string
  slug: string
  description: string
  item_count: number
  created_at: string}
export function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: ""
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const supabase = await getSupabaseClient()
      
      // First check if categories table exists
      const { data, error } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          slug,
          description,
          created_at
        `)
        .order('name')

      if (error) {
        console.error("Supabase error:", error)
        // If categories table doesn't exist, create sample data
        if (error.code === '42P01') { // table does not exist
          console.log("Categories table doesn't exist, using sample data")
          setCategories([
            { id: '1', name: 'Electronics', slug: 'electronics', description: 'Electronic devices', item_count: 15, created_at: new Date().toISOString() },
            { id: '2', name: 'Furniture', slug: 'furniture', description: 'Home furniture', item_count: 8, created_at: new Date().toISOString() },
            { id: '3', name: 'Vehicles', slug: 'vehicles', description: 'Cars and vehicles', item_count: 12, created_at: new Date().toISOString() },
            { id: '4', name: 'Real Estate', slug: 'real-estate', description: 'Properties and housing', item_count: 5, created_at: new Date().toISOString() },
          ])
          setLoading(false)
          return
        }
        throw error
      }

      if (!data) {
        console.error("No categories data returned")
        setCategories([])
        setLoading(false)
        return
      }

      // Get item counts for each category
      const categoriesWithCounts = await Promise.all(
        data.map(async (category) => {
          const { count, error: countError } = await supabase
            .from('products')
            .select('*', { count: 'exact' })
            .eq('category', category.name)

          if (countError) console.error("Error counting items:", countError)

          return {
            ...category,
            item_count: count || 0
          }
        })
      )

      setCategories(categoriesWithCounts)
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const addCategory = async () => {
    try {
      const supabase = await getSupabaseClient()
      const { data, error } = await supabase
        .from('categories')
        .insert([
          {
            name: newCategory.name,
            slug: newCategory.name.toLowerCase().replace(/\s+/g, '-'),
            description: newCategory.description
          }
        ])
        .select()

      if (error) throw error

      setCategories([...categories, { ...data[0], item_count: 0 }])
      setNewCategory({ name: "", description: "" })
      setIsAdding(false)
    } catch (error) {
      console.error("Error adding category:", error)
    }
  }

  const deleteCategory = async (categoryId: string) => {
    try {
      const supabase = await getSupabaseClient()
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error

      setCategories(categories.filter(cat => cat.id !== categoryId))
      setDeleteConfirm(null)
    } catch (error) {
      console.error("Error deleting category:", error)
    }
  }

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Categories Management</h1>
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
        <h1 className="text-3xl font-bold text-white">Categories Management</h1>
        <Badge variant="outline" className="bg-green-900 text-green-400 border-green-700">
          {categories.length} categories
        </Badge>
      </div>

      <Card className="p-6 bg-gray-800 border-gray-700">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search categories..."
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
            Add Category
          </Button>
        </div>

        {isAdding && (
          <Card className="p-4 mb-6 bg-green-900 border-green-700">
            <h3 className="font-medium mb-3 text-white">Add New Category</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <Input
                placeholder="Category Name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <Input
                placeholder="Description"
                value={newCategory.description}
                onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={addCategory}
                disabled={!newCategory.name}
              >
                Add Category
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
                <th className="text-left py-3 text-gray-400">Category</th>
                <th className="text-left py-3 text-gray-400">Description</th>
                <th className="text-left py-3 text-gray-400">Items</th>
                <th className="text-left py-3 text-gray-400">Created</th>
                <th className="text-left py-3 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category) => (
                <tr key={category.id} className="border-b border-gray-700">
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-green-400" />
                      <span className="font-medium text-white">{category.name}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <p className="text-gray-400">{category.description || 'No description'}</p>
                  </td>
                  <td className="py-4">
                    <Badge variant="outline" className="bg-gray-700 text-gray-300 border-gray-600">
                      {category.item_count}
                    </Badge>
                  </td>
                  <td className="py-4">
                    <p className="text-sm text-gray-400">
                      {new Date(category.created_at).toLocaleDateString()}
                    </p>
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
                        onClick={() => setDeleteConfirm(category.id)}
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

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No categories found</p>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this category? This action cannot be undone.
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
              onClick={() => deleteConfirm && deleteCategory(deleteConfirm)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
