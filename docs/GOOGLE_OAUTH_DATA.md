# Google OAuth Sign-Up Data Saved

## Overview
When a user signs up using Google OAuth, the following data is automatically saved to your database.

## Data Automatically Saved

### ✅ **Saved Automatically:**

1. **User ID** (`id`)
   - Unique UUID from Supabase Auth
   - Primary key in `profiles` table

2. **Email** (`email`)
   - User's Google email address
   - Automatically verified by Google
   - Saved to `profiles.email`

3. **Full Name** (`full_name`)
   - User's Google account name
   - Extracted from `user_metadata.name` or `user_metadata.full_name`
   - Saved to `profiles.full_name`

4. **Avatar URL** (`avatar_url`) ⭐ **NEW - Now Captured!**
   - User's Google profile picture
   - Extracted from `user_metadata.picture` or `user_metadata.avatar_url`
   - Saved to `profiles.avatar_url`
   - This is automatically displayed in the user's profile

5. **Timestamps**
   - `created_at`: When the profile was created
   - `updated_at`: Last profile update time

### ❌ **NOT Provided by Google OAuth:**

1. **Phone Number** (`phone`)
   - Google OAuth does NOT provide phone numbers
   - This field will be `NULL` for Google sign-ups
   - Users can add it later in their profile settings

2. **Location** (`location`)
   - Not provided by Google OAuth
   - Users can add it later in their profile settings

3. **Bio** (`bio`)
   - Not provided by Google OAuth
   - Users can add it later in their profile settings

## How It Works

### 1. **Database Trigger** (Automatic)
When a user signs up with Google OAuth, a database trigger (`handle_new_user`) automatically:
- Creates a profile record in the `profiles` table
- Extracts data from `raw_user_meta_data`
- Saves: `id`, `email`, `full_name`, `phone`, `avatar_url`

### 2. **OAuth Callback** (Backup)
The `/auth/callback` route also ensures the profile exists and updates it with:
- Latest OAuth data
- Avatar URL from Google
- Any missing information

### 3. **Profile Ensure API** (On-Demand)
The `/api/profile/ensure` endpoint can be called to:
- Verify profile exists
- Update profile with latest OAuth data
- Fill in any missing fields

## Comparison: Email Sign-Up vs Google OAuth

| Field | Email Sign-Up | Google OAuth |
|-------|--------------|--------------|
| **Email** | ✅ User provides | ✅ Auto from Google |
| **Full Name** | ✅ User provides | ✅ Auto from Google |
| **Phone** | ✅ User provides | ❌ Not available |
| **Avatar URL** | ❌ User uploads later | ✅ Auto from Google |
| **Email Verified** | ⏳ Requires confirmation | ✅ Auto verified |

## User Experience

### After Google Sign-Up:
1. ✅ User is immediately logged in
2. ✅ Profile is automatically created
3. ✅ Name and avatar are pre-filled
4. ⚠️ Phone number is missing (user can add later)
5. ✅ User can start using the marketplace immediately

### Profile Completion:
Users who sign up with Google can later:
- Add phone number in profile settings
- Add location in profile settings
- Add bio in profile settings
- Update avatar (if they want a different one)

## Security & Privacy

- ✅ Email is verified by Google (no email confirmation needed)
- ✅ User data comes from trusted Google account
- ✅ No password stored (OAuth handles authentication)
- ✅ Profile data is protected by Row Level Security (RLS)

## Implementation Files

- **Database Trigger**: `scripts/20_update_oauth_profile_trigger.sql`
- **OAuth Callback**: `app/auth/callback/route.ts`
- **Profile Ensure**: `app/api/profile/ensure/route.ts`
- **Profiles Table**: `scripts/01_create_tables.sql`

## Next Steps

To enable Google OAuth:
1. Run the SQL script: `scripts/20_update_oauth_profile_trigger.sql`
2. Configure Google OAuth in Supabase Dashboard
3. Add Google Sign-In button to login/signup forms
4. Test the flow to ensure data is saved correctly

