# 🚀 Google OAuth Quick Start Guide

## ✅ Code is Ready! Now Just Configure Google OAuth

All the code is implemented. You just need to configure Google OAuth in 3 simple steps:

---

## 📋 Step-by-Step Setup

### **STEP 1: Get Your Supabase Project Reference ID**

1. Go to your **Supabase Dashboard**: https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Find your **Project URL** - it looks like: `https://xxxxxxxxxxxxx.supabase.co`
5. Copy the part before `.supabase.co` - this is your **Project Reference ID**
   - Example: If URL is `https://abcdefghijklm.supabase.co`, your ID is `abcdefghijklm`

**Write this down - you'll need it!**

---

### **STEP 2: Create Google OAuth App**

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create or Select a Project**
   - Click the project dropdown at the top
   - Click **"New Project"** (or select existing)
   - Name it: "My Marketplace OAuth" (or any name)
   - Click **"Create"**

3. **Configure OAuth Consent Screen** (Required)
   - In the left menu, go to **"APIs & Services"** → **"OAuth consent screen"**
   - User Type: Select **"External"** (unless you have Google Workspace)
   - Click **"Create"**
   - Fill in the required fields:
     - **App name**: Your marketplace name (e.g., "CoinMint Marketplace")
     - **User support email**: Your email address
     - **Developer contact information**: Your email address
   - Click **"Save and Continue"**
   - On "Scopes" page: Click **"Save and Continue"** (no need to add scopes)
   - On "Test users" page: Click **"Save and Continue"** (skip for now)
   - Click **"Back to Dashboard"**

4. **Create OAuth Credentials**
   - Go to **"APIs & Services"** → **"Credentials"**
   - Click **"+ CREATE CREDENTIALS"** at the top
   - Select **"OAuth client ID"**

5. **Configure OAuth Client ID**
   - Application type: **Web application**
   - Name: "Marketplace Web Client" (or any name)
   
   - **Authorized JavaScript origins** (for development):
     - Click **"+ ADD URI"**
     - Add: `http://localhost:3000`
     - (This is for your local development server)
   
   - **Authorized redirect URIs** (IMPORTANT - this is the Supabase callback):
     - Click **"+ ADD URI"**
     - Add this URL (replace `YOUR_PROJECT_REF` with your ID from Step 1):
       ```
       https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
       ```
       - Example: `https://abcdefghijklm.supabase.co/auth/v1/callback`
     - **Note**: This is NOT your domain - it's Supabase's callback URL!
   
   - Click **"CREATE"**

5. **Copy Your Credentials**
   - You'll see a popup with:
     - **Client ID** (looks like: `123456789-abc...xyz.apps.googleusercontent.com`)
     - **Client Secret** (looks like: `GOCSPX-abc...xyz`)
   - **Copy both** - you'll need them in Step 3!

---

### **STEP 3: Configure in Supabase** (Use credentials from Step 2)

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com
   - Select your project

2. **Enable Google Provider**
   - Go to **"Authentication"** → **"Providers"** (left sidebar)
   - Find **"Google"** in the list
   - Click the toggle to **Enable** it

3. **Add Your Credentials**
   - Paste your **Client ID** (from Step 2)
   - Paste your **Client Secret** (from Step 2)
   - Click **"Save"**

4. **Configure Redirect URLs**
   - Still in **"Authentication"**, go to **"URL Configuration"**
   - Under **"Site URL"**, add:
     - For development: `http://localhost:3000`
     - For production: `https://yourdomain.com` (when ready)
   - Under **"Redirect URLs"**, add:
     - For development: `http://localhost:3000/auth/callback`
     - For production: `https://yourdomain.com/auth/callback` (when ready)
   - Click **"Save"**

---

### **STEP 4: Run the Database Trigger (One-Time)**

1. **Go to Supabase SQL Editor**
   - In Supabase Dashboard, go to **"SQL Editor"** (left sidebar)
   - Click **"New query"**

2. **Run the Trigger Script**
   - Open the file: `scripts/20_update_oauth_profile_trigger.sql`
   - Copy all the SQL code
   - Paste it into the SQL Editor
   - Click **"Run"** (or press Ctrl+Enter)
   - You should see: `✅ Trigger updated successfully`

---

### **STEP 5: Test It! 🎉**

1. **Start Your Development Server**
   ```bash
   npm run dev
   ```

2. **Test Google Sign-In**
   - Go to: `http://localhost:3000/auth/login`
   - Click **"Sign in with Google"** button
   - You should be redirected to Google
   - Sign in with your Google account
   - You'll be redirected back to your app

3. **Verify Profile Created**
   - In Supabase Dashboard, go to **"Table Editor"**
   - Open the **"profiles"** table
   - You should see your new profile with:
     - ✅ Email (from Google)
     - ✅ Full name (from Google)
     - ✅ Avatar URL (from Google profile picture)

---

## ✅ Checklist

Before testing, make sure:

- [ ] Google OAuth app created in Google Cloud Console
- [ ] Redirect URI added: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
- [ ] Client ID and Secret copied
- [ ] Google provider enabled in Supabase
- [ ] Client ID and Secret added to Supabase
- [ ] Redirect URLs configured in Supabase
- [ ] Database trigger script run (`scripts/20_update_oauth_profile_trigger.sql`)
- [ ] Development server running (`npm run dev`)

---

## 🐛 Common Issues & Fixes

### **Issue: "Failed to sign in with Google"**

**Fix:**
1. Double-check Client ID and Secret in Supabase
2. Verify redirect URI in Google Console matches exactly:
   - Must be: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - No trailing slashes!
3. Make sure OAuth consent screen is configured (you don't need Google+ API)

### **Issue: Redirect loop or error page**

**Fix:**
1. Check redirect URLs in Supabase → Authentication → URL Configuration
2. Make sure `http://localhost:3000/auth/callback` is added
3. Clear browser cookies and try again

### **Issue: Profile not created**

**Fix:**
1. Run the trigger script again: `scripts/20_update_oauth_profile_trigger.sql`
2. Check Supabase logs: Dashboard → Logs → API Logs
3. Verify RLS policies allow profile creation

---

## 📸 Visual Guide Locations

### In Supabase Dashboard:
- **Authentication** → **Providers** → **Google** (to enable and add credentials)
- **Authentication** → **URL Configuration** (to add redirect URLs)
- **SQL Editor** (to run trigger script)
- **Table Editor** → **profiles** (to verify data)

### In Google Cloud Console:
- **APIs & Services** → **Credentials** (to create OAuth client)
- **APIs & Services** → **Library** (to enable Google+ API)

---

## 🎯 What Happens When User Signs In

1. User clicks **"Sign in with Google"**
2. Redirects to Google OAuth page
3. User authorizes your app
4. Google redirects to: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
5. Supabase processes the OAuth code
6. Supabase redirects to: `http://localhost:3000/auth/callback`
7. Your app creates/updates profile in database
8. User is redirected to dashboard

---

## 🚀 You're All Set!

Once you complete Steps 1-4, Google Sign-In will work automatically!

---

## 🌐 Going to Production?

When you deploy your website with a domain name, you'll need to update a few URLs. 

**See the complete guide:** `GOOGLE_OAUTH_PRODUCTION_SETUP.md`

**Quick summary:**
- ✅ Add your domain to Google Cloud Console → JavaScript origins
- ✅ Update Supabase Dashboard → Site URL to your domain
- ✅ Add production callback URL to Supabase → Redirect URLs
- ⚠️ **Keep** the Supabase callback URL in Google redirect URIs (don't change it!)

---

**Need help?** Check the detailed guide: `docs/GOOGLE_OAUTH_SETUP.md`

