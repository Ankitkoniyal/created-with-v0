# Next Steps: Auto-Approve Setup

## ✅ Step 1: SQL Migration - COMPLETED

The database migration has been run successfully. The following are now available:
- `auto_approve_delay_minutes` column in `platform_settings` table
- `scheduled_approvals` table (optional, for better tracking)

---

## 📋 Step 2: Configure Auto-Approve Settings

1. **Go to Super Admin Panel:**
   - Navigate to `/superadmin`
   - Click on **"Settings"** in the sidebar

2. **Enable Auto-Approve:**
   - Find **"Auto approve listings"** toggle
   - Turn it **ON** ✅

3. **Set Delay (if needed):**
   - **For immediate approval:** Set `Auto-approve delay (minutes)` to `0`
   - **For delayed approval:** Enter number of minutes (e.g., `60` for 1 hour, `120` for 2 hours)
   - Click **"Save settings"**

---

## ⚙️ Step 3: Set Up Cron Job (Only if using delayed approval)

### If delay = 0 (Immediate Approval)
**✅ No cron job needed!** Ads will be approved immediately when posted.

### If delay > 0 (Delayed Approval)
You need to set up a cron job to process scheduled approvals.

#### Option A: Vercel Cron (If deploying on Vercel) ✅ Already Created

I've created a `vercel.json` file with the cron configuration. After you deploy to Vercel:
- The cron job will automatically run every 5 minutes
- It will process all ads that are due for approval
- No additional setup needed!

**To activate:**
1. Commit and push `vercel.json` to your repository
2. Deploy to Vercel
3. Vercel will automatically set up the cron job

#### Option B: External Cron Service (If not using Vercel)

Use a free service like:
- **cron-job.org** - https://cron-job.org (free)
- **EasyCron** - https://www.easycron.com (free tier)
- **GitHub Actions** - If your repo is public

**Setup:**
1. Create account on cron service
2. Add new cron job:
   - **URL:** `https://yourdomain.com/api/admin/products/auto-approve`
   - **Method:** GET
   - **Schedule:** Every 5-15 minutes (e.g., `*/5 * * * *`)
   - **Save**

#### Option C: Manual Testing (For Development)

You can manually trigger the approval process:
```bash
# Using curl
curl https://yourdomain.com/api/admin/products/auto-approve

# Or visit in browser
https://yourdomain.com/api/admin/products/auto-approve
```

---

## 🧪 Step 4: Test the Feature

### Test Immediate Auto-Approval (Delay = 0)

1. **Enable auto-approve with delay = 0:**
   - Go to Settings
   - Enable "Auto approve listings"
   - Set delay to `0`
   - Save

2. **Post a test ad:**
   - Go to `/sell`
   - Fill out the form and submit
   - Check the ad status - it should be `active` immediately

3. **Verify:**
   - Check your dashboard listings - ad should show as "Active"
   - Check notifications - you should receive an approval notification
   - Check email (if configured) - you should receive approval email

### Test Delayed Auto-Approval (Delay > 0)

1. **Enable auto-approve with delay:**
   - Go to Settings
   - Enable "Auto approve listings"
   - Set delay to `1` (for testing - 1 minute)
   - Save

2. **Post a test ad:**
   - Go to `/sell`
   - Fill out the form and submit
   - Check the ad status - it should be `pending`

3. **Wait and trigger approval:**
   - Wait 1 minute
   - Manually call: `GET /api/admin/products/auto-approve`
   - Or wait for cron job to run (if set up)

4. **Verify:**
   - Check ad status - should now be `active`
   - Check notifications - you should receive approval notification
   - Check email (if configured) - you should receive approval email

---

## 🔍 Troubleshooting

### Settings not saving?
- Check browser console for errors
- Verify you're logged in as super admin
- Check that all database columns exist

### Ads not auto-approving immediately?
- Verify `auto_approve_ads` is `true` in settings
- Verify `auto_approve_delay_minutes` is `0`
- Check browser console for errors
- Check database - verify settings were saved

### Delayed approvals not working?
- Verify cron job is set up and running
- Check cron job logs
- Manually test the endpoint: `GET /api/admin/products/auto-approve`
- Check server logs for errors

### Notifications not sending?
- Verify notifications table exists
- Check user's email notification preferences
- Check server logs for notification errors

---

## 📊 Current Status

✅ **Database migration:** Complete  
✅ **Auto-approve code:** Implemented  
✅ **Settings UI:** Ready  
⏳ **Cron job:** Needs setup (only if using delayed approval)  
⏳ **Testing:** Ready to test  

---

## 🎯 Quick Start Checklist

- [x] Run SQL migration
- [ ] Configure auto-approve in Settings
- [ ] Set up cron job (if using delayed approval)
- [ ] Test immediate approval (delay = 0)
- [ ] Test delayed approval (delay > 0)
- [ ] Verify notifications are sent
- [ ] Verify emails are sent (if configured)

---

## 💡 Tips

1. **Start with immediate approval (delay = 0)** to test the feature quickly
2. **Use a short delay (1-5 minutes)** for initial testing
3. **Monitor the cron job** to ensure it's running correctly
4. **Check logs** if approvals aren't working as expected

You're all set! The feature is ready to use. 🚀

