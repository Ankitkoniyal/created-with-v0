# Restore Guide - Quick Start

## 🎯 How to Restore Your Website from Backup

### ⚡ Quick Answer

**You have TWO ways to restore:**

1. **Via Admin Dashboard** (Easiest - Recommended) ✅
2. **Git Repository** (Only for code, not data) ⚠️

---

## 📦 Understanding What Gets Restored

### What's in Your Backup JSON File?
- ✅ **Database Data**: Users, products, messages, ratings, comments
- ✅ **Settings**: Platform configuration
- ✅ **Content**: All your listings and user-generated content

### What's NOT in Your Backup?
- ❌ **Website Code**: This is in Git repository
- ❌ **Uploaded Images**: Stored separately in Supabase Storage
- ❌ **Passwords**: Hashed and stored in Supabase Auth (not restorable)

### What Does Git Repository Contain?
- ✅ **Website Code**: All your source code, components, pages
- ✅ **Configuration Files**: `package.json`, `next.config.mjs`, etc.
- ❌ **Database Data**: NOT stored in Git
- ❌ **User Content**: NOT stored in Git

---

## 🔄 Method 1: Restore via Admin Dashboard (Recommended)

### Step-by-Step:

1. **Login to Admin Panel**
   ```
   Go to: https://your-website.com/superadmin/settings
   ```

2. **Find "Backup & Restore" Section**
   - Scroll to the bottom of the Settings page
   - Look for the "Backup & Restore" card with database icon

3. **Upload Backup File**
   - Click "Choose File" button
   - Select your downloaded backup JSON file
   - File name will appear: "Selected: backup-2025-11-13.json"

4. **Confirm Restore**
   - Click orange "Restore Backup" button
   - Read the warning carefully
   - Confirm "OK" in the popup dialog

5. **Wait for Restore**
   - Progress will show: "Reading backup file..." → "Uploading backup data..."
   - This may take 1-5 minutes depending on data size
   - Don't close the browser tab!

6. **Verify Success**
   - Green success message: "Restore Successful"
   - Check the message for details (e.g., "Restored 1,234 records")
   - Refresh your website to test

### What Happens:
```
Upload File → Validate JSON → Clear Old Data → Restore Tables → Success!
```

### Safety Features:
- ✅ Validates backup file format
- ✅ Shows progress updates
- ✅ Displays error messages if something fails
- ✅ Warns before overwriting data
- ✅ Generates new IDs to avoid conflicts

---

## 🔧 Method 2: Using Git Repository

**Important:** Git only restores your **CODE**, not your **DATA**!

### When to Use Git:
- ✅ Website code was lost or corrupted
- ✅ Need to revert to previous code version
- ✅ Deployment failed
- ❌ Database data is lost (use backup JSON instead)

### How to Restore from Git:

1. **Clone/Download Repository**
   ```bash
   git clone https://github.com/your-username/your-repo.git
   cd your-repo
   ```

2. **Checkout Specific Version** (if needed)
   ```bash
   git checkout <commit-hash>
   # or
   git checkout main
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Deploy to Vercel**
   - Push to Git, or
   - Deploy via Vercel dashboard

**Result:** Your website code is restored, but database still empty!

---

## 🚨 Complete Website Recovery (Code + Data)

If you lost **everything** (code AND data):

### Step 1: Restore Code from Git
```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
npm install
# Deploy to Vercel
```

### Step 2: Restore Data from Backup
1. Login to `/superadmin/settings`
2. Upload backup JSON file
3. Click "Restore Backup"
4. Wait for completion

### Step 3: Restore Images (if needed)
- Images are in Supabase Storage
- If lost, they're NOT in backup JSON
- Need separate backup of Supabase Storage bucket

---

## ❓ FAQ

### Q: Do I need both Git and Backup JSON?
**A:** 
- **Git** = Website code (usually safe, can re-deploy)
- **Backup JSON** = Database data (users, listings, etc.)
- You need **both** for complete recovery

### Q: Can I restore just one table?
**A:** Not via UI, but you can use the API with `restoreTables` option:
```javascript
{
  "backupData": {...},
  "options": {
    "restoreTables": ["products"]  // Only restore products
  }
}
```

### Q: What if restore fails?
**A:** 
1. Check error message in the UI
2. Try again (sometimes network issues)
3. Use Supabase dashboard to restore from their automatic backups
4. Contact support if persistent

### Q: Can I restore to a different database?
**A:** Yes! Update your environment variables to point to a new Supabase project, then restore.

### Q: Will restore delete my current data?
**A:** Yes, if `clearExisting: true` (default in UI). Always backup before restoring!

### Q: What if I lose the backup file?
**A:** 
- Check Supabase automatic backups (Dashboard → Settings → Database → Backups)
- Check your cloud storage (Google Drive, Dropbox, etc.)
- Check your local computer's Downloads folder
- Use Supabase Point-in-Time Recovery (if enabled)

---

## 📋 Pre-Restore Checklist

Before restoring, make sure you have:

- [ ] Current backup (in case restore fails)
- [ ] Backup JSON file downloaded
- [ ] Super admin access
- [ ] Time to wait (1-5 minutes)
- [ ] Notification system disabled (optional, to avoid spam)

---

## ⚠️ Important Warnings

1. **Backup Before Restore**: Always create a new backup before restoring!
2. **Test on Staging First**: If possible, test restore on a staging environment
3. **Maintenance Mode**: Consider enabling maintenance mode during restore
4. **User Communication**: Notify users if restoring during business hours
5. **Verify After Restore**: Always test critical functionality after restore

---

## 🆘 Emergency Recovery

If your website is completely down:

1. **Check Status Pages**
   - Vercel: https://vercel-status.com
   - Supabase: https://status.supabase.com

2. **Deploy Fresh Code** (if code lost)
   ```bash
   git clone <your-repo>
   vercel deploy
   ```

3. **Restore Database** (if data lost)
   - Login to admin panel
   - Upload backup JSON
   - Restore data

4. **Verify Everything Works**
   - Test login
   - Test creating listing
   - Check key pages

---

## 📞 Need Help?

If restore doesn't work:

1. Check error messages carefully
2. Verify backup file is valid JSON
3. Check browser console for errors
4. Review server logs in Vercel dashboard
5. Try restoring one table at a time via API

---

**Remember:** Your backup JSON contains your data. Git contains your code. You need BOTH for complete website recovery!

**Last Updated:** 2025-11-13  
**Version:** 1.0

