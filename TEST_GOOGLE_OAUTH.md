# 🧪 Testing Google OAuth - Step by Step

## ✅ Setup Complete! Now Let's Test

Follow these steps to verify everything is working:

---

## 📋 Pre-Test Checklist

Before testing, make sure you have:

- [ ] ✅ Google OAuth app created in Google Cloud Console
- [ ] ✅ Client ID and Secret added to Supabase
- [ ] ✅ Redirect URLs configured in Supabase
- [ ] ✅ Database trigger script run (`scripts/20_update_oauth_profile_trigger.sql`)
- [ ] ✅ Development server ready to start

---

## 🚀 Step 1: Start Your Development Server

```bash
npm run dev
```

Wait for it to start - you should see:
```
✓ Ready in X seconds
○ Local: http://localhost:3000
```

---

## 🧪 Step 2: Test Google Sign-In

1. **Open your browser**
   - Go to: `http://localhost:3000/auth/login`
   - Or: `http://localhost:3000/auth/signup`

2. **Look for the Google button**
   - You should see: **"Sign in with Google"** or **"Sign up with Google"**
   - It should be below the regular form
   - Has a Chrome icon and red Google colors

3. **Click the Google button**
   - Button should show "Connecting..." briefly
   - You should be redirected to Google's sign-in page

4. **Sign in with Google**
   - Select your Google account
   - Click "Allow" or "Continue" to authorize
   - You should be redirected back to your app

5. **Check the redirect**
   - You should be redirected to `/dashboard` or `/superadmin` (if you're super admin)
   - You should be logged in!

---

## ✅ Step 3: Verify Profile Created

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com
   - Select your project

2. **Check the profiles table**
   - Go to **"Table Editor"** → **"profiles"**
   - You should see a new row with:
     - ✅ **Email**: Your Google email
     - ✅ **Full name**: Your Google account name
     - ✅ **Avatar URL**: Your Google profile picture URL
     - ⚠️ **Phone**: NULL (Google doesn't provide this)

3. **Verify the data**
   - Check `created_at` - should be recent
   - Check `avatar_url` - should be a Google profile picture URL
   - Check `email` - should match your Google account

---

## 🐛 Troubleshooting

### Issue: Button doesn't appear

**Check:**
1. Make sure you're on `/auth/login` or `/auth/signup`
2. Check browser console for errors (F12 → Console)
3. Verify the component files were saved correctly

**Fix:**
- Restart your dev server: `npm run dev`
- Clear browser cache and refresh

---

### Issue: "Failed to sign in with Google"

**Check:**
1. Verify Client ID and Secret in Supabase Dashboard
2. Check redirect URI in Google Console matches exactly:
   - Must be: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
3. Check OAuth consent screen is configured

**Fix:**
- Double-check credentials in Supabase → Authentication → Providers → Google
- Verify redirect URI in Google Cloud Console → Credentials

---

### Issue: Redirect loop or error page

**Check:**
1. Verify redirect URLs in Supabase:
   - Go to: Authentication → URL Configuration
   - Make sure `http://localhost:3000/auth/callback` is added
2. Check browser console for errors

**Fix:**
- Add the redirect URL in Supabase if missing
- Clear browser cookies and try again

---

### Issue: Profile not created

**Check:**
1. Run the trigger script again:
   - Go to Supabase → SQL Editor
   - Run: `scripts/20_update_oauth_profile_trigger.sql`
2. Check Supabase logs:
   - Go to: Logs → API Logs
   - Look for any errors

**Fix:**
- Re-run the trigger script
- Check RLS policies allow profile creation

---

### Issue: Stuck on "Connecting..."

**Check:**
1. Check browser console for errors
2. Verify Google OAuth is enabled in Supabase
3. Check network tab (F12 → Network) for failed requests

**Fix:**
- Make sure Google provider is enabled in Supabase
- Check Client ID and Secret are correct
- Try in an incognito/private window

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Google button appears on login/signup page
2. ✅ Clicking button redirects to Google
3. ✅ After Google sign-in, you're redirected back to your app
4. ✅ You're logged in and redirected to dashboard
5. ✅ Profile appears in Supabase `profiles` table with:
   - Email from Google
   - Name from Google
   - Avatar URL from Google

---

## 🎯 Next Steps After Testing

Once everything works:

1. **Test with different Google accounts**
   - Try signing in with different Google accounts
   - Verify each creates a separate profile

2. **Test the full flow**
   - Sign up with Google
   - Sign out
   - Sign in with Google (same account)
   - Verify it uses existing profile

3. **Check profile updates**
   - Sign in with Google
   - Check if profile updates if you change your Google name/picture

4. **Prepare for production**
   - When ready, follow: `GOOGLE_OAUTH_PRODUCTION_SETUP.md`
   - Add production domain URLs

---

## 📞 Still Having Issues?

If you're stuck:

1. **Check the logs:**
   - Browser console (F12)
   - Supabase Dashboard → Logs → API Logs

2. **Verify setup:**
   - Re-check all steps in `GOOGLE_OAUTH_QUICK_START.md`
   - Make sure no steps were skipped

3. **Common mistakes:**
   - Wrong redirect URI in Google Console
   - Missing redirect URL in Supabase
   - Trigger script not run
   - Client ID/Secret mismatch

---

## 🎉 You're Ready!

Once testing passes, Google OAuth is fully configured and working!

