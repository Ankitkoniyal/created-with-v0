# Complete Database Tables Analysis

## Overview
This document provides a comprehensive analysis of all database tables, their purpose, usage status, and impact of renaming.

---

## 📊 Table Inventory

### ✅ Core Application Tables (CRITICAL - DO NOT DELETE)

#### 1. **`profiles`**
- **Purpose:** User profile information (extends Supabase auth.users)
- **Stores:** User details (name, email, phone, bio, avatar, location, account status)
- **Status:** ✅ ACTIVELY USED
- **Usage Count:** 50+ references
- **Key Files:**
  - `components/dashboard/profile-settings.tsx`
  - `app/api/profile/ensure/route.ts`
  - `hooks/use-auth.tsx`
  - `app/auth/callback/route.ts`
- **Renaming Impact:** 🔴 CRITICAL - Would break entire authentication system
- **Where to Update:** All `.from("profiles")` calls (50+ locations)

#### 2. **`products`**
- **Purpose:** Product/Ad listings
- **Stores:** Product details (title, description, price, images, location, status, category)
- **Status:** ✅ ACTIVELY USED
- **Usage Count:** 100+ references
- **Key Files:**
  - `components/post-product-form.tsx`
  - `components/product-grid.tsx`
  - `app/api/products/route.ts`
  - `components/dashboard/my-listings.tsx`
- **Renaming Impact:** 🔴 CRITICAL - Would break all product listings
- **Where to Update:** All `.from("products")` calls (100+ locations)

#### 3. **`categories`**
- **Purpose:** Product categories
- **Stores:** Category name, slug, icon
- **Status:** ✅ ACTIVELY USED
- **Usage Count:** 20+ references
- **Key Files:**
  - `components/mega-menu.tsx`
  - `components/category-nav.tsx`
  - `components/superadmin/categories-management.tsx`
  - `app/api/admin/categories/list/route.ts`
- **Renaming Impact:** 🔴 CRITICAL - Would break category navigation
- **Where to Update:** All `.from("categories")` calls (20+ locations)

#### 4. **`subcategories`**
- **Purpose:** Product subcategories
- **Stores:** Subcategory name, slug, category relationship
- **Status:** ✅ ACTIVELY USED
- **Usage Count:** 10+ references
- **Key Files:**
  - `components/subcategory-nav.tsx`
  - `components/mega-menu.tsx`
  - `components/post-product-form.tsx`
- **Renaming Impact:** 🟠 HIGH - Would break subcategory filtering
- **Where to Update:** All `.from("subcategories")` calls (10+ locations)
- **Note:** Table may not exist yet - check if created via migration

#### 5. **`favorites`**
- **Purpose:** User favorites/wishlist
- **Stores:** User-product favorite relationships
- **Status:** ✅ ACTIVELY USED
- **Usage Count:** 15+ references
- **Key Files:**
  - `components/dashboard/favorites-content.tsx`
  - `components/product-detail.tsx`
  - `components/header.tsx`
- **Renaming Impact:** 🟠 HIGH - Would break favorites feature
- **Where to Update:** All `.from("favorites")` calls (15+ locations)

#### 6. **`messages`**
- **Purpose:** Buyer-seller messaging
- **Stores:** Message content, sender, receiver, read status
- **Status:** ✅ ACTIVELY USED
- **Usage Count:** 30+ references
- **Key Files:**
  - `components/messaging/messages-list.tsx`
  - `components/messaging/conversation-view.tsx`
  - `components/messaging/contact-seller-modal.tsx`
- **Renaming Impact:** 🔴 CRITICAL - Would break messaging system
- **Where to Update:** All `.from("messages")` calls (30+ locations)

#### 7. **`locations`**
- **Purpose:** City/province data for autocomplete
- **Stores:** City, province, coordinates, population
- **Status:** ✅ ACTIVELY USED
- **Usage Count:** 5+ references
- **Key Files:**
  - `components/header.tsx`
  - `scripts/30_create_locations_table.sql`
- **Renaming Impact:** 🟡 MEDIUM - Would break location autocomplete
- **Where to Update:** All `.from("locations")` calls (5+ locations)

---

### ⭐ Rating & Review System

#### 8. **`user_ratings`**
- **Purpose:** User-to-user ratings (1-5 stars)
- **Stores:** Rating value, from_user, to_user
- **Status:** ✅ ACTIVELY USED
- **Usage Count:** 10+ references
- **Key Files:**
  - `app/api/ratings/route.ts`
  - `components/product-grid.tsx`
- **Renaming Impact:** 🟠 HIGH - Would break rating system
- **Where to Update:** All `.from("user_ratings")` calls (10+ locations)

#### 9. **`user_rating_stats`**
- **Purpose:** Aggregated rating statistics (VIEW)
- **Stores:** Average rating, total ratings, star distribution
- **Status:** ✅ ACTIVELY USED
- **Usage Count:** 5+ references
- **Key Files:**
  - `app/api/ratings/route.ts`
  - `components/product-grid.tsx`
- **Renaming Impact:** 🟠 HIGH - Would break rating display
- **Where to Update:** All `.from("user_rating_stats")` calls (5+ locations)
- **Note:** This is a VIEW, not a table

#### 10. **`user_comments`**
- **Purpose:** User-to-user text comments
- **Stores:** Comment text, from_user, to_user
- **Status:** ✅ ACTIVELY USED
- **Usage Count:** 8+ references
- **Key Files:**
  - `app/api/comments/route.ts`
- **Renaming Impact:** 🟠 HIGH - Would break comments feature
- **Where to Update:** All `.from("user_comments")` calls (8+ locations)

#### 11. **`reviews`** (Legacy - May be unused)
- **Purpose:** Original reviews table (may be replaced by user_ratings)
- **Stores:** Reviews with ratings
- **Status:** ⚠️ CHECK - May be legacy
- **Usage Count:** 0 references found
- **Renaming Impact:** 🟢 LOW - Appears unused
- **Action:** Verify if this is still needed or can be removed

---

### 🛡️ Moderation & Admin Tables

#### 12. **`reports`**
- **Purpose:** Reported ads/users
- **Stores:** Report reason, reporter, reported user/product, status
- **Status:** ✅ ACTIVELY USED
- **Usage Count:** 15+ references
- **Key Files:**
  - `components/messaging/messages-list.tsx`
  - `components/messaging/conversation-view.tsx`
  - `components/product-detail.tsx`
  - `components/superadmin/reported-ads.tsx`
- **Renaming Impact:** 🟠 HIGH - Would break reporting system
- **Where to Update:** All `.from("reports")` calls (15+ locations)

#### 13. **`blocked_users`**
- **Purpose:** User blocking functionality
- **Stores:** Blocker-blocked relationships
- **Status:** ✅ ACTIVELY USED
- **Usage Count:** 8+ references
- **Key Files:**
  - `components/messaging/messages-list.tsx`
  - `components/messaging/conversation-view.tsx`
  - `components/messaging/contact-seller-modal.tsx`
- **Renaming Impact:** 🟠 HIGH - Would break blocking feature
- **Where to Update:** All `.from("blocked_users")` calls (8+ locations)
- **Note:** Table may not exist yet - gracefully handled in code

#### 14. **`banned_users`**
- **Purpose:** Banned user records (audit trail)
- **Stores:** Ban reason, banned_by, status changes
- **Status:** ✅ ACTIVELY USED (Admin only)
- **Usage Count:** 5+ references
- **Key Files:**
  - `app/api/account/status/route.ts`
  - `components/superadmin/user-management.tsx`
- **Renaming Impact:** 🟡 MEDIUM - Would break ban tracking
- **Where to Update:** All `.from("banned_users")` calls (5+ locations)

#### 15. **`deactivated_ads`**
- **Purpose:** Deactivated product records (audit trail)
- **Stores:** Deactivation reason, deactivated_by, status changes
- **Status:** ✅ ACTIVELY USED (Admin only)
- **Usage Count:** 5+ references
- **Key Files:**
  - `app/api/admin/products/status/route.ts`
  - `app/api/admin/products/delete/route.ts`
- **Renaming Impact:** 🟡 MEDIUM - Would break moderation tracking
- **Where to Update:** All `.from("deactivated_ads")` calls (5+ locations)

#### 16. **`moderation_logs`**
- **Purpose:** Moderation action logs
- **Stores:** Moderation actions, actors, timestamps
- **Status:** ⚠️ CHECK - May not be fully implemented
- **Usage Count:** 2+ references (backup/restore)
- **Renaming Impact:** 🟢 LOW - Limited usage
- **Where to Update:** Backup/restore scripts

#### 17. **`audit_logs`**
- **Purpose:** System audit logs
- **Stores:** System events, actions
- **Status:** ⚠️ CHECK - May not be fully implemented
- **Usage Count:** 2+ references (backup/restore)
- **Renaming Impact:** 🟢 LOW - Limited usage
- **Where to Update:** Backup/restore scripts

#### 18. **`admin_audit_log`**
- **Purpose:** Admin action logs
- **Stores:** Admin actions, actors
- **Status:** ⚠️ CHECK - May not be fully implemented
- **Usage Count:** 2+ references (backup/restore)
- **Renaming Impact:** 🟢 LOW - Limited usage
- **Where to Update:** Backup/restore scripts

---

### ⚙️ Settings & Configuration

#### 19. **`platform_settings`**
- **Purpose:** Platform-wide settings
- **Stores:** Site name, email, features, limits
- **Status:** ✅ ACTIVELY USED
- **Usage Count:** 10+ references
- **Key Files:**
  - `components/superadmin/settings.tsx`
  - `lib/platform-settings.ts`
  - `lib/platform-settings-server.ts`
- **Renaming Impact:** 🟠 HIGH - Would break settings management
- **Where to Update:** All `.from("platform_settings")` calls (10+ locations)

#### 20. **`localities`**
- **Purpose:** Location/localities management (superadmin)
- **Stores:** Locality data for admin management
- **Status:** ✅ ACTIVELY USED (Admin only)
- **Usage Count:** 8+ references
- **Key Files:**
  - `components/superadmin/localities-management.tsx`
  - `app/api/admin/localities/list/route.ts`
- **Renaming Impact:** 🟡 MEDIUM - Would break localities management
- **Where to Update:** All `.from("localities")` calls (8+ locations)

#### 21. **`notifications`**
- **Purpose:** User notifications
- **Stores:** Notification messages, read status, links
- **Status:** ✅ ACTIVELY USED
- **Usage Count:** 10+ references
- **Key Files:**
  - `lib/notifications.ts`
  - `components/notifications/notifications-panel.tsx`
  - `app/api/admin/notifications/send/route.ts`
- **Renaming Impact:** 🟠 HIGH - Would break notifications
- **Where to Update:** All `.from("notifications")` calls (10+ locations)
- **Note:** Table may not exist yet - gracefully handled in code

#### 22. **`conversations`**
- **Purpose:** Conversation threads (if using advanced messaging)
- **Stores:** Conversation metadata
- **Status:** ⚠️ CHECK - May not be fully implemented
- **Usage Count:** 1 reference (backup)
- **Renaming Impact:** 🟢 LOW - Limited usage
- **Where to Update:** Backup scripts, messaging components if used

---

### 🗑️ Staging/Temporary Tables (SAFE TO DELETE)

#### 23. **`staging_geonames_ca`**
- **Purpose:** Temporary staging table for GeoNames data import
- **Stores:** GeoNames data during import
- **Status:** ❌ NOT USED - Staging only
- **Usage Count:** 0 references
- **Renaming Impact:** 🟢 NONE - Can be deleted
- **Action:** ✅ SAFE TO DELETE - Data already in `locations` table

#### 24. **`province_code_map`**
- **Purpose:** Mapping table for GeoNames admin1 codes
- **Stores:** Province code mappings
- **Status:** ❌ NOT USED - Staging only
- **Usage Count:** 0 references
- **Renaming Impact:** 🟢 NONE - Can be deleted
- **Action:** ✅ SAFE TO DELETE - Only needed during import

---

## 🔄 How to Rename a Table

### Step-by-Step Process

1. **Identify All References**
   ```bash
   # Search for all references
   grep -r "\.from\([\"']TABLE_NAME[\"']\)" .
   grep -r "from TABLE_NAME" .
   grep -r "TABLE_NAME" scripts/
   ```

2. **Update Code References**
   - Update all `.from("old_name")` to `.from("new_name")`
   - Update SQL scripts
   - Update API routes
   - Update components

3. **Update Database**
   ```sql
   -- Rename table
   ALTER TABLE old_name RENAME TO new_name;
   
   -- Update any views that reference it
   -- Update any triggers that reference it
   -- Update any functions that reference it
   ```

4. **Update RLS Policies**
   ```sql
   -- Policies are automatically updated, but verify:
   SELECT * FROM pg_policies WHERE tablename = 'new_name';
   ```

5. **Update Foreign Keys**
   ```sql
   -- Check for foreign keys referencing the table
   SELECT * FROM information_schema.table_constraints 
   WHERE constraint_type = 'FOREIGN KEY' 
   AND constraint_name LIKE '%old_name%';
   ```

6. **Test Thoroughly**
   - Test all features that use the table
   - Check admin panels
   - Verify API endpoints
   - Test user flows

---

## 📋 Table Renaming Impact Matrix

| Table Name | Usage Level | Rename Impact | Files to Update | Estimated Time |
|------------|-------------|---------------|-----------------|----------------|
| `profiles` | Critical | 🔴 Very High | 50+ files | 2-3 hours |
| `products` | Critical | 🔴 Very High | 100+ files | 4-5 hours |
| `categories` | High | 🟠 High | 20+ files | 1-2 hours |
| `messages` | Critical | 🔴 Very High | 30+ files | 2-3 hours |
| `favorites` | High | 🟠 High | 15+ files | 1 hour |
| `subcategories` | Medium | 🟡 Medium | 10+ files | 30 min |
| `locations` | Medium | 🟡 Medium | 5+ files | 30 min |
| `user_ratings` | High | 🟠 High | 10+ files | 1 hour |
| `reports` | High | 🟠 High | 15+ files | 1 hour |
| `blocked_users` | Medium | 🟡 Medium | 8+ files | 30 min |
| `platform_settings` | High | 🟠 High | 10+ files | 1 hour |
| `notifications` | High | 🟠 High | 10+ files | 1 hour |
| `localities` | Medium | 🟡 Medium | 8+ files | 30 min |
| `banned_users` | Low | 🟢 Low | 5+ files | 15 min |
| `deactivated_ads` | Low | 🟢 Low | 5+ files | 15 min |

---

## 🎯 Recommendations

### Tables to Keep (All Core Tables)
- All tables marked as ✅ ACTIVELY USED should be kept
- These are essential for application functionality

### Tables to Delete (Staging Only)
- `staging_geonames_ca` - ✅ Safe to delete
- `province_code_map` - ✅ Safe to delete

### Tables to Verify
- `reviews` - Check if still needed (may be legacy)
- `conversations` - Verify if advanced messaging is used
- `moderation_logs`, `audit_logs`, `admin_audit_log` - Verify implementation status

### Tables That May Not Exist Yet
- `subcategories` - May need to create table
- `notifications` - Gracefully handled if missing
- `blocked_users` - Gracefully handled if missing

---

## 🔍 Quick Reference: Find All Table References

```bash
# Find all references to a specific table
grep -r "\.from\([\"']TABLE_NAME[\"']\)" . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"

# Find in SQL files
grep -r "TABLE_NAME" scripts/ --include="*.sql"

# Count references
grep -r "\.from\([\"']TABLE_NAME[\"']\)" . | wc -l
```

---

## 📝 Notes

1. **Always backup before renaming** - Use Supabase backup feature
2. **Test in development first** - Never rename in production without testing
3. **Update documentation** - Keep this document updated
4. **Check dependencies** - Foreign keys, views, triggers, functions
5. **Notify team** - Coordinate with team members before renaming

---

## 🚀 Next Steps

1. Run `scripts/41_analyze_all_tables.sql` to get current table status
2. Verify which tables actually exist in your database
3. Delete staging tables if confirmed safe
4. Create missing tables if needed (subcategories, notifications, blocked_users)
5. Document any custom tables you've added

