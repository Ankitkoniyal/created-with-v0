# 🔄 Understanding Google OAuth Redirect URIs

## Why You Don't Need a Domain Name

You **don't need a domain name** for development! Here's why:

## 📍 The OAuth Flow

When a user clicks "Sign in with Google", here's what happens:

```
1. User clicks button on: http://localhost:3000/auth/login
   ↓
2. Redirects to Google OAuth page
   ↓
3. User authorizes your app
   ↓
4. Google redirects to: https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
   (This is Supabase's callback URL - NOT your domain!)
   ↓
5. Supabase processes the OAuth code
   ↓
6. Supabase redirects back to: http://localhost:3000/auth/callback
   (This is YOUR app's callback route)
   ↓
7. Your app creates the user session
```

## ✅ What to Enter in Google Cloud Console

### **Authorized JavaScript origins**
For development, add:
```
http://localhost:3000
```

This is where your app runs locally.

### **Authorized redirect URIs**
Add the **Supabase callback URL**:
```
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

**Important**: This is NOT your domain - it's Supabase's OAuth callback endpoint!

## 🎯 Why Supabase's URL?

- Supabase handles the OAuth exchange with Google
- Google redirects to Supabase (not directly to your app)
- Supabase then redirects to your app's `/auth/callback` route
- This is configured in Supabase Dashboard → Authentication → URL Configuration

## 📝 Complete Setup

### In Google Cloud Console:
1. **Authorized JavaScript origins**: `http://localhost:3000`
2. **Authorized redirect URIs**: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

### In Supabase Dashboard:
1. Go to **Authentication** → **URL Configuration**
2. **Site URL**: `http://localhost:3000`
3. **Redirect URLs**: `http://localhost:3000/auth/callback`

## 🚀 When You Get a Domain (Later)

When you deploy to production:

### In Google Cloud Console:
1. **Authorized JavaScript origins**: Add `https://yourdomain.com`
2. **Authorized redirect URIs**: Keep the Supabase URL (same as before)

### In Supabase Dashboard:
1. **Site URL**: `https://yourdomain.com`
2. **Redirect URLs**: `https://yourdomain.com/auth/callback`

**Note**: The Supabase redirect URI stays the same - you don't change it!

## ✅ Summary

- ✅ Use `http://localhost:3000` for development (no domain needed!)
- ✅ Use Supabase's callback URL: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
- ✅ Configure your app's callback in Supabase Dashboard
- ✅ No domain name required for development!

