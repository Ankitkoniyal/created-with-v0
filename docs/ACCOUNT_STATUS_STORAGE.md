# Account Status Storage in Supabase

## Overview
When a user deactivates their account, the status is stored in **two locations** in Supabase:

## 1. Supabase Auth Metadata
**Table:** `auth.users`  
**Column:** `user_metadata.account_status`

- This is stored in Supabase's authentication system
- Accessible via: `user.user_metadata.account_status`
- Updated using Supabase Admin API: `auth.admin.updateUserById()`

## 2. Profiles Table
**Table:** `profiles` (public schema)  
**Column:** `status`

- This is stored in the public database table
- Accessible via: `profiles.status`
- Updated using standard Supabase client: `supabase.from("profiles").update()`

## How It Works

When a user deactivates their account via `/api/account/status`:

1. **Auth Metadata Update:**
   ```typescript
   await adminClient.auth.admin.updateUserById(userId, {
     user_metadata: {
       account_status: "deactivated",
       deactivated_at: timestamp
     }
   })
   ```

2. **Profile Table Update:**
   ```typescript
   await adminClient
     .from("profiles")
     .update({
       status: "deactivated",
       deactivated_at: timestamp,
       updated_at: timestamp
     })
     .eq("id", userId)
   ```

## Status Values

Possible account status values:
- `"active"` - Normal active account
- `"deactivated"` - User has deactivated their account
- `"suspended"` - Account suspended by admin
- `"banned"` - Account banned by admin
- `"deleted"` - Account deleted

## Why Two Locations?

1. **Auth Metadata (`user_metadata.account_status`):**
   - Available immediately on login
   - Can be checked before database queries
   - Persists across sessions

2. **Profiles Table (`profiles.status`):**
   - Can be queried by admins
   - Supports complex queries and filtering
   - Can be indexed for performance
   - Allows for additional metadata (like `deactivated_at`)

## Querying Account Status

### In Frontend Components:
```typescript
// Check both locations
const status = profile?.status || user?.user_metadata?.account_status || "active"
```

### In API Routes:
```typescript
// Check profile table
const { data: profile } = await supabase
  .from("profiles")
  .select("status")
  .eq("id", userId)
  .single()

// Or check auth metadata
const { data: { user } } = await supabase.auth.getUser()
const status = user.user_metadata?.account_status
```

## Important Notes

- Both locations should be kept in sync
- The API endpoint `/api/account/status` updates both automatically
- Always check both locations for reliability
- Profile table status takes precedence if both exist

