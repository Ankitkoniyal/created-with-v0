# User Status Actions Explained

## Overview
This document explains the differences between **Ban**, **Suspend**, **Soft Delete**, and **Permanent Delete** actions, and how they affect user access.

---

## 1. **BAN** 🚫

### What it does:
- **Permanent restriction** - User account is permanently blocked from accessing the platform
- **Account remains in database** - User data is preserved for audit purposes
- **Status**: `account_status: "banned"` in `user_metadata` and `status: "banned"` in `profiles` table
- **Recorded in**: `banned_users` table with reason, banned_by, banned_at

### User Experience:
- ❌ **Cannot login** - Login attempts will fail with message: "Your account has been banned. Reason: [reason]"
- ❌ **Cannot signup again** - If user tries to signup with the same email, they'll see: "This email is associated with a banned account. Please contact support."
- ❌ **Cannot access any features** - All access is blocked
- ✅ **Data preserved** - User's ads, profile, and history remain in database

### When to use:
- Serious violations (spam, fraud, harassment)
- Permanent policy violations
- Repeated offenses after warnings

### Reversibility:
- ✅ **Can be reversed** by super admin changing status back to "active"
- Ban history is preserved in `banned_users` table

---

## 2. **SUSPEND** ⏸️

### What it does:
- **Temporary restriction** - User account is temporarily blocked
- **Account remains in database** - User data is preserved
- **Status**: `account_status: "suspended"` in `user_metadata` and `status: "suspended"` in `profiles` table
- **Recorded in**: `banned_users` table with reason, banned_by, banned_at, and optional `expires_at`

### User Experience:
- ❌ **Cannot login** - Login attempts will fail with message: "Your account has been suspended. Reason: [reason]. Suspension expires on: [date] (if applicable)"
- ❌ **Cannot signup again** - If user tries to signup with the same email, they'll see: "This email is associated with a suspended account. Please contact support."
- ❌ **Cannot access any features** - All access is blocked during suspension period
- ✅ **Data preserved** - User's ads, profile, and history remain in database

### When to use:
- Temporary violations
- Warning for first-time offenses
- Investigation period
- Time-limited restrictions

### Reversibility:
- ✅ **Can be reversed** by super admin changing status back to "active"
- ✅ **Can expire automatically** if `expires_at` is set
- Suspension history is preserved in `banned_users` table

---

## 3. **SOFT DELETE** 🗑️

### What it does:
- **Account marked as deleted** - User account is marked as deleted but not removed
- **Account remains in database** - User data is preserved with `deleted_at` timestamp
- **Status**: `account_status: "deleted"` in `user_metadata` and `status: "deleted"` in `profiles` table
- **Recorded in**: `profiles.deleted_at` and `profiles.deletion_reason`

### User Experience:
- ❌ **Cannot login** - Login attempts will fail with message: "This account has been deleted."
- ✅ **Can signup again** - User can create a new account with the same email (old account is soft-deleted)
- ❌ **Cannot access any features** - All access is blocked
- ✅ **Data preserved** - User's ads, profile, and history remain in database (may be hidden from public view)

### When to use:
- User requested account deletion
- Account cleanup without data loss
- GDPR compliance (right to be forgotten - but data kept for legal reasons)
- Reversible account removal

### Reversibility:
- ✅ **Can be reversed** by super admin changing status back to "active"
- Deletion timestamp and reason are preserved

---

## 4. **PERMANENT DELETE** 💀

### What it does:
- **Complete removal** - User account is permanently deleted from the database
- **Account removed from database** - User data is completely removed (or anonymized)
- **Status**: User record is deleted from `auth.users` and `profiles` tables
- **Recorded in**: May be logged in audit tables before deletion

### User Experience:
- ❌ **Cannot login** - Account no longer exists
- ✅ **Can signup again** - User can create a new account with the same email (treated as new user)
- ❌ **No data** - All user data is removed
- ❌ **Cannot access any features** - Account doesn't exist

### When to use:
- Complete data removal required
- Legal compliance (after retention period)
- Irreversible account removal
- **⚠️ Use with extreme caution** - Cannot be undone

### Reversibility:
- ❌ **Cannot be reversed** - Data is permanently lost
- ⚠️ **Warning**: This action is irreversible

---

## Comparison Table

| Feature | Ban | Suspend | Soft Delete | Permanent Delete |
|---------|-----|---------|-------------|------------------|
| **Login** | ❌ Blocked | ❌ Blocked | ❌ Blocked | ❌ Account doesn't exist |
| **Signup (same email)** | ❌ Blocked | ❌ Blocked | ✅ Allowed | ✅ Allowed (new account) |
| **Data Preserved** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Reversible** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Duration** | Permanent | Temporary | Permanent | Permanent |
| **Use Case** | Serious violations | Temporary issues | User request | Complete removal |
| **Database Status** | `banned` | `suspended` | `deleted` | Record removed |

---

## Current Implementation Status

### ✅ Implemented:
- Status updates in `user_metadata.account_status` and `profiles.status`
- Tracking in `banned_users` table for ban/suspend actions
- Tracking in `profiles.deleted_at` for soft delete

### ⚠️ Missing (Needs Implementation):
- **Login check** - Currently banned/suspended users can still login
- **Signup check** - Currently banned/suspended users can signup again with same email
- **User-friendly error messages** - Need to show specific messages based on status
- **Automatic suspension expiration** - If `expires_at` is set, need to check and auto-lift

---

## Next Steps

1. Add account status check in login flow
2. Add account status check in signup flow
3. Show appropriate error messages to users
4. Implement automatic suspension expiration check
5. Add account status check in middleware/auth guards

