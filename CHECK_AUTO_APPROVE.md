# How to Check if Auto-Approval is Working

## Quick Check Steps

### 1. Check Your Ad Status
Go to your dashboard and check:
- **My Listings** → Find the ad you just posted
- Status should show: **"Pending Review"** (if delay is set) or **"Active"** (if immediate)

### 2. Check Scheduled Approvals Table (SQL)
Run this in Supabase SQL Editor:

```sql
-- Check if your ad has a scheduled approval entry
SELECT 
  sa.*,
  p.title,
  p.status as product_status,
  p.created_at as ad_created_at,
  NOW() as current_time,
  CASE 
    WHEN sa.approval_time <= NOW() THEN 'READY TO APPROVE'
    ELSE 'WAITING'
  END as approval_status,
  EXTRACT(EPOCH FROM (sa.approval_time - NOW()))/60 as minutes_until_approval
FROM scheduled_approvals sa
JOIN products p ON sa.product_id = p.id
WHERE sa.processed = false
ORDER BY sa.approval_time;
```

### 3. Check Platform Settings
```sql
-- Verify auto-approve settings
SELECT 
  auto_approve_ads,
  auto_approve_delay_minutes
FROM platform_settings
WHERE id = 'global';
```

### 4. Check Product Status
```sql
-- Find your recent ad
SELECT 
  id,
  title,
  status,
  created_at,
  NOW() as current_time,
  EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_old
FROM products
WHERE user_id = 'YOUR_USER_ID'  -- Replace with your user ID
ORDER BY created_at DESC
LIMIT 5;
```

### 5. Manually Trigger Auto-Approve (For Testing)
If you want to test immediately, you can manually trigger the endpoint:

**In Browser Console or Postman:**
```javascript
// This will process all ready approvals
fetch('/api/admin/products/auto-approve?manual=true')
  .then(r => r.json())
  .then(console.log)
```

**Or use curl:**
```bash
curl "http://localhost:3000/api/admin/products/auto-approve?manual=true"
```

## Expected Behavior

### If Auto-Approve is Enabled with 5-minute Delay:
1. ✅ Ad is created with `status = "pending"`
2. ✅ Entry created in `scheduled_approvals` table
3. ✅ `approval_time` = current time + 5 minutes
4. ⏰ After 5 minutes, cron job runs
5. ✅ Ad status changes to `"active"`
6. ✅ `scheduled_approvals.processed` = `true`

### If Auto-Approve is Enabled with 0 Delay:
1. ✅ Ad is created with `status = "active"` immediately
2. ❌ No entry in `scheduled_approvals` table

### If Auto-Approve is Disabled:
1. ✅ Ad is created with `status = "pending"`
2. ❌ No entry in `scheduled_approvals` table
3. ⏰ Waits for manual admin approval

## Troubleshooting

### Ad Still Pending After Delay?
1. **Check cron job is running:**
   - Vercel Dashboard → Logs → Filter by `[Auto-Approve]`
   - Look for execution logs every 5 minutes

2. **Check CRON_SECRET:**
   - Vercel Dashboard → Settings → Environment Variables
   - Ensure `CRON_SECRET` is set

3. **Check scheduled_approvals:**
   - Verify entry exists
   - Check `approval_time` has passed
   - Verify `processed = false`

4. **Manual trigger:**
   - Use `?manual=true` to test immediately
   - Check response for errors

### No Scheduled Approval Entry?
- Check browser console for errors when posting ad
- Verify auto-approve settings are saved correctly
- Check if delay minutes > 0

## Quick SQL Queries

### Find All Pending Ads Ready for Approval
```sql
SELECT 
  p.id,
  p.title,
  p.status,
  p.created_at,
  sa.approval_time,
  NOW() as current_time,
  CASE 
    WHEN sa.approval_time <= NOW() THEN 'READY'
    ELSE 'WAITING'
  END as status
FROM products p
LEFT JOIN scheduled_approvals sa ON p.id = sa.product_id
WHERE p.status = 'pending'
  AND (sa.approval_time <= NOW() OR sa.approval_time IS NULL)
ORDER BY p.created_at;
```

### Check Recent Auto-Approvals
```sql
SELECT 
  sa.*,
  p.title,
  p.status
FROM scheduled_approvals sa
JOIN products p ON sa.product_id = p.id
WHERE sa.processed = true
ORDER BY sa.processed_at DESC
LIMIT 10;
```

