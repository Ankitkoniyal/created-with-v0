# Vercel Cron Job Setup Guide

## ✅ What's Already Done

1. **Serverless Function Created** ✅
   - Location: `app/api/admin/products/auto-approve/route.ts`
   - Method: `GET` (for cron job)
   - Handles: Auto-approving pending ads after delay

2. **Cron Job Configured** ✅
   - File: `vercel.json`
   - Path: `/api/admin/products/auto-approve`
   - Schedule: `*/5 * * * *` (every 5 minutes)

3. **Authorization Added** ✅
   - Added `CRON_SECRET` check for security
   - Manual testing still works with `?manual=true`

## 🔧 What You Need to Do in Vercel Dashboard

### Step 1: Enable Cron Jobs
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Cron Jobs**
3. Make sure the toggle is **Enabled** (should be blue/on)

### Step 2: Add CRON_SECRET Environment Variable
1. In Vercel Dashboard, go to **Settings** → **Environment Variables**
2. Click **Add New**
3. Add the following:
   - **Name:** `CRON_SECRET`
   - **Value:** Generate a secure random string (see below)
   - **Environments:** Select all (Production, Preview, Development)
   - Click **Save**

#### Generate a Secure Secret:
You can generate a secure secret using one of these methods:

**Option 1: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 2: Using OpenSSL**
```bash
openssl rand -hex 32
```

**Option 3: Online Generator**
- Visit: https://randomkeygen.com/
- Use a "CodeIgniter Encryption Keys" (256-bit)

**Example Secret:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### Step 3: Redeploy Your Project
After adding the environment variable:
1. Go to **Deployments** tab
2. Click **Redeploy** on your latest deployment
3. Or push a new commit to trigger automatic deployment

## 🧪 Testing the Cron Job

### Option 1: Manual Test (Local Development)
```bash
# Test without authorization (for local dev)
curl http://localhost:3000/api/admin/products/auto-approve?manual=true
```

### Option 2: Check Cron Job Logs (Production)
1. Go to Vercel Dashboard → **Logs**
2. Filter by: `[Auto-Approve]`
3. You should see logs like:
   ```
   [Auto-Approve] Processing scheduled approvals at 2025-11-23T10:20:00.000Z
   [Auto-Approve] Found 2 scheduled approvals ready to process
   [Auto-Approve] Successfully approved product abc123
   ```

### Option 3: Verify in Database
```sql
-- Check scheduled approvals
SELECT 
  sa.*,
  p.title,
  p.status,
  NOW() as current_time,
  CASE 
    WHEN sa.approval_time <= NOW() THEN 'READY'
    ELSE 'WAITING'
  END as status
FROM scheduled_approvals sa
JOIN products p ON sa.product_id = p.id
WHERE sa.processed = false
ORDER BY sa.approval_time;
```

## 📋 Cron Schedule Explained

Current schedule: `*/5 * * * *`

This means: **Every 5 minutes**

Cron format: `minute hour day month weekday`

- `*/5` = Every 5 minutes
- `*` = Every hour
- `*` = Every day
- `*` = Every month
- `*` = Every weekday

### Other Schedule Examples:
- `0 * * * *` = Every hour at minute 0
- `0 */2 * * *` = Every 2 hours
- `0 0 * * *` = Daily at midnight
- `0 0 * * 1` = Every Monday at midnight

## 🔒 Security Notes

1. **CRON_SECRET is Required**
   - Without it, anyone can call your cron endpoint
   - Vercel automatically adds the `Authorization` header when calling cron jobs
   - Manual testing bypasses this check with `?manual=true`

2. **Service Role Key**
   - The endpoint uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS
   - Make sure this is set in Vercel environment variables

3. **Rate Limiting**
   - Vercel cron jobs have rate limits
   - Free tier: Limited executions
   - Pro tier: More executions available

## 🐛 Troubleshooting

### Cron Job Not Running
1. **Check if enabled:** Settings → Cron Jobs → Toggle should be ON
2. **Check logs:** Deployments → Logs → Filter by cron
3. **Verify schedule:** Make sure `vercel.json` is correct
4. **Check environment variables:** Ensure `CRON_SECRET` is set

### Ads Not Auto-Approving
1. **Check scheduled_approvals table:** Verify entries exist
2. **Check approval_time:** Should be <= current time
3. **Check product status:** Should be "pending"
4. **Check logs:** Look for `[Auto-Approve]` messages
5. **Manual trigger:** Test with `?manual=true`

### Authorization Errors
- If you see "401 Unauthorized", check:
  - `CRON_SECRET` is set in Vercel
  - Value matches what's expected
  - Redeploy after adding the variable

## 📊 Monitoring

### View Cron Job Status
1. Go to **Settings** → **Cron Jobs**
2. You'll see a list of configured cron jobs
3. Click on a cron job to see execution history

### View Execution Logs
1. Go to **Deployments** → **Logs**
2. Filter by your cron endpoint path
3. Look for `[Auto-Approve]` log messages

## ✅ Checklist

- [ ] Cron Jobs enabled in Vercel dashboard
- [ ] `CRON_SECRET` environment variable added
- [ ] Project redeployed after adding secret
- [ ] `vercel.json` has cron configuration
- [ ] API route exists at `/api/admin/products/auto-approve`
- [ ] Authorization check is in place
- [ ] Tested manually with `?manual=true`
- [ ] Verified cron job runs in production logs

## 🎉 You're All Set!

Once you've completed these steps:
1. Post a new ad with auto-approve delay set (e.g., 5 minutes)
2. Wait for the cron job to run (every 5 minutes)
3. Check the logs to see if it was approved
4. Verify the ad status changed from "pending" to "active"

