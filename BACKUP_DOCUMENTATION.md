# Backup & Restore Documentation

## Overview

This document explains how to create complete backups of your marketplace data, including database tables and Storage files.

---

## Database Backup

### Creating a Backup

1. **Via Super Admin Panel:**
   - Navigate to Super Admin → Settings → Backup
   - Click "Download Backup"
   - A JSON file will be downloaded containing all database tables

2. **Via API:**
   ```bash
   GET /api/admin/backup
   ```
   Requires super admin authentication.

### What's Included

The backup includes:
- ✅ `profiles` - User profiles
- ✅ `products` - All ads/listings
- ✅ `categories` - Category definitions
- ✅ `messages` - User messages
- ✅ `favorites` - User favorites
- ✅ `user_ratings` - Ratings and reviews
- ✅ `platform_settings` - Platform configuration
- ✅ `reported_ads` - Reported content
- ✅ `moderation_logs` - Moderation history
- ✅ `audit_logs` - Admin action logs
- ✅ `storage_manifest` - List of all Storage files with URLs

### What's NOT Included

- ❌ **Supabase Auth Users** (`auth.users` table) - Must be backed up separately via Supabase Dashboard
- ❌ **Storage Files** (actual image files) - Only file manifest is included

---

## Storage Backup

### Storage File Manifest

The database backup includes a `storage_manifest` object that lists all files in:
- `product-images` bucket
- `avatars` bucket

Each file entry includes:
- File name and path
- Creation/update timestamps
- Public URL
- File size and MIME type

### Downloading Storage Files

**Option 1: Via API Endpoint**
```bash
GET /api/admin/backup/download-storage?bucket=product-images
```
This returns a JSON manifest with download URLs for all files.

**Option 2: Via Supabase CLI** (Recommended for large backups)
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Download bucket
supabase storage download product-images --project-ref YOUR_PROJECT_REF
```

**Option 3: Direct S3 Access**
If you have S3 credentials, you can access Storage directly via S3 API.

---

## Supabase Auth Users Backup

**⚠️ CRITICAL:** The `auth.users` table is NOT included in the database backup due to Supabase security restrictions.

### Manual Backup Process

1. **Via Supabase Dashboard:**
   - Go to Authentication → Users
   - Export users (if available in your plan)
   - Or use Supabase CLI:
     ```bash
     supabase db dump --data-only -t auth.users > auth_users_backup.sql
     ```

2. **Via Supabase Management API:**
   - Use the Admin API to list all users
   - Save user metadata and identities
   - Note: Passwords cannot be exported (users will need to reset)

### Restore Auth Users

1. **Via Supabase Dashboard:**
   - Import users from backup
   - Users will need to reset passwords

2. **Via Supabase CLI:**
   ```bash
   supabase db restore auth_users_backup.sql
   ```

---

## Restore Process

### Database Restore

1. **Via Super Admin Panel:**
   - Navigate to Super Admin → Settings → Backup
   - Click "Restore Backup"
   - Upload your backup JSON file
   - Choose restore options:
     - Clear existing data (optional)
     - Select tables to restore (optional)
   - Click "Restore"

2. **Via API:**
   ```bash
   POST /api/admin/backup/restore
   Content-Type: application/json
   
   {
     "backupData": { ... },
     "options": {
       "clearExisting": false,
       "restoreTables": ["profiles", "products"]
     }
   }
   ```

### Storage Restore

**Important:** Storage files are referenced by URLs in the `products` table. If files are deleted from Storage:

1. **If files still exist at URLs:**
   - No action needed - URLs in database will still work

2. **If files are deleted:**
   - You need to re-upload files from your backup
   - Use the `storage_manifest` from backup to identify missing files
   - Re-upload files to match the original paths

**Manual Restore Process:**
```bash
# Using Supabase CLI
supabase storage upload product-images /path/to/backup/images
```

---

## Backup Best Practices

### 1. Regular Backups
- **Daily:** For production systems
- **Before major updates:** Always backup before deploying changes
- **Before bulk operations:** Backup before deleting/updating large datasets

### 2. Backup Storage
- Store backups in multiple locations:
  - Local storage
  - Cloud storage (S3, Google Drive, etc.)
  - Version control (for settings only, never commit user data)

### 3. Backup Verification
- Test restore process periodically
- Verify backup file integrity
- Check that all tables are included

### 4. Security
- **Never commit backups to Git** - Contains sensitive user data
- Encrypt backups containing PII
- Use secure storage for backup files
- Limit access to backup files

### 5. Complete Backup Checklist

Before considering a backup "complete", ensure you have:

- [ ] Database backup JSON file
- [ ] Storage file manifest (included in backup)
- [ ] Storage files downloaded (via CLI or API)
- [ ] Auth users exported (via Supabase Dashboard)
- [ ] Platform settings documented
- [ ] Environment variables documented (separately, never in backup)

---

## Automated Backups

### Setting Up Scheduled Backups

**Option 1: Vercel Cron Job**
```javascript
// vercel.json
{
  "crons": [
    {
      "path": "/api/admin/backup",
      "schedule": "0 2 * * *" // Daily at 2 AM
    }
  ]
}
```

**Option 2: External Cron Service**
- Use services like cron-job.org
- Call `/api/admin/backup` endpoint
- Store backups in cloud storage

**Option 3: Supabase Database Backups**
- Enable automatic backups in Supabase Dashboard
- This backs up the entire database (including auth.users)
- Requires Supabase Pro plan or higher

---

## Troubleshooting

### Backup Fails
- Check admin permissions
- Verify service role key is set
- Check database connectivity
- Review error logs

### Restore Fails
- Check foreign key constraints
- Verify table schemas match
- Check for duplicate IDs
- Review restore logs

### Storage Files Missing
- Check Storage bucket permissions
- Verify file paths in manifest
- Check if files were deleted
- Re-upload from backup if needed

---

## Support

For backup/restore issues:
1. Check Supabase Dashboard logs
2. Review API error responses
3. Consult Supabase documentation
4. Contact support if needed

---

**Last Updated:** December 2024  
**Version:** 2.0

