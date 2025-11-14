# Platform Settings Status

This document explains which settings are currently working and which are saved but not yet implemented.

## ✅ Working Settings (Active)

These settings are **fully implemented** and will affect the website immediately:

1. **Maintenance Mode** ✅
   - **Status**: Active
   - **What it does**: When enabled, shows a maintenance page to all visitors (except admins)
   - **Implementation**: Middleware checks on every request
   - **Impact**: Immediate - affects all non-admin routes

2. **Allow Anonymous Browsing** ✅
   - **Status**: Active (partially)
   - **What it does**: Controls whether non-logged-in users can browse listings
   - **Implementation**: Currently the site allows browsing by default

## ⚠️ Saved But Not Yet Implemented

These settings are saved to the database but **not yet used** throughout the application:

### Security & Access
- **Require Email Verification** - Not enforced during registration
- **Require Phone Verification** - Not implemented
- **Allow New Registrations** - Not enforced in auth flow
- **Auto Approve Listings** - Products are approved manually, not auto-approved
- **Spam Detection** - Not implemented

### Content Policy
- **Items Per Page** - Hardcoded in product listing pages
- **Max Images Per Ad** - Not enforced in upload form
- **Max Ads Per User** - Not checked when users create listings
- **Min/Max Price** - Not validated during listing creation
- **Auto Delete Expired Ads** - No automated cleanup job exists

### Payments
- **Stripe Enabled** - Toggle exists but Stripe integration not implemented
- **PayPal Enabled** - Toggle exists but PayPal integration not implemented

### Advanced Features
- **Enable Ratings** - Rating system not implemented
- **Enable Comments** - Comment system not implemented
- **Enable Search Suggestions** - Autocomplete not implemented
- **Enable Email Alerts** - Email alert system not implemented
- **Featured Ads** - Featured listing feature not implemented

## 📋 Recommended Next Steps

To make these settings fully functional, implement:

1. **Priority 1 (High Impact)**
   - [ ] Implement auto-approve ads in product creation API
   - [ ] Enforce max images per ad in upload form
   - [ ] Check max ads per user when creating listings
   - [ ] Use items_per_page in product listing pages

2. **Priority 2 (Medium Impact)**
   - [ ] Enforce email verification during registration
   - [ ] Implement user registration toggle in auth flow
   - [ ] Add min/max price validation
   - [ ] Implement auto-delete expired ads cron job

3. **Priority 3 (Feature Additions)**
   - [ ] Build ratings system
   - [ ] Build comments system
   - [ ] Add search suggestions/autocomplete
   - [ ] Implement featured ads feature
   - [ ] Add Stripe/PayPal payment integration

## 🔧 How Settings Work

1. **Storage**: All settings are stored in the `platform_settings` table with `id = 'global'`
2. **Caching**: Settings are cached client-side for 5 minutes to reduce database calls
3. **Usage**: Use `getPlatformSettings()` (client) or `getPlatformSettingsServer()` (server) to fetch settings
4. **Cache Clear**: After updating settings, the cache is automatically cleared

## 📝 Adding New Settings

1. Add the setting to the `PlatformSettings` interface in both:
   - `lib/platform-settings.ts`
   - `components/superadmin/settings.tsx`

2. Add a default value in `DEFAULT_SETTINGS`

3. Add UI controls in the settings component

4. Implement the setting usage throughout the application

5. Mark it as active (`isActive={true}`) once implemented

