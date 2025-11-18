# Google OAuth Setup Guide

## ✅ Implementation Complete!

Google Sign-In has been added to both the **Login** and **Signup** forms. Here's what you need to do to make it work:

## 🔧 Setup Steps

### 1. Configure Google OAuth in Supabase

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list
4. Click **Enable** Google provider
5. You'll need to create a Google OAuth app:

#### Create Google OAuth App:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add **Authorized redirect URIs**:
   ```
   https://[your-project-ref].supabase.co/auth/v1/callback
   ```
   Replace `[your-project-ref]` with your Supabase project reference ID
7. Copy the **Client ID** and **Client Secret**

#### Add to Supabase:

1. In Supabase Dashboard → **Authentication** → **Providers** → **Google**
2. Paste your **Client ID** and **Client Secret**
3. Click **Save**

### 2. Update Redirect URLs

Make sure your Supabase project has the correct redirect URL configured:

1. Go to **Authentication** → **URL Configuration**
2. Add your site URL (e.g., `http://localhost:3000` for development)
3. Add redirect URL: `http://localhost:3000/auth/callback` (for development)
4. For production, add your production URL: `https://yourdomain.com/auth/callback`

### 3. Test the Implementation

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Go to `/auth/login` or `/auth/signup`

3. Click **"Sign in with Google"** or **"Sign up with Google"**

4. You should be redirected to Google's sign-in page

5. After signing in, you'll be redirected back to your app

6. Check your `profiles` table - you should see:
   - ✅ Email (from Google)
   - ✅ Full name (from Google)
   - ✅ Avatar URL (from Google profile picture)
   - ⚠️ Phone: NULL (Google doesn't provide this)

## 📋 What Gets Saved

When a user signs up/signs in with Google:

| Field | Source | Status |
|-------|--------|--------|
| **Email** | Google Account | ✅ Auto-saved |
| **Full Name** | Google Account | ✅ Auto-saved |
| **Avatar URL** | Google Profile Picture | ✅ Auto-saved |
| **Phone** | Not provided | ❌ NULL (user can add later) |
| **Location** | Not provided | ❌ NULL (user can add later) |
| **Bio** | Not provided | ❌ NULL (user can add later) |

## 🔄 How It Works

1. **User clicks "Sign in with Google"**
   - Redirects to Google OAuth page
   - User authorizes your app

2. **Google redirects back to `/auth/callback`**
   - Supabase exchanges code for session
   - User is authenticated

3. **Database trigger creates profile**
   - `handle_new_user()` trigger runs automatically
   - Profile created in `profiles` table with Google data

4. **Callback route updates profile**
   - Extracts Google data (name, avatar)
   - Updates profile if needed
   - Redirects to dashboard or superadmin

## 🎨 UI Features

- ✅ **Google Sign-In button** on login form
- ✅ **Google Sign-Up button** on signup form
- ✅ **Loading states** during OAuth flow
- ✅ **Error handling** for failed OAuth attempts
- ✅ **Clean design** matching your existing forms

## 🐛 Troubleshooting

### Issue: "Failed to sign in with Google"

**Solutions:**
1. Check Google OAuth is enabled in Supabase
2. Verify Client ID and Secret are correct
3. Check redirect URI matches exactly in Google Console
4. Ensure redirect URL is added in Supabase URL Configuration

### Issue: Redirect loop

**Solutions:**
1. Check `/auth/callback` route is working
2. Verify redirect URLs in Supabase match your domain
3. Clear browser cookies and try again

### Issue: Profile not created

**Solutions:**
1. Run the trigger script: `scripts/20_update_oauth_profile_trigger.sql`
2. Check Supabase logs for errors
3. Verify RLS policies allow profile creation

## 📝 Files Modified

- ✅ `components/auth/login-form.tsx` - Added Google Sign-In button
- ✅ `components/auth/signup-form.tsx` - Added Google Sign-Up button
- ✅ `app/auth/callback/route.ts` - Enhanced to handle OAuth redirects
- ✅ `scripts/20_update_oauth_profile_trigger.sql` - Updated trigger to capture avatar URL

## 🚀 Next Steps

1. **Configure Google OAuth** in Supabase (see Step 1 above)
2. **Test the flow** on your development environment
3. **Update production URLs** when deploying
4. **Monitor** user sign-ups in your Supabase dashboard

## 💡 Optional Enhancements

- Add Facebook OAuth (similar process)
- Add Apple Sign-In (for iOS users)
- Add email verification reminder for OAuth users
- Add profile completion prompt for missing fields (phone, location)

---

**Need Help?** Check the [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)

