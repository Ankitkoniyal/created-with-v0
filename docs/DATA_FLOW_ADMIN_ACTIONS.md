# Data Flow: Admin Actions & Database Updates

This document explains how admin actions (status changes, deletions, bans) update the database tables.

## 📊 Database Tables Overview

### 1. **Products Table** (`products`)
Stores all ads/listings with their current state.

**Key Columns:**
- `status` - Current status: `active`, `pending`, `rejected`, `inactive`, `deleted`, `deactivated`, `sold`, `expired`
- `moderated_by` - UUID of admin who performed moderation
- `moderated_at` - Timestamp when moderation happened
- `moderation_note` - Admin's notes/reason for the action
- `updated_at` - Last update timestamp

### 2. **Profiles Table** (`profiles`)
Stores user account information.

**Key Columns:**
- `status` - Account status: `active`, `banned`, `suspended`, `deactivated`, `deleted`
- `role` - User role: `user`, `admin`, `super_admin`, `owner`
- `deleted_at` - Timestamp for soft delete
- `deletion_reason` - Reason for deletion
- `deactivated_at` - Timestamp for deactivation
- `updated_at` - Last update timestamp

### 3. **Deactivated Ads Table** (`deactivated_ads`) - NEW!
Dedicated audit trail for deactivated/deleted ads.

**Columns:**
- `product_id` - Reference to the product
- `deactivated_by` - Admin who deactivated it
- `reason` - Reason for deactivation
- `status_before` - Status before deactivation
- `status_after` - Status after deactivation
- `moderation_note` - Additional notes
- `created_at` - When deactivation happened

### 4. **Banned Users Table** (`banned_users`) - NEW!
Dedicated audit trail for banned/suspended users.

**Columns:**
- `user_id` - Reference to the user
- `banned_by` - Admin who banned them
- `reason` - Ban reason (required)
- `status_before` - Status before ban
- `status_after` - Status after ban
- `banned_at` - When ban happened
- `expires_at` - Optional expiration for temporary bans
- `is_active` - Whether ban is currently active

---

## 🔄 Admin Action Flow

### **Action 1: Change Product Status** (Approve/Reject/Deactivate)

**When:** Admin approves, rejects, or deactivates an ad

**What Happens:**

1. **Products Table Update:**
   ```sql
   UPDATE products SET
     status = 'active' | 'rejected' | 'inactive' | 'deleted',
     moderated_by = <admin_user_id>,
     moderated_at = NOW(),
     moderation_note = '<reason/notes>',
     updated_at = NOW()
   WHERE id = <product_id>
   ```

2. **Deactivated Ads Table** (if status is inactive/deleted/rejected/deactivated):
   ```sql
   INSERT INTO deactivated_ads (
     product_id,
     deactivated_by,
     reason,
     status_before,
     status_after,
     moderation_note
   ) VALUES (...)
   ON CONFLICT (product_id) DO UPDATE SET ...
   ```

3. **Trigger:** Database trigger automatically creates `deactivated_ads` record when status changes to deactivated state

**API Route:** `/api/admin/products/status`

---

### **Action 2: Delete Product** (Hard Delete)

**When:** Admin permanently deletes an ad

**What Happens:**

1. **Deactivated Ads Table** (before deletion):
   ```sql
   INSERT INTO deactivated_ads (
     product_id,
     deactivated_by,
     reason,
     status_before,
     status_after: 'deleted',
     moderation_note
   )
   ```

2. **Products Table:**
   ```sql
   DELETE FROM products WHERE id = <product_id>
   ```

**API Route:** `/api/admin/products/delete`

---

### **Action 3: Ban/Suspend/Deactivate User**

**When:** Admin bans, suspends, or deactivates a user account

**What Happens:**

1. **Auth Metadata Update** (Supabase Auth):
   ```javascript
   auth.admin.updateUserById(userId, {
     user_metadata: {
       account_status: 'banned' | 'suspended' | 'deactivated',
       deactivated_at: <timestamp>
     }
   })
   ```

2. **Profiles Table Update:**
   ```sql
   UPDATE profiles SET
     status = 'banned' | 'suspended' | 'deactivated',
     deactivated_at = NOW(),
     deletion_reason = '<reason>',  -- if banned/suspended
     updated_at = NOW()
   WHERE id = <user_id>
   ```

3. **Banned Users Table:**
   ```sql
   -- Deactivate existing bans
   UPDATE banned_users 
   SET is_active = false 
   WHERE user_id = <user_id> AND is_active = true
   
   -- Insert new ban record
   INSERT INTO banned_users (
     user_id,
     banned_by,
     reason,
     status_before,
     status_after,
     banned_at,
     is_active
   ) VALUES (...)
   ```

**API Route:** `/api/account/status`

---

### **Action 4: Delete User** (Soft Delete)

**When:** Admin soft deletes a user account

**What Happens:**

1. **Auth Metadata:**
   ```javascript
   user_metadata: {
     account_status: 'deleted',
     deactivated_at: <timestamp>
   }
   ```

2. **Profiles Table:**
   ```sql
   UPDATE profiles SET
     status = 'deleted',
     deleted_at = NOW(),
     deletion_reason = '<reason>',
     updated_at = NOW()
   WHERE id = <user_id>
   ```

3. **Cascade:** Related data (products, messages, etc.) may be affected based on foreign key constraints

---

## 📋 Current Status Check

### ✅ **Products Table - Has These Columns:**
- ✅ `status` - EXISTS (added in script 08)
- ⚠️ `moderated_by` - **NEEDS TO BE ADDED**
- ⚠️ `moderated_at` - **NEEDS TO BE ADDED**
- ⚠️ `moderation_note` - **NEEDS TO BE ADDED**

### ✅ **Profiles Table - Has These Columns:**
- ✅ `role` - EXISTS (added in script 17)
- ⚠️ `status` - **NEEDS TO BE ADDED**
- ⚠️ `deleted_at` - **NEEDS TO BE ADDED**
- ⚠️ `deletion_reason` - **NEEDS TO BE ADDED**
- ⚠️ `deactivated_at` - **NEEDS TO BE ADDED**

### ✅ **Tracking Tables:**
- ✅ `deactivated_ads` - EXISTS (created in script 22)
- ✅ `banned_users` - EXISTS (created in script 22)

---

## 🛠️ Required Actions

### **Step 1: Run Migration Script**
Run `scripts/23_add_missing_moderation_columns.sql` in Supabase SQL Editor to add missing columns.

### **Step 2: Verify Columns Exist**
After running the migration, verify in Supabase:
- Products table has: `moderated_by`, `moderated_at`, `moderation_note`
- Profiles table has: `status`, `deleted_at`, `deletion_reason`, `deactivated_at`

### **Step 3: Test Admin Actions**
1. Change a product status → Check `products` table and `deactivated_ads` table
2. Ban a user → Check `profiles` table, auth metadata, and `banned_users` table
3. Delete a product → Check `deactivated_ads` table (before deletion)

---

## 🔍 How to Check Current State

### **In Supabase Dashboard:**

1. **Check Products Table:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'products' 
   AND column_name IN ('status', 'moderated_by', 'moderated_at', 'moderation_note');
   ```

2. **Check Profiles Table:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'profiles' 
   AND column_name IN ('status', 'role', 'deleted_at', 'deletion_reason', 'deactivated_at');
   ```

3. **Check Tracking Tables:**
   ```sql
   SELECT COUNT(*) FROM deactivated_ads;
   SELECT COUNT(*) FROM banned_users WHERE is_active = true;
   ```

---

## 📝 Notes

- **Current Code:** The API routes handle missing columns gracefully (they catch errors and continue)
- **Best Practice:** All columns should exist for proper tracking and audit trails
- **Data Integrity:** The tracking tables (`deactivated_ads`, `banned_users`) provide a complete audit history even if main table data changes
- **User Status:** User account status is stored in TWO places:
  1. `profiles.status` (database column)
  2. `auth.users.user_metadata.account_status` (Supabase Auth metadata)
  
  Both are updated for consistency.

