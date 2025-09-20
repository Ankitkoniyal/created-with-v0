// components/superadmin/settings.tsx
"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Save, Shield, Bell, Globe, CreditCard, Database } from "lucide-react"

export function Settings() {
  const [settings, setSettings] = useState({
    siteName: "Marketplace",
    siteDescription: "Your local marketplace",
    siteUrl: "https://marketplace.com",
    adminEmail: "admin@marketplace.com",
    enableNotifications: true,
    enableEmailVerification: true,
    enableUserRegistration: true,
    maintenanceMode: false,
    currency: "INR",
    currencySymbol: "₹",
    itemsPerPage: 20,
    maxImagesPerAd: 5,
    maxAdDuration: 30,
    autoApproveAds: false,
    stripeEnabled: false,
    paypalEnabled: true
  })

  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    // Simulate save operation
    setTimeout(() => {
      setSaving(false)
      alert("Settings saved successfully!")
    }, 1000)
  }

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <Button 
          className="bg-green-600 hover:bg-green-700"
          onClick={handleSave}
          disabled={saving}
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">General Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => handleInputChange('siteName', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="siteDescription">Site Description</Label>
              <Input
                id="siteDescription"
                value={settings.siteDescription}
                onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="siteUrl">Site URL</Label>
              <Input
                id="siteUrl"
                value={settings.siteUrl}
                onChange={(e) => handleInputChange('siteUrl', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input
                id="adminEmail"
                type="email"
                value={settings.adminEmail}
                onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        {/* Security Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">Security & Privacy</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableEmailVerification">Email Verification</Label>
                <p className="text-sm text-gray-500">Require users to verify their email address</p>
              </div>
              <Switch
                id="enableEmailVerification"
                checked={settings.enableEmailVerification}
                onCheckedChange={(checked) => handleInputChange('enableEmailVerification', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableUserRegistration">User Registration</Label>
                <p className="text-sm text-gray-500">Allow new users to register</p>
              </div>
              <Switch
                id="enableUserRegistration"
                checked={settings.enableUserRegistration}
                onCheckedChange={(checked) => handleInputChange('enableUserRegistration', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoApproveAds">Auto Approve Ads</Label>
                <p className="text-sm text-gray-500">Automatically approve new ads without review</p>
              </div>
              <Switch
                id="autoApproveAds"
                checked={settings.autoApproveAds}
                onCheckedChange={(checked) => handleInputChange('autoApproveAds', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                <p className="text-sm text-gray-500">Put the site in maintenance mode</p>
              </div>
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => handleInputChange('maintenanceMode', checked)}
              />
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableNotifications">Enable Notifications</Label>
                <p className="text-sm text-gray-500">Send email notifications for important events</p>
              </div>
              <Switch
                id="enableNotifications"
                checked={settings.enableNotifications}
                onCheckedChange={(checked) => handleInputChange('enableNotifications', checked)}
              />
            </div>
          </div>
        </Card>

        {/* Payment Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">Payment Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="stripeEnabled">Stripe Payments</Label>
                <p className="text-sm text-gray-500">Enable Stripe payment processing</p>
              </div>
              <Switch
                id="stripeEnabled"
                checked={settings.stripeEnabled}
                onCheckedChange={(checked) => handleInputChange('stripeEnabled', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="paypalEnabled">PayPal Payments</Label>
                <p className="text-sm text-gray-500">Enable PayPal payment processing</p>
              </div>
              <Switch
                id="paypalEnabled"
                checked={settings.paypalEnabled}
                onCheckedChange={(checked) => handleInputChange('paypalEnabled', checked)}
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={settings.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="currencySymbol">Currency Symbol</Label>
              <Input
                id="currencySymbol"
                value={settings.currencySymbol}
                onChange={(e) => handleInputChange('currencySymbol', e.target.value)}
                className="mt-1"
                maxLength={3}
              />
            </div>
          </div>
        </Card>

        {/* Content Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">Content Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="itemsPerPage">Items Per Page</Label>
              <Input
                id="itemsPerPage"
                type="number"
                value={settings.itemsPerPage}
                onChange={(e) => handleInputChange('itemsPerPage', parseInt(e.target.value))}
                className="mt-1"
                min="1"
                max="100"
              />
            </div>
            <div>
              <Label htmlFor="maxImagesPerAd">Max Images Per Ad</Label>
              <Input
                id="maxImagesPerAd"
                type="number"
                value={settings.maxImagesPerAd}
                onChange={(e) => handleInputChange('maxImagesPerAd', parseInt(e.target.value))}
                className="mt-1"
                min="1"
                max="20"
              />
            </div>
            <div>
              <Label htmlFor="maxAdDuration">Max Ad Duration (Days)</Label>
              <Input
                id="maxAdDuration"
                type="number"
                value={settings.maxAdDuration}
                onChange={(e) => handleInputChange('maxAdDuration', parseInt(e.target.value))}
                className="mt-1"
                min="1"
                max="365"
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}