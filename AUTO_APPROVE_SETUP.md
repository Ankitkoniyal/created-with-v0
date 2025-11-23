# Auto-Approve Setup Guide

## Overview

The auto-approve feature allows you to automatically approve ads without manual review. You can set a time delay (in minutes) before ads are approved.

## Features

✅ **Immediate Auto-Approval** - Set delay to 0 minutes for instant approval  
✅ **Delayed Auto-Approval** - Set delay in minutes (e.g., 60 for 1 hour)  
✅ **Automatic Notifications** - Users receive notifications when ads are approved  
✅ **Email Notifications** - Users receive email when ads are auto-approved (if configured)  

## Setup Instructions

### 1. Run Database Migration

Run the SQL script to add the required columns and table:

```sql
-- Run this in your Supabase SQL editor
\i scripts/45_add_auto_approve_delay.sql
```

Or manually run:
```sql
ALTER TABLE platform_settings 
ADD COLUMN IF NOT EXISTS auto_approve_delay_minutes INTEGER DEFAULT NULL;
```

### 2. Configure Auto-Approve in Settings

1. Go to **Super Admin** > **Settings**
2. Find **"Auto approve listings"** toggle
3. Enable it
4. Set **"Auto-approve delay (minutes)"**:
   - `0` = Immediate approval (ads are approved as soon as posted)
   - `60` = 1 hour delay
   - `120` = 2 hours delay
   - etc.

### 3. Set Up Cron Job (For Delayed Approval)

If you're using delayed auto-approval (delay > 0), you need to set up a cron job to process scheduled approvals.

#### Option A: Using Vercel Cron (Recommended)

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/admin/products/auto-approve",
      "schedule": "*/5 * * * *"
    }
  ]
}
```
This runs every 5 minutes. Adjust schedule as needed.

#### Option B: Using External Cron Service

Use a service like:
- **cron-job.org** (free)
- **EasyCron** (free tier available)
- **GitHub Actions** (free for public repos)

Set up a cron job to call:
```
GET https://yourdomain.com/api/admin/products/auto-approve
```

Recommended frequency: Every 5-15 minutes

#### Option C: Using Supabase Edge Functions + pg_cron

If you're using Supabase, you can set up a database function:

```sql
-- Create function to process auto-approvals
CREATE OR REPLACE FUNCTION process_auto_approvals()
RETURNS void AS $$
DECLARE
  product_record RECORD;
  delay_minutes INTEGER;
BEGIN
  -- Get delay setting
  SELECT auto_approve_delay_minutes INTO delay_minutes
  FROM platform_settings
  WHERE id = 'global' AND auto_approve_ads = true;
  
  IF delay_minutes IS NULL OR delay_minutes = 0 THEN
    RETURN; -- No delay or auto-approve disabled
  END IF;
  
  -- Find products that should be approved
  FOR product_record IN
    SELECT id, title, user_id, created_at
    FROM products
    WHERE status = 'pending'
      AND created_at <= NOW() - (delay_minutes || ' minutes')::INTERVAL
  LOOP
    -- Update status
    UPDATE products
    SET status = 'active', updated_at = NOW()
    WHERE id = product_record.id;
    
    -- Send notification (you can add this logic)
    -- INSERT INTO notifications ...
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron (if enabled)
SELECT cron.schedule(
  'process-auto-approvals',
  '*/5 * * * *', -- Every 5 minutes
  $$SELECT process_auto_approvals()$$
);
```

## How It Works

### Immediate Auto-Approval (Delay = 0)
1. User posts an ad
2. System checks `auto_approve_ads` setting
3. If enabled and delay = 0, ad status is set to `"active"` immediately
4. User receives notification and email (if configured)

### Delayed Auto-Approval (Delay > 0)
1. User posts an ad
2. System checks `auto_approve_ads` setting
3. If enabled with delay > 0:
   - Ad status remains `"pending"`
   - Approval is scheduled via `/api/admin/products/auto-approve` endpoint
4. Cron job calls the endpoint periodically
5. Endpoint checks for ads that should be approved
6. Approved ads are updated to `"active"`
7. Users receive notifications and emails

## Testing

1. **Test Immediate Approval:**
   - Enable auto-approve
   - Set delay to 0
   - Post an ad
   - Verify it's immediately active

2. **Test Delayed Approval:**
   - Enable auto-approve
   - Set delay to 1 minute (for testing)
   - Post an ad
   - Wait 1 minute
   - Call `/api/admin/products/auto-approve` endpoint
   - Verify ad is approved

## Troubleshooting

### Ads not auto-approving immediately
- Check that `auto_approve_ads` is enabled in settings
- Check that `auto_approve_delay_minutes` is set to 0
- Check browser console for errors
- Verify database has the `auto_approve_delay_minutes` column

### Delayed approvals not working
- Verify cron job is set up and running
- Check cron job logs for errors
- Verify `/api/admin/products/auto-approve` endpoint is accessible
- Check database for `scheduled_approvals` table (optional, fallback works without it)

### Settings not saving
- Check browser console for errors
- Verify you have super admin permissions
- Check database connection
- Ensure all required columns exist in `platform_settings` table

## Notes

- The system works even without the `scheduled_approvals` table (uses fallback method)
- Notifications are sent automatically when ads are approved
- Email notifications require email service configuration (see EMAIL_SETUP_GUIDE.md)
- The cron job should run frequently (every 5-15 minutes) for best results

