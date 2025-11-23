# Auto-Approve Troubleshooting Guide

## Issue: Ads not auto-approving after delay

### How Auto-Approve Works

1. **When an ad is posted:**
   - If auto-approve is enabled with a delay, the ad is created with `status: "pending"`
   - A scheduled approval entry is created in the `scheduled_approvals` table
   - The entry contains `approval_time` = current time + delay minutes

2. **Cron Job Processing:**
   - Vercel cron job runs every 5 minutes (`*/5 * * * *`)
   - Calls `/api/admin/products/auto-approve` (GET method)
   - Finds all scheduled approvals where `approval_time <= now` and `processed = false`
   - Updates product status to `active`
   - Marks scheduled approval as `processed = true`

### Common Issues

#### 1. Cron Job Not Running (Development)
**Problem:** Cron jobs only run on Vercel production, not in local development.

**Solution:** Manually trigger the endpoint:
```bash
# In browser or Postman
GET http://localhost:3000/api/admin/products/auto-approve?manual=true
```

#### 2. Scheduled Approvals Not Created
**Check:** Verify entries exist in `scheduled_approvals` table:
```sql
SELECT * FROM scheduled_approvals 
WHERE processed = false 
ORDER BY approval_time;
```

**Fix:** Ensure the POST endpoint is being called when ads are created. Check browser console for errors.

#### 3. Approval Time Calculation Wrong
**Check:** Verify `approval_time` is correct:
```sql
SELECT 
  product_id,
  approval_time,
  NOW() as current_time,
  approval_time <= NOW() as should_approve
FROM scheduled_approvals 
WHERE processed = false;
```

#### 4. Products Not Found
**Check:** Verify products still exist and are pending:
```sql
SELECT p.id, p.status, p.created_at, sa.approval_time
FROM products p
LEFT JOIN scheduled_approvals sa ON p.id = sa.product_id
WHERE p.status = 'pending'
ORDER BY p.created_at;
```

### Manual Testing

1. **Post an ad with auto-approve delay set to 5 minutes**
2. **Check scheduled_approvals table:**
   ```sql
   SELECT * FROM scheduled_approvals WHERE processed = false;
   ```
3. **Manually trigger approval (for testing):**
   ```bash
   curl http://localhost:3000/api/admin/products/auto-approve?manual=true
   ```
4. **Check if product was approved:**
   ```sql
   SELECT id, title, status FROM products WHERE id = '<product_id>';
   ```

### Debugging Steps

1. **Check platform settings:**
   ```sql
   SELECT auto_approve_ads, auto_approve_delay_minutes 
   FROM platform_settings 
   WHERE id = 'global';
   ```

2. **Check scheduled approvals:**
   ```sql
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

3. **Check cron job logs:**
   - In Vercel dashboard: Go to your project → Cron Jobs → View logs
   - Look for `[Auto-Approve]` log messages

4. **Manual trigger response:**
   ```json
   {
     "success": true,
     "approved": 1,
     "failed": 0,
     "approvedIds": ["product-id-here"],
     "failedIds": []
   }
   ```

### Fixes Applied

1. ✅ Improved error handling in GET endpoint
2. ✅ Added comprehensive logging
3. ✅ Better fallback logic if scheduled_approvals table has issues
4. ✅ Added manual trigger option (`?manual=true`)
5. ✅ Verify product status before updating
6. ✅ Mark as processed even if product already approved

### Next Steps

If ads still aren't auto-approving:

1. **Check Vercel cron job is enabled:**
   - Go to Vercel dashboard
   - Check if cron job is configured and running
   - View cron job logs for errors

2. **Verify database permissions:**
   - Ensure service role key has access to `scheduled_approvals` table
   - Check RLS policies allow service role access

3. **Test manually:**
   - Call the GET endpoint manually
   - Check response for errors
   - Review console logs

4. **Check timezone issues:**
   - Ensure database timezone matches application timezone
   - Verify `approval_time` is stored in UTC

