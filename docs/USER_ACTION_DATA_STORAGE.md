# User Action Data Storage Guide

## 📊 Where User Action Data is Stored

When you **suspend, ban, delete, or soft delete** a user, the data is stored in **multiple places** for complete tracking:

---

## 🗄️ **Data Storage Locations:**

### **1. Auth Metadata** (`auth.users.user_metadata`)
**Location:** Supabase Auth system

**Stored Data:**
```json
{
  "account_status": "banned" | "suspended" | "deactivated" | "deleted",
  "deactivated_at": "2025-01-15T10:30:00Z" // if deactivated
}
```

**Purpose:** Controls user's ability to log in and access the platform

---

### **2. Profiles Table** (`profiles`)
**Location:** Your Supabase database

**Stored Data:**
- `status` - Account status: `active`, `banned`, `suspended`, `deactivated`, `deleted`
- `deleted_at` - Timestamp when soft deleted
- `deletion_reason` - Reason for deletion/ban
- `deactivated_at` - Timestamp when deactivated
- `updated_at` - Last update timestamp

**Purpose:** Database record of user account status

---

### **3. Banned Users Table** (`banned_users`) - NEW!
**Location:** Your Supabase database (audit trail)

**Stored Data:**
- `user_id` - Who was banned
- `banned_by` - Admin who performed the action
- `reason` - Ban reason (required)
- `status_before` - Status before ban
- `status_after` - Status after ban (`banned`, `suspended`, `deactivated`)
- `banned_at` - When ban happened
- `expires_at` - Optional expiration date
- `is_active` - Whether ban is currently active

**Purpose:** Complete audit trail of all ban/suspension actions

---

## 🔍 **How to Check Stored Data:**

### **Check User Status in Profiles:**
```sql
SELECT id, email, status, deleted_at, deletion_reason, deactivated_at
FROM profiles
WHERE status IN ('banned', 'suspended', 'deleted', 'deactivated');
```

### **Check Ban History:**
```sql
SELECT 
  bu.*,
  p.email as user_email,
  admin.email as banned_by_email
FROM banned_users bu
JOIN profiles p ON bu.user_id = p.id
LEFT JOIN profiles admin ON bu.banned_by = admin.id
WHERE bu.is_active = true
ORDER BY bu.banned_at DESC;
```

### **Check Auth Metadata:**
```sql
-- Note: This requires admin access in Supabase Dashboard
-- Go to Authentication > Users > Select User > View user_metadata
```

---

## ✅ **What Happens When You Click:**

### **Suspend User:**
1. ✅ Updates `auth.users.user_metadata.account_status = 'suspended'`
2. ✅ Updates `profiles.status = 'suspended'`
3. ✅ Updates `profiles.deletion_reason = '<reason>'`
4. ✅ Creates record in `banned_users` table
5. ✅ User cannot log in

### **Ban User:**
1. ✅ Updates `auth.users.user_metadata.account_status = 'banned'`
2. ✅ Updates `profiles.status = 'banned'`
3. ✅ Updates `profiles.deletion_reason = '<reason>'`
4. ✅ Creates record in `banned_users` table
5. ✅ User cannot log in

### **Soft Delete User:**
1. ✅ Updates `auth.users.user_metadata.account_status = 'deleted'`
2. ✅ Updates `profiles.status = 'deleted'`
3. ✅ Updates `profiles.deleted_at = NOW()`
4. ✅ Updates `profiles.deletion_reason = '<reason>'`
5. ✅ User cannot log in
6. ✅ Data is retained (soft delete)

### **Deactivate User:**
1. ✅ Updates `auth.users.user_metadata.account_status = 'deactivated'`
2. ✅ Updates `profiles.status = 'deactivated'`
3. ✅ Updates `profiles.deactivated_at = NOW()`
4. ✅ Creates record in `banned_users` table
5. ✅ User cannot log in

---

## 🔧 **Troubleshooting:**

### **If buttons show "forbidden" error:**

1. **Check your role in profiles table:**
   ```sql
   SELECT id, email, role FROM profiles WHERE email = 'your-email@example.com';
   ```
   Should show: `role = 'super_admin'` or `role = 'owner'`

2. **If role is missing, update it:**
   ```sql
   UPDATE profiles 
   SET role = 'super_admin' 
   WHERE email = 'ankit.koniyal000@gmail.com';
   ```

3. **Verify in Supabase Dashboard:**
   - Go to Table Editor > profiles
   - Find your user
   - Check `role` column

---

## 📝 **Summary:**

**Yes, all data IS being stored!** When you perform user actions:

✅ **Auth metadata** - Controls login access  
✅ **Profiles table** - Stores account status  
✅ **Banned users table** - Complete audit trail  

The "forbidden" error was caused by the API not checking the `profiles` table for your role. This is now fixed!

