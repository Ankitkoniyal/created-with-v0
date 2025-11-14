# Security Quick Reference Guide

## 🔐 Current Security Status

### ✅ What's Protected

| Feature | Status | Protection Level |
|---------|--------|------------------|
| User Authentication | ✅ Active | High |
| Password Storage | ✅ Active | High (Bcrypt hashed) |
| Row Level Security | ✅ Active | High |
| HTTPS/SSL | ✅ Active | High |
| API Authorization | ✅ Active | High |
| Audit Logging | ✅ Active | Medium |
| Maintenance Mode | ✅ Active | Medium |
| Manual Backups | ✅ Active | Medium |
| Session Management | ✅ Active | Medium |

### ⚠️ What Needs Attention

| Feature | Status | Risk Level | Priority |
|---------|--------|------------|----------|
| Automated Backups | ❌ Not Setup | HIGH | Urgent |
| Rate Limiting | ❌ Not Implemented | HIGH | Urgent |
| CAPTCHA | ❌ Not Implemented | HIGH | High |
| Email Verification | ⚠️ Optional | MEDIUM | High |
| 2FA for Admins | ❌ Not Implemented | MEDIUM | Medium |
| Security Headers | ⚠️ Partial | MEDIUM | Medium |
| Input Sanitization | ⚠️ Partial | MEDIUM | Medium |
| Intrusion Detection | ❌ Not Implemented | LOW | Low |

---

## 🛡️ How Your Site is Protected from Hackers

### Layer 1: Infrastructure
```
Internet → Cloudflare (DDoS Protection) → Vercel (Edge Network) → Your App
                                                ↓
                                          Supabase (PostgreSQL + Auth)
```

### Layer 2: Authentication Flow
```
User Login → Supabase Auth → JWT Token → HttpOnly Cookie → API Requests
                                              ↓
                                    Verified on Every Request
```

### Layer 3: Database Security
```
API Request → Check JWT → Check User Role → Apply RLS Policies → Return Data
                              ↓
                    Only returns user's own data
                    (or all data if admin)
```

### Layer 4: Permissions

**Regular User Can:**
- ✅ View all public listings
- ✅ Create their own listings
- ✅ Edit/delete their own listings only
- ✅ Message other users
- ✅ Rate and comment on sellers
- ❌ View other users' private data
- ❌ Edit other users' content
- ❌ Access admin panel

**Super Admin Can:**
- ✅ Everything a user can do, plus:
- ✅ View all users
- ✅ Moderate all content
- ✅ Ban/unban users
- ✅ Access audit logs
- ✅ Download backups
- ✅ Change platform settings

---

## 💾 Backup & Recovery Summary

### Current Backup System

**Manual Backup** (Available Now)
- **How**: Super Admin Dashboard → Click "Backup Data"
- **Frequency**: Manual (you decide)
- **Storage**: Downloads to your computer
- **Recommendation**: Run weekly, store in 3 places

**Automated Backup** (Needs Setup)
- **Status**: Script provided, not configured
- **How**: Cron job or GitHub Actions
- **Frequency**: Can be daily/weekly
- **Storage**: Cloud (S3, GCS, Dropbox)
- **See**: `docs/BACKUP_SETUP.md` for setup instructions

### What's in the Backup?

✅ **Included:**
- All user profiles (no passwords)
- All listings/ads
- All messages
- All ratings & comments
- Categories
- Platform settings
- Audit logs (last 1000)
- Reports

❌ **Not Included:**
- Passwords (stored separately in Supabase Auth)
- Session tokens
- Uploaded images (stored in Supabase Storage separately)

### Where is Data Stored?

```
Primary: Supabase (PostgreSQL Database)
├── Location: AWS (encrypted at rest)
├── Backups: Automatic daily backups (7-30 days retention)
└── Images: Supabase Storage (S3-compatible)

Secondary: Vercel
├── Static files (CSS, JS)
├── API routes (serverless functions)
└── Build artifacts

Your Backups: Manual Downloads
├── Location: Your computer
└── Format: JSON files
```

---

## 🚨 Emergency Scenarios

### Scenario 1: Website is Down

**Symptoms:**
- Users can't access site
- 500/502/503 errors
- Blank pages

**Quick Fix:**
1. Check https://vercel-status.com
2. Check https://status.supabase.com
3. Check Vercel logs for errors
4. If needed: Rollback to previous deployment
5. Enable maintenance mode

**Commands:**
```bash
# Rollback in Vercel
vercel rollback

# Check logs
vercel logs
```

### Scenario 2: Database is Corrupted

**Symptoms:**
- Data looks wrong
- Missing records
- Duplicate entries
- Foreign key errors

**Quick Fix:**
1. Enable maintenance mode immediately
2. Stop all writes
3. Investigate via Supabase dashboard
4. Restore from backup:
   - Use Supabase PITR (if enabled)
   - Or restore from manual backup
5. Verify data integrity
6. Disable maintenance mode

**Recovery Time:**
- Via Supabase PITR: ~5-10 minutes
- Via manual backup: ~30-60 minutes

### Scenario 3: Hacked/Breached

**Symptoms:**
- Unauthorized admin access
- Suspicious audit log entries
- Unknown data changes
- User reports of weird behavior

**Immediate Actions (within 5 minutes):**
1. ✅ Enable maintenance mode
2. ✅ Change Supabase service role key
3. ✅ Change all admin passwords
4. ✅ Force logout all users (reset sessions)

**Follow-up Actions (within 1 hour):**
5. Review audit logs
6. Check for backdoors in code
7. Restore from clean backup (before breach)
8. Update all dependencies
9. Deploy security patches

**After Recovery:**
10. Notify affected users
11. Conduct security audit
12. Implement missing security measures
13. Monitor closely for 30 days

### Scenario 4: Accidental Data Deletion

**Symptoms:**
- Admin deleted wrong user/listing
- Bulk delete went wrong
- User complains data is missing

**Quick Fix:**
1. Check audit logs for deletion event
2. Find exact timestamp
3. Restore from backup:
   ```sql
   -- Restore specific user's data
   INSERT INTO products (...)
   SELECT * FROM backup_table
   WHERE user_id = 'deleted-user-id'
   ```
4. Notify user of restoration

**Prevention:**
- Implement soft deletes (status='deleted' instead of DELETE)
- Require confirmation for bulk actions
- Regular backups

---

## 🔑 Access Control

### Who Has Access to What?

**Super Admin (`owner` role)**
- Full database access
- Can backup data
- Can delete users
- Can change settings
- Can view all content

**Regular User**
- Own data only
- Public listings
- Messages they're part of
- Cannot access admin panel

### How to Create Super Admin

```sql
-- Run in Supabase SQL Editor
UPDATE profiles
SET role = 'owner'
WHERE email = 'admin@yourdomain.com';
```

**Warning:** Only give admin access to trusted individuals!

---

## 📊 Monitoring Checklist

### Daily
- [ ] Check error logs in Vercel
- [ ] Check for suspicious activity in audit logs
- [ ] Verify site is accessible
- [ ] Check automated backup ran (if configured)

### Weekly
- [ ] Run manual backup
- [ ] Review user reports
- [ ] Check disk space usage
- [ ] Review moderation queue

### Monthly
- [ ] Test backup restore procedure
- [ ] Review access logs
- [ ] Update dependencies (`npm audit fix`)
- [ ] Check for Supabase/Vercel updates
- [ ] Review and clean up old data

### Quarterly
- [ ] Full security audit
- [ ] Disaster recovery drill
- [ ] Review and update security docs
- [ ] Penetration testing (recommended)

---

## 🔧 Quick Commands

### Backup
```bash
# Manual backup (via UI)
1. Login to /superadmin
2. Click "Backup Data"
3. Save file safely

# Automated backup (once configured)
node scripts/automated-backup.js
```

### Restore
```bash
# Via Supabase dashboard
1. Go to Settings → Database → Backups
2. Select backup point
3. Click Restore

# Via script
node scripts/restore-backup.js backup-2025-11-13.json
```

### Enable Maintenance Mode
```sql
-- Run in Supabase SQL Editor
UPDATE platform_settings
SET maintenance_mode = true
WHERE id = 'global';

-- Disable
UPDATE platform_settings
SET maintenance_mode = false
WHERE id = 'global';
```

### Check Logs
```bash
# Vercel logs
vercel logs --follow

# Or via dashboard
https://vercel.com/your-project/logs
```

### Force Logout All Users
```sql
-- This doesn't directly logout users, but you can delete sessions
-- Users will need to re-authenticate on next request
-- Usually handled by changing JWT secret (Supabase side)
```

---

## 🛠️ Security Improvement Roadmap

### Week 1 (Urgent)
- [ ] Set up automated daily backups
- [ ] Implement rate limiting on API routes
- [ ] Add CAPTCHA to signup/login forms
- [ ] Enable email verification requirement

### Month 1 (Important)
- [ ] Add security headers (CSP, X-Frame-Options, etc.)
- [ ] Implement 2FA for admin accounts
- [ ] Set up monitoring/alerting (Sentry, LogRocket)
- [ ] Input sanitization with DOMPurify
- [ ] Vulnerability scanning (Snyk, Dependabot)

### Month 3 (Enhancement)
- [ ] Security audit by professional
- [ ] Penetration testing
- [ ] GDPR compliance features (data export/deletion)
- [ ] Advanced logging and monitoring
- [ ] Intrusion detection system

---

## 📞 Emergency Contacts

**Security Issues:**
- Email: security@yourdomain.com
- Phone: [Add phone number]

**Hosting Support:**
- Vercel: https://vercel.com/support
- Supabase: https://supabase.com/support

**DNS/Domain:**
- Your registrar support

---

## 📚 Key Documents

- **Full Security Guide**: `docs/SECURITY.md`
- **Backup Setup Guide**: `docs/BACKUP_SETUP.md`
- **Settings Status**: `docs/SETTINGS_STATUS.md`

---

## 💡 Quick Tips

1. **Always test on staging** before production changes
2. **Keep backups in 3 places**: Local, Cloud, Offline
3. **Review audit logs weekly** for suspicious activity
4. **Update dependencies monthly**: `npm audit fix`
5. **Test disaster recovery quarterly**
6. **Never commit secrets** to git
7. **Use strong passwords** (20+ characters)
8. **Enable 2FA** on all admin accounts
9. **Monitor uptime**: Use UptimeRobot or similar
10. **Document everything**: Future you will thank you

---

**Remember:** Security is not a one-time task, it's an ongoing process!

**Last Updated:** 2025-11-13  
**Version:** 1.0

