"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Settings,
  Globe,
  Mail,
  DollarSign,
  Shield,
  Database,
  FileText,
  Package,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
} from "lucide-react"

interface SiteSettings {
  siteName: string
  siteDescription: string
  contactEmail: string
  supportEmail: string
  phoneNumber: string
  address: string
  currency: string
  timezone: string
  language: string
  maintenanceMode: boolean
  registrationEnabled: boolean
  adApprovalRequired: boolean
  maxImagesPerAd: number
  maxAdDuration: number
  featuredAdPrice: number
  premiumAdPrice: number
}

interface Category {
  id: string
  name: string
  slug: string
  subcategories: string[]
  isActive: boolean
}

const mockSettings: SiteSettings = {
  siteName: "OLX Marketplace",
  siteDescription: "Buy and sell everything in your local area",
  contactEmail: "contact@olxmarketplace.com",
  supportEmail: "support@olxmarketplace.com",
  phoneNumber: "+1 (555) 123-4567",
  address: "123 Business St, Toronto, ON M5V 3A8",
  currency: "CAD",
  timezone: "America/Toronto",
  language: "en",
  maintenanceMode: false,
  registrationEnabled: true,
  adApprovalRequired: true,
  maxImagesPerAd: 5,
  maxAdDuration: 30,
  featuredAdPrice: 9.99,
  premiumAdPrice: 19.99,
}

const mockCategories: Category[] = [
  {
    id: "1",
    name: "Electronics",
    slug: "electronics",
    subcategories: ["TV", "Fridge", "Oven", "AC", "Computer", "Laptop", "Camera"],
    isActive: true,
  },
  {
    id: "2",
    name: "Vehicles",
    slug: "vehicles",
    subcategories: ["Cars", "Motorcycles", "Trucks", "Bicycles", "Scooters", "Parts & Accessories"],
    isActive: true,
  },
  {
    id: "3",
    name: "Real Estate",
    slug: "real-estate",
    subcategories: ["Houses", "Apartments", "Commercial", "Land", "Rental"],
    isActive: true,
  },
  {
    id: "4",
    name: "Fashion",
    slug: "fashion",
    subcategories: ["Men's Clothing", "Women's Clothing", "Kids Clothing", "Shoes", "Bags"],
    isActive: false,
  },
]

const emailTemplates = [
  { id: "welcome", name: "Welcome Email", description: "Sent to new users after registration" },
  { id: "ad_approved", name: "Ad Approved", description: "Sent when an ad is approved" },
  { id: "ad_rejected", name: "Ad Rejected", description: "Sent when an ad is rejected" },
  { id: "ban_notification", name: "Account Suspended", description: "Sent when a user is banned" },
  { id: "password_reset", name: "Password Reset", description: "Sent for password reset requests" },
]

export function WebsiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(mockSettings)
  const [categories, setCategories] = useState<Category[]>(mockCategories)
  const [activeTab, setActiveTab] = useState("general")
  const [newCategory, setNewCategory] = useState("")
  const [newSubcategory, setNewSubcategory] = useState("")
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSettingChange = (key: keyof SiteSettings, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    alert("Settings saved successfully!")
  }

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      const newCat: Category = {
        id: Date.now().toString(),
        name: newCategory.trim(),
        slug: newCategory.toLowerCase().replace(/\s+/g, "-"),
        subcategories: [],
        isActive: true,
      }
      setCategories((prev) => [...prev, newCat])
      setNewCategory("")
    }
  }

  const handleAddSubcategory = (categoryId: string) => {
    if (newSubcategory.trim()) {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId ? { ...cat, subcategories: [...cat.subcategories, newSubcategory.trim()] } : cat,
        ),
      )
      setNewSubcategory("")
    }
  }

  const handleDeleteCategory = (categoryId: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      setCategories((prev) => prev.filter((cat) => cat.id !== categoryId))
    }
  }

  const handleDeleteSubcategory = (categoryId: string, subcategory: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId ? { ...cat, subcategories: cat.subcategories.filter((sub) => sub !== subcategory) } : cat,
      ),
    )
  }

  const handleToggleCategoryStatus = (categoryId: string) => {
    setCategories((prev) => prev.map((cat) => (cat.id === categoryId ? { ...cat, isActive: !cat.isActive } : cat)))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Website Settings</h1>
          <p className="text-gray-600">Configure and manage your marketplace settings</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save All Changes
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="ads" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Ads & Pricing
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                Site Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => handleSettingChange("siteName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={settings.currency} onValueChange={(value) => handleSettingChange("currency", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => handleSettingChange("siteDescription", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={settings.timezone} onValueChange={(value) => handleSettingChange("timezone", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Toronto">America/Toronto (EST)</SelectItem>
                      <SelectItem value="America/Vancouver">America/Vancouver (PST)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Default Language</Label>
                  <Select value={settings.language} onValueChange={(value) => handleSettingChange("language", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => handleSettingChange("contactEmail", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => handleSettingChange("supportEmail", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={settings.phoneNumber}
                    onChange={(e) => handleSettingChange("phoneNumber", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Business Address</Label>
                  <Input
                    id="address"
                    value={settings.address}
                    onChange={(e) => handleSettingChange("address", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Management */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Categories Management
                </span>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="New category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-48"
                  />
                  <Button onClick={handleAddCategory} size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Category
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.map((category) => (
                  <Card key={category.id} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{category.name}</h3>
                        <Badge variant={category.isActive ? "default" : "secondary"}>
                          {category.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-sm text-gray-500">({category.subcategories.length} subcategories)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={category.isActive}
                          onCheckedChange={() => handleToggleCategoryStatus(category.id)}
                        />
                        <Button variant="ghost" size="sm" onClick={() => setEditingCategory(category.id)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Add subcategory"
                          value={newSubcategory}
                          onChange={(e) => setNewSubcategory(e.target.value)}
                          className="flex-1"
                        />
                        <Button onClick={() => handleAddSubcategory(category.id)} size="sm" variant="outline">
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {category.subcategories.map((subcategory) => (
                          <Badge key={subcategory} variant="outline" className="flex items-center gap-1">
                            {subcategory}
                            <button
                              onClick={() => handleDeleteSubcategory(category.id, subcategory)}
                              className="ml-1 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ads & Pricing Settings */}
        <TabsContent value="ads" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Advertisement Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxImagesPerAd">Max Images per Ad</Label>
                  <Input
                    id="maxImagesPerAd"
                    type="number"
                    value={settings.maxImagesPerAd}
                    onChange={(e) => handleSettingChange("maxImagesPerAd", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAdDuration">Max Ad Duration (days)</Label>
                  <Input
                    id="maxAdDuration"
                    type="number"
                    value={settings.maxAdDuration}
                    onChange={(e) => handleSettingChange("maxAdDuration", Number.parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="featuredAdPrice">Featured Ad Price ({settings.currency})</Label>
                  <Input
                    id="featuredAdPrice"
                    type="number"
                    step="0.01"
                    value={settings.featuredAdPrice}
                    onChange={(e) => handleSettingChange("featuredAdPrice", Number.parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="premiumAdPrice">Premium Ad Price ({settings.currency})</Label>
                  <Input
                    id="premiumAdPrice"
                    type="number"
                    step="0.01"
                    value={settings.premiumAdPrice}
                    onChange={(e) => handleSettingChange("premiumAdPrice", Number.parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Ad Approval Required</h3>
                  <p className="text-sm text-gray-600">All ads must be approved before going live</p>
                </div>
                <Switch
                  checked={settings.adApprovalRequired}
                  onCheckedChange={(checked) => handleSettingChange("adApprovalRequired", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Email Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emailTemplates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{template.name}</h3>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit Template
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Security & Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">User Registration</h3>
                  <p className="text-sm text-gray-600">Allow new users to register accounts</p>
                </div>
                <Switch
                  checked={settings.registrationEnabled}
                  onCheckedChange={(checked) => handleSettingChange("registrationEnabled", checked)}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Content Policies</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start bg-transparent">
                    <FileText className="w-4 h-4 mr-2" />
                    Terms of Service
                  </Button>
                  <Button variant="outline" className="justify-start bg-transparent">
                    <FileText className="w-4 h-4 mr-2" />
                    Privacy Policy
                  </Button>
                  <Button variant="outline" className="justify-start bg-transparent">
                    <FileText className="w-4 h-4 mr-2" />
                    Community Guidelines
                  </Button>
                  <Button variant="outline" className="justify-start bg-transparent">
                    <FileText className="w-4 h-4 mr-2" />
                    Prohibited Items
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Maintenance Mode</h3>
                  <p className="text-sm text-gray-600">Put the site in maintenance mode for updates</p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => handleSettingChange("maintenanceMode", checked)}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">System Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">Database Status</p>
                    <p className="text-green-600">Connected</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">Storage Usage</p>
                    <p>2.3 GB / 10 GB</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">Cache Status</p>
                    <p className="text-green-600">Active</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">Last Backup</p>
                    <p>2 hours ago</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear Cache
                </Button>
                <Button variant="outline">
                  <Database className="w-4 h-4 mr-2" />
                  Backup Database
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
