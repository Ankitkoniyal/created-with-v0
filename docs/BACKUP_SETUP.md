# Backup & Disaster Recovery Setup Guide

## 📦 Backup System Overview

Your application has two backup systems:

1. **Manual Backup** (✅ Currently Active)
   - Accessible from Super Admin dashboard
   - Click "Backup Data" button in sidebar
   - Downloads JSON file with all database data
   - Recommended: Run weekly minimum

2. **Automated Backup** (⚠️ Requires Setup)
   - Scheduled backups via cron job
   - Automatic cloud storage upload
   - Old backup cleanup
   - Email alerts on failure

---

## 🚀 Quick Start: Manual Backups

### How to Create a Manual Backup

1. **Login as Super Admin**
   - Navigate to `/superadmin`
   - Must have `owner` role

2. **Click "Backup Data"**
   - Located in the left sidebar (bottom)
   - Click the button with database icon

3. **Confirm & Download**
   - Confirm the backup action
   - JSON file downloads automatically
   - Filename format: `backup-YYYY-MM-DD.json`

4. **Store Safely**
   - Upload to cloud storage (Google Drive, Dropbox, etc.)
   - Keep at least 3 recent backups
   - Store in multiple locations

### Backup Contents

Your backup includes:
- ✅ User profiles (excluding passwords)
- ✅ All products/listings
- ✅ Categories
- ✅ Messages
- ✅ Ratings & comments
- ✅ Platform settings
- ✅ Reports
- ✅ Moderation logs
- ✅ Audit logs (last 1000 entries)
- ✅ Metadata (timestamp, statistics)

### What's NOT in Backup

- ❌ Passwords (stored hashed in Supabase Auth)
- ❌ Session tokens
- ❌ Uploaded images (stored in Supabase Storage)
- ❌ Full audit log history (only last 1000 entries)

---

## ⚙️ Setting Up Automated Backups

### Option 1: Using Vercel Cron Jobs (Recommended)

1. **Create API endpoint for scheduled backups**

Create `app/api/cron/backup/route.ts`:

```typescript
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Run backup logic
    const supabase = await createClient()
    
    // Fetch all data (same as manual backup)
    // ... backup logic ...
    
    // Upload to S3 or other storage
    await uploadToS3(backupData)
    
    return NextResponse.json({ success: true, timestamp: new Date() })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

2. **Configure in `vercel.json`**

```json
{
  "crons": [
    {
      "path": "/api/cron/backup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

3. **Add environment variable**

```env
CRON_SECRET=your-random-secret-key
```

### Option 2: Using GitHub Actions

Create `.github/workflows/backup.yml`:

```yaml
name: Automated Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Run daily at 2 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run backup script
        env:
          BACKUP_API_URL: ${{ secrets.BACKUP_API_URL }}
          ADMIN_EMAIL: ${{ secrets.ADMIN_EMAIL }}
          ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
        run: node scripts/automated-backup.js
      
      - name: Upload to S3
        uses: jakejarvis/s3-sync-action@master
        with:
          args: --acl private --follow-symlinks
        env:
          AWS_S3_BUCKET: ${{ secrets.AWS_S3_BUCKET }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          SOURCE_DIR: 'backups'
```

### Option 3: Using Supabase Native Backups

Supabase Pro/Team plans include automated backups:

1. **Enable Point-in-Time Recovery (PITR)**
   - Supabase Dashboard → Settings → Database
   - Enable PITR (requires Pro plan)
   - Allows restore to any point in the last 7 days

2. **Schedule Regular Snapshots**
   - Supabase Dashboard → Settings → Database → Backups
   - Manual or scheduled snapshots
   - Download as needed

### Option 4: Local Cron Job

1. **Install script**

```bash
npm install node-fetch
chmod +x scripts/automated-backup.js
```

2. **Configure environment**

Create `.env.backup`:

```env
BACKUP_API_URL=https://your-domain.com/api/admin/backup
BACKUP_DIR=/path/to/backups
BACKUP_RETENTION_DAYS=30
MAX_BACKUPS=10
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BACKUP_BUCKET=your-bucket
```

3. **Add to crontab**

```bash
crontab -e
```

Add line:

```
0 2 * * * cd /path/to/project && node scripts/automated-backup.js >> /var/log/backup.log 2>&1
```

---

## ☁️ Cloud Storage Setup

### AWS S3 (Recommended)

1. **Create S3 Bucket**

```bash
aws s3 mb s3://my-app-backups --region us-east-1
```

2. **Enable Versioning**

```bash
aws s3api put-bucket-versioning \
  --bucket my-app-backups \
  --versioning-configuration Status=Enabled
```

3. **Set Lifecycle Policy**

```json
{
  "Rules": [
    {
      "Id": "DeleteOldBackups",
      "Status": "Enabled",
      "Expiration": {
        "Days": 90
      }
    }
  ]
}
```

4. **Upload Backup**

```javascript
const AWS = require('aws-sdk')
const s3 = new AWS.S3()

await s3.upload({
  Bucket: 'my-app-backups',
  Key: `backups/backup-${Date.now()}.json`,
  Body: backupData,
  ServerSideEncryption: 'AES256'
}).promise()
```

### Google Cloud Storage

1. **Create Bucket**

```bash
gsutil mb gs://my-app-backups
```

2. **Enable Versioning**

```bash
gsutil versioning set on gs://my-app-backups
```

3. **Upload Backup**

```javascript
const { Storage } = require('@google-cloud/storage')
const storage = new Storage()

await storage.bucket('my-app-backups')
  .upload('backup.json', {
    destination: `backups/backup-${Date.now()}.json`,
    metadata: { contentType: 'application/json' }
  })
```

### Dropbox

1. **Create App** at https://www.dropbox.com/developers/apps

2. **Generate Access Token**

3. **Upload Backup**

```javascript
const fetch = require('node-fetch')

await fetch('https://content.dropboxapi.com/2/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${DROPBOX_TOKEN}`,
    'Content-Type': 'application/octet-stream',
    'Dropbox-API-Arg': JSON.stringify({
      path: `/backups/backup-${Date.now()}.json`,
      mode: 'add'
    })
  },
  body: backupData
})
```

---

## 🔄 Restore Process

### Method 1: Using Admin Dashboard UI (Recommended) ⭐

**The easiest way to restore your backup:**

1. **Login as Super Admin**
   - Navigate to `/superadmin/settings`
   - Must have `owner` or `super_admin` role

2. **Go to Backup & Restore Section**
   - Scroll down to the "Backup & Restore" section
   - Located at the bottom of the Settings page

3. **Select Your Backup File**
   - Click "Choose File" button
   - Select your backup JSON file (e.g., `backup-2025-11-13.json`)
   - The file name will appear below the input

4. **Review Warning**
   - Read the warning message carefully
   - ⚠️ **This will overwrite your current database**

5. **Click "Restore Backup"**
   - Confirm the restore action in the popup
   - Wait for the restore to complete
   - Progress will be shown on screen

6. **Verify Restore**
   - Check the success message
   - Review any error messages for failed tables
   - Test your website to ensure everything works

**What Happens During Restore:**
- All existing data is cleared (if `clearExisting: true`)
- Data is restored in dependency order (categories → profiles → products → etc.)
- New IDs are generated for most records (to avoid conflicts)
- Platform settings are preserved with original IDs
- Categories are preserved with original IDs

**Troubleshooting:**
- If some tables fail, check the error message
- Partial restores are possible (some tables succeed, others fail)
- Always create a backup before restoring!

---

### Method 2: Using API Endpoint (Advanced)

For programmatic restore or automated recovery:

1. **POST to Restore Endpoint**

```bash
curl -X POST https://your-domain.com/api/admin/backup/restore \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "backupData": {...},
    "options": {
      "clearExisting": true,
      "restoreTables": ["profiles", "products", "categories"]
    }
  }'
```

2. **JavaScript Example**

```javascript
const backup = require('./backup-2025-11-13.json')

const response = await fetch('/api/admin/backup/restore', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    backupData: backup,
    options: {
      clearExisting: true,
    },
  }),
})

const result = await response.json()
console.log('Restore result:', result)
```

---

### Method 3: Manual SQL Restore (Not Recommended)

⚠️ **Only use if UI restore fails** - This is more error-prone:

1. **Prepare Supabase**

```sql
-- In Supabase SQL Editor
-- WARNING: This will delete all existing data!

TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE profiles CASCADE;
TRUNCATE TABLE messages CASCADE;
-- ... etc
```

2. **Parse Backup File**

```javascript
const backup = require('./backup-2025-11-13.json')

console.log('Backup metadata:', backup.metadata)
console.log('Statistics:', backup.statistics)
console.log('Data keys:', Object.keys(backup.data))
```

3. **Restore Data**

Option A: Via Supabase Dashboard
- Go to Table Editor
- Click "Insert" → "Insert row"
- Paste JSON data

Option B: Via Script

Create `scripts/restore-backup.js`:

```javascript
const { createClient } = require('@supabase/supabase-js')
const backup = require('./backup-2025-11-13.json')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function restore() {
  // Restore profiles
  for (const profile of backup.data.profiles) {
    await supabase.from('profiles').insert(profile)
  }
  
  // Restore products
  for (const product of backup.data.products) {
    await supabase.from('products').insert(product)
  }
  
  // ... etc
}

restore()
```

4. **Verify Data**

```sql
-- Check counts
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM products;
-- etc
```

### Restoring from Supabase Backup

1. **Access Supabase Dashboard**
   - Settings → Database → Backups

2. **Select Backup**
   - Choose date/time
   - Click "Restore"

3. **Confirm**
   - WARNING: This will overwrite current database
   - Download current state first (manual backup)

---

## 🔔 Monitoring & Alerts

### Setup Email Alerts

1. **Using SendGrid**

```javascript
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

async function sendBackupAlert(status, error) {
  await sgMail.send({
    to: 'admin@yourdomain.com',
    from: 'backups@yourdomain.com',
    subject: `Backup ${status}: ${new Date().toISOString()}`,
    text: error ? `Error: ${error}` : 'Backup completed successfully'
  })
}
```

2. **Using Discord Webhook**

```javascript
async function sendDiscordAlert(message) {
  await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `🔔 **Backup Alert**\n${message}`
    })
  })
}
```

3. **Using Slack**

```javascript
async function sendSlackAlert(message) {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: message
    })
  })
}
```

### Health Check Endpoint

Create `app/api/health/backup/route.ts`:

```typescript
export async function GET() {
  const fs = require('fs').promises
  const backupDir = './backups'
  
  try {
    const files = await fs.readdir(backupDir)
    const backups = files.filter(f => f.startsWith('backup-'))
    
    if (backups.length === 0) {
      return NextResponse.json({
        status: 'warning',
        message: 'No backups found'
      })
    }
    
    const latest = backups.sort().reverse()[0]
    const stats = await fs.stat(`${backupDir}/${latest}`)
    const ageHours = (Date.now() - stats.mtime) / (1000 * 60 * 60)
    
    if (ageHours > 48) {
      return NextResponse.json({
        status: 'warning',
        message: `Latest backup is ${Math.round(ageHours)} hours old`
      })
    }
    
    return NextResponse.json({
      status: 'healthy',
      latest_backup: latest,
      age_hours: Math.round(ageHours)
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error.message
    })
  }
}
```

---

## 📋 Backup Checklist

### Daily
- [ ] Automated backup runs successfully
- [ ] No error alerts received
- [ ] Cloud storage upload confirmed

### Weekly
- [ ] Manual backup via dashboard (as redundancy)
- [ ] Verify latest backup file size is reasonable
- [ ] Check backup storage space

### Monthly
- [ ] Test restore procedure on staging environment
- [ ] Review and clean up old backups
- [ ] Audit backup logs for any issues
- [ ] Update backup documentation

### Quarterly
- [ ] Full disaster recovery drill
- [ ] Review backup retention policy
- [ ] Update backup access credentials
- [ ] Test all backup storage locations

---

## 🚨 Emergency Procedures

### If Website is Down

1. Check Vercel status: https://vercel-status.com
2. Check Supabase status: https://status.supabase.com
3. Check application logs in Vercel dashboard
4. Enable maintenance mode if needed
5. Investigate error logs
6. Restore from backup if database is corrupted

### If Database is Corrupted

1. **Immediate**: Enable maintenance mode
2. **Assess**: Check what data is affected
3. **Restore**: Use most recent backup
4. **Verify**: Test all critical functionality
5. **Monitor**: Watch for additional issues
6. **Document**: Record what happened and how it was fixed

### If Hacked

1. **Isolate**: Enable maintenance mode immediately
2. **Secure**: Change all passwords and API keys
3. **Investigate**: Check audit logs for breach
4. **Restore**: Use backup from before breach
5. **Patch**: Fix vulnerability that was exploited
6. **Notify**: Inform affected users if necessary
7. **Monitor**: Enhanced monitoring for 30 days

---

## 💡 Best Practices

1. **3-2-1 Rule**
   - Keep 3 copies of data
   - Store on 2 different media types
   - Keep 1 copy offsite

2. **Test Restores**
   - Backup without tested restore = no backup
   - Test monthly on staging environment

3. **Encrypt Backups**
   - Use AES-256 encryption
   - Secure key management
   - Different key from production database

4. **Version Backups**
   - Don't overwrite old backups
   - Keep multiple versions
   - Use timestamps in filenames

5. **Monitor Backup Size**
   - Track backup file size over time
   - Alert on sudden size changes
   - May indicate data corruption or attack

6. **Document Everything**
   - Backup procedures
   - Restore procedures
   - Access credentials (in secure location)
   - Contact information

---

## 📊 Backup Cost Estimation

### AWS S3 (per month)

- Storage: $0.023/GB (~$2.30 for 100GB)
- Versioning: Additional $0.023/GB per version
- Data transfer: $0.09/GB (outbound)
- **Estimated**: $5-10/month for small site

### Google Cloud Storage

- Standard storage: $0.020/GB (~$2 for 100GB)
- Nearline (30-day access): $0.010/GB (~$1 for 100GB)
- **Estimated**: $3-8/month for small site

### Dropbox Business

- $15/month for 3TB
- Unlimited versioning
- **Estimated**: $15/month (fixed)

---

## 🛠️ Troubleshooting

### Backup Button Not Working

1. Check browser console for errors
2. Verify you're logged in as super admin
3. Check `/api/admin/backup` endpoint directly
4. Review server logs in Vercel dashboard

### Backup File is Empty

1. Check RLS policies in Supabase
2. Verify service role key permissions
3. Check for database connection errors
4. Test API endpoint with curl

### Restore Failed

1. Check data format matches schema
2. Verify foreign key constraints
3. Disable RLS temporarily during restore
4. Restore tables in correct order (respect FK dependencies)

---

## 📞 Support

If you need help:

1. Check logs: Vercel dashboard → Your Project → Logs
2. Check Supabase logs: Dashboard → Logs
3. Review error messages carefully
4. Test on staging environment first
5. Contact support with detailed error info

---

**Remember**: The best backup strategy is one that's tested regularly!

**Last Updated:** 2025-11-13  
**Version:** 1.0

