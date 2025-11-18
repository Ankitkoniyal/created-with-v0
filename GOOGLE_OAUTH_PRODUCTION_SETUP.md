# 🚀 Google OAuth Production Setup Guide

## When You Deploy to Production

When you get a domain name and deploy your website, here's what you need to update:

---

## 📋 What to Update

### ✅ **1. Google Cloud Console** (Add Production URLs)

Go to: **APIs & Services** → **Credentials** → Your OAuth Client

#### **Authorized JavaScript origins**
**ADD** your production domain (keep localhost for testing):
```
http://localhost:3000          (keep for local testing)
https://yourdomain.com          (ADD this)
```

#### **Authorized redirect URIs**
**KEEP the Supabase URL** (don't change this!):
```
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```
**Note**: This stays the same - you don't add your domain here!

---

### ✅ **2. Supabase Dashboard** (Update URLs)

Go to: **Authentication** → **URL Configuration**

#### **Site URL**
**UPDATE** to your production domain:
```
https://yourdomain.com
```

#### **Redirect URLs**
**ADD** your production callback URL (keep localhost for testing):
```
http://localhost:3000/auth/callback          (keep for local testing)
https://yourdomain.com/auth/callback         (ADD this)
```

---

## 📝 Complete Example

Let's say:
- Your domain: `https://coinmint.com`
- Your Supabase project: `https://abcdefghijklm.supabase.co`

### In Google Cloud Console:

**Authorized JavaScript origins:**
```
http://localhost:3000
https://coinmint.com
```

**Authorized redirect URIs:**
```
https://abcdefghijklm.supabase.co/auth/v1/callback
```
*(This stays the same!)*

### In Supabase Dashboard:

**Site URL:**
```
https://coinmint.com
```

**Redirect URLs:**
```
http://localhost:3000/auth/callback
https://coinmint.com/auth/callback
```

---

## ⚠️ Important Notes

### ✅ **Keep Localhost URLs**
- Keep `http://localhost:3000` in both places
- This allows you to test locally even after production launch

### ✅ **Supabase Redirect URI Never Changes**
- The Supabase callback URL (`https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`) stays the same
- You **don't** add your domain to Google's redirect URIs
- Google always redirects to Supabase, then Supabase redirects to your app

### ✅ **Update Supabase Redirect URLs**
- Add your production callback URL in Supabase Dashboard
- This tells Supabase where to redirect users after OAuth

---

## 🔄 The Production Flow

```
1. User visits: https://coinmint.com/auth/login
   ↓
2. Clicks "Sign in with Google"
   ↓
3. Redirects to Google OAuth page
   ↓
4. Google redirects to: https://abcdefghijklm.supabase.co/auth/v1/callback
   (Same Supabase URL - never changes!)
   ↓
5. Supabase processes OAuth
   ↓
6. Supabase redirects to: https://coinmint.com/auth/callback
   (Your production callback URL)
   ↓
7. Your app creates session
   ↓
8. User is logged in!
```

---

## ✅ Checklist for Production

- [ ] Add production domain to **Google Cloud Console** → **Authorized JavaScript origins**
- [ ] Keep Supabase callback URL in **Google Cloud Console** → **Authorized redirect URIs** (don't change!)
- [ ] Update **Supabase Dashboard** → **Site URL** to production domain
- [ ] Add production callback URL to **Supabase Dashboard** → **Redirect URLs**
- [ ] Keep localhost URLs for local testing
- [ ] Test Google Sign-In on production domain
- [ ] Verify profile creation in Supabase `profiles` table

---

## 🎯 Summary

**What Changes:**
- ✅ Add production domain to Google JavaScript origins
- ✅ Update Supabase Site URL to production domain
- ✅ Add production callback URL to Supabase Redirect URLs

**What Stays the Same:**
- ✅ Supabase callback URL in Google redirect URIs (never changes!)
- ✅ Keep localhost URLs for testing

---

## 💡 Pro Tip

You can keep both development and production URLs active at the same time:
- Test locally with `http://localhost:3000`
- Use production with `https://yourdomain.com`
- Both will work simultaneously!

