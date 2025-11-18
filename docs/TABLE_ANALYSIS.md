# Supabase Table Analysis

This document identifies which tables are actively used in the codebase and which are safe to delete.

## ✅ Actively Used Tables (DO NOT DELETE)

### Core Application Tables
- **`profiles`** - User profiles (extends auth.users)
- **`products`** - Product/Ad listings
- **`categories`** - Product categories
- **`subcategories`** - Product subcategories
- **`favorites`** - User favorites/wishlist
- **`messages`** - Buyer-seller messaging
- **`notifications`** - User notifications
- **`locations`** - City/province data for autocomplete

### Rating & Review System
- **`user_ratings`** - User-to-user ratings (1-5 stars)
- **`user_rating_stats`** - Aggregated rating statistics
- **`user_comments`** - User-to-user text comments

### Moderation & Admin
- **`reports`** - Reported ads/users
- **`banned_users`** - Banned user records
- **`deactivated_ads`** - Deactivated product records
- **`moderation_logs`** - Moderation action logs
- **`audit_logs`** - System audit logs
- **`admin_audit_log`** - Admin action logs

### Settings & Configuration
- **`platform_settings`** - Platform-wide settings
- **`localities`** - Location/localities management (superadmin)

### Messaging System
- **`conversations`** - Conversation threads (if using advanced messaging)

## ⚠️ Staging/Temporary Tables (SAFE TO DELETE)

These tables were only used during data import and are no longer needed:

1. **`staging_geonames_ca`**
   - **Purpose:** Temporary staging table for GeoNames data import
   - **Status:** Data has been imported into `locations` table
   - **Safe to delete:** ✅ YES
   - **Reason:** Only used during import process, data is now in `locations`

2. **`province_code_map`**
   - **Purpose:** Mapping table for GeoNames admin1 codes to province abbreviations
   - **Status:** Only needed during import, not used by application
   - **Safe to delete:** ✅ YES
   - **Reason:** Static mapping data, not referenced by application code

## 🔍 How to Identify Unused Tables

Run the analysis script to see all tables:
```sql
-- Run scripts/41_analyze_all_tables.sql
```

This will show:
- All tables in your database
- Row counts for each table
- Tables that might be unused
- Foreign key dependencies

## 🗑️ Safe Deletion Script

To delete the staging tables:

```sql
-- Drop staging tables (safe - data is already in locations table)
DROP TABLE IF EXISTS public.staging_geonames_ca;
DROP TABLE IF EXISTS public.province_code_map;
```

Or use: `scripts/40_cleanup_staging_tables.sql`

## ⚠️ Important Notes

1. **Never delete tables without checking:**
   - Foreign key dependencies
   - Active usage in codebase
   - Data that might be needed later

2. **Supabase Internal Tables:**
   - Tables in `auth` schema are managed by Supabase
   - Tables in `storage` schema are for file storage
   - Do not delete these

3. **If unsure:**
   - Check row counts (empty tables might be unused)
   - Search codebase for table references
   - Check foreign key dependencies
   - Test in a development environment first

## 📊 Table Usage Summary

Based on codebase analysis:
- **22 actively used tables** - Keep these
- **2 staging tables** - Safe to delete
- **0 confirmed unused tables** - All others appear to be in use

## 🔄 Regular Maintenance

Consider running the analysis script periodically to:
- Identify new unused tables
- Check for orphaned data
- Monitor table sizes
- Plan database optimization

