# Security Documentation

## 🔒 Current Security Measures

### 1. **Authentication & Authorization**

#### Supabase Authentication
- **Provider**: Supabase Auth (built on PostgreSQL)
- **Session Management**: JWT tokens with automatic refresh
- **Cookie Security**: HttpOnly, Secure, SameSite cookies
- **Password Requirements**: Enforced by Supabase (minimum 6 characters)

#### Role-Based Access Control (RBAC)
- **User Roles**: `user`, `owner` (superadmin)
- **Implementation**: Database-level role checks in RLS policies
- **Middleware Protection**: Routes protected at middleware level

```typescript
// Example: lib/utils/role-check.ts
export async function isSuperAdmin(userId: string): Promise<boolean>
```

### 2. **Row Level Security (RLS)**

All database tables have RLS enabled with specific policies:

#### Products Table
- ✅ Anyone can view products (public listings)
- ✅ Users can only insert their own products
- ✅ Users can only update/delete their own products
- ✅ Admins can moderate all products

#### Profiles Table
- ✅ Anyone can view profiles (public info)
- ✅ Users can only update their own profile
- ✅ Owners can access all profiles

#### Messages Table
- ✅ Users can only read messages they sent or received
- ✅ Users can only send messages they author

#### Ratings & Comments
- ✅ Anyone can view ratings/comments
- ✅ Only authenticated users can create ratings/comments
- ✅ Users can only edit/delete their own ratings/comments

#### Storage (Images)
- ✅ Public read access for product images
- ✅ Only authenticated users can upload
- ✅ Users can only delete their own images
- ✅ Folder-based isolation (user_id as folder name)

### 3. **API Security**

#### Authentication Checks
```typescript
// Every admin API route checks authentication
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
```

#### Admin Authorization
```typescript
// Admin-only endpoints verify owner role
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single()

if (profile?.role !== "owner") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}
```

#### Rate Limiting
⚠️ **NOT IMPLEMENTED** - Recommended to add

### 4. **Environment Security**

#### Environment Variables
- ✅ Sensitive keys stored in `.env.local` (git-ignored)
- ✅ Public keys use `NEXT_PUBLIC_` prefix
- ✅ Service role key never exposed to client

**Required Environment Variables:**
```env
# Public (safe for client)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Private (server-only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 5. **Input Validation & Sanitization**

#### Database Level
- ✅ CHECK constraints on ratings (1-5)
- ✅ Length constraints on text fields
- ✅ Foreign key constraints
- ✅ NOT NULL constraints on critical fields

#### Application Level
- ✅ Type checking with TypeScript
- ✅ Zod/validation on form inputs
- ⚠️ XSS prevention (partial - needs improvement)
- ⚠️ SQL injection prevention (Supabase handles this)

### 6. **Data Protection**

#### Encryption
- ✅ **In Transit**: HTTPS/TLS for all connections
- ✅ **At Rest**: Supabase encrypts database at rest
- ✅ **Passwords**: Bcrypt hashing (Supabase managed)

#### Sensitive Data Handling
- ✅ Passwords never stored in plain text
- ✅ Session tokens stored in HttpOnly cookies
- ⚠️ User emails visible to admins (necessary for management)
- ⚠️ Phone numbers not encrypted (consider encryption)

### 7. **Backup & Recovery**

#### Current Backup System
- ✅ **Manual Backup**: Admin can download full database backup via UI
- ✅ **Backup Location**: `/api/admin/backup` endpoint
- ✅ **Backup Format**: JSON file with timestamp
- ✅ **Backup Contents**:
  - Users/profiles
  - Products/ads
  - Categories
  - Messages
  - Ratings & comments
  - Platform settings
  - Reports
  - Audit logs (last 1000)

#### Backup Frequency Recommendations
- ⚠️ **Daily automated backups**: NOT IMPLEMENTED
- ⚠️ **Point-in-time recovery**: Use Supabase built-in backups
- ⚠️ **Off-site backup storage**: NOT IMPLEMENTED

### 8. **Monitoring & Logging**

#### Audit Logging
- ✅ User actions logged in `audit_logs` table
- ✅ Moderation actions logged in `moderation_logs` table
- ✅ Includes: action type, user ID, timestamp, details

#### Error Logging
- ✅ Client-side errors logged to console
- ✅ Server-side errors logged to console
- ⚠️ No centralized logging service (Sentry, LogRocket, etc.)

### 9. **Maintenance Mode**

- ✅ Platform-wide maintenance mode toggle
- ✅ Configured in platform settings
- ✅ Bypasses admin, API, and auth routes
- ✅ Returns 503 status with Retry-After header

### 10. **Content Moderation**

- ✅ Reported ads system
- ✅ Manual moderation by admins
- ✅ Status tracking (pending, approved, rejected)
- ⚠️ Spam detection: NOT IMPLEMENTED (setting exists)
- ⚠️ Profanity filter: NOT IMPLEMENTED

---

## ⚠️ Security Gaps & Recommendations

### Critical (Fix Immediately)

1. **Rate Limiting**
   - **Risk**: API abuse, DDoS attacks
   - **Solution**: Implement rate limiting with `express-rate-limit` or Vercel's built-in rate limiting
   - **Impact**: HIGH

2. **CAPTCHA on Signup/Login**
   - **Risk**: Bot signups, credential stuffing
   - **Solution**: Add Google reCAPTCHA v3 or hCaptcha
   - **Impact**: HIGH

3. **Email Verification**
   - **Risk**: Fake accounts, spam
   - **Solution**: Enforce email verification before account activation
   - **Impact**: MEDIUM

4. **Automated Backups**
   - **Risk**: Data loss in case of corruption or attack
   - **Solution**: Set up daily automated backups to external storage (S3, Google Cloud Storage)
   - **Impact**: HIGH

### Important (Implement Soon)

5. **Two-Factor Authentication (2FA)**
   - **Risk**: Account takeover
   - **Solution**: Add 2FA support for admin accounts
   - **Impact**: MEDIUM

6. **Content Security Policy (CSP)**
   - **Risk**: XSS attacks
   - **Solution**: Implement strict CSP headers
   - **Impact**: MEDIUM

7. **CSRF Protection**
   - **Risk**: Cross-site request forgery
   - **Solution**: Next.js API routes have built-in CSRF protection, verify it's enabled
   - **Impact**: MEDIUM

8. **Input Sanitization**
   - **Risk**: XSS, code injection
   - **Solution**: Use DOMPurify for user-generated content
   - **Impact**: MEDIUM

9. **Vulnerability Scanning**
   - **Risk**: Unknown vulnerabilities in dependencies
   - **Solution**: Set up Dependabot, Snyk, or similar
   - **Impact**: MEDIUM

10. **Security Headers**
    - **Risk**: Various attack vectors
    - **Solution**: Add security headers (X-Frame-Options, X-Content-Type-Options, etc.)
    - **Impact**: LOW-MEDIUM

### Nice to Have

11. **Honeypot Fields**
    - For spam prevention on forms

12. **Geolocation-based Access Control**
    - Restrict admin access to specific countries/IPs

13. **Session Timeout**
    - Auto-logout after inactivity

14. **Failed Login Attempts**
    - Lock account after N failed attempts

15. **Privacy Policy & GDPR Compliance**
    - Data export/deletion features
    - Cookie consent banner

---

## 🛡️ What Protects Against Hackers?

### Layer 1: Infrastructure (Supabase)
- ✅ **DDoS Protection**: Cloudflare protection
- ✅ **Database Firewall**: Connection pooling, prepared statements
- ✅ **Automatic SSL**: All connections encrypted
- ✅ **WAF (Web Application Firewall)**: Basic protection

### Layer 2: Authentication
- ✅ **JWT Tokens**: Secure, stateless authentication
- ✅ **Password Hashing**: Bcrypt with salt
- ✅ **Session Management**: Automatic token refresh

### Layer 3: Authorization
- ✅ **RLS Policies**: Database-level access control
- ✅ **Role-based Access**: User vs. Admin separation
- ✅ **API Guards**: Server-side auth checks

### Layer 4: Application
- ✅ **TypeScript**: Type safety reduces bugs
- ✅ **Input Validation**: Form validation
- ✅ **Error Handling**: Graceful failures, no sensitive info leaks

### Layer 5: Monitoring
- ✅ **Audit Logs**: Track all admin actions
- ⚠️ **Intrusion Detection**: NOT IMPLEMENTED

---

## 💾 Disaster Recovery Plan

### Scenario 1: Database Corruption

**Immediate Actions:**
1. Enable maintenance mode
2. Stop all write operations
3. Restore from latest Supabase backup (point-in-time recovery)
4. Verify data integrity
5. Disable maintenance mode

**Prevention:**
- Set up automated daily backups
- Store backups in multiple locations
- Test restore procedures monthly

### Scenario 2: Hacked/Compromised

**Immediate Actions:**
1. **Enable maintenance mode** immediately
2. **Change all credentials**:
   - Supabase project keys
   - Admin passwords
   - API keys
   - Environment variables
3. **Review audit logs** for suspicious activity
4. **Check database** for unauthorized changes
5. **Restore from clean backup** if necessary
6. **Update all dependencies** and patch vulnerabilities
7. **Force logout all users** (reset sessions)
8. **Notify affected users** if data was compromised

**Post-Incident:**
- Conduct security audit
- Implement missing security measures
- Set up intrusion detection
- Review and update security policies

### Scenario 3: Accidental Data Deletion

**Immediate Actions:**
1. Check `audit_logs` for deletion event
2. Restore from manual backup (`.json` file)
3. Use Supabase point-in-time recovery (if recent)
4. Verify restored data

**Prevention:**
- Implement soft deletes instead of hard deletes
- Require confirmation for bulk operations
- Restrict delete permissions

### Scenario 4: Server/Hosting Failure

**Immediate Actions:**
1. Verify Vercel status page
2. Check Supabase status page
3. If provider issue, wait for restoration
4. If application issue, deploy previous working version
5. Investigate logs for root cause

**Prevention:**
- Use multiple deployment environments (staging, production)
- Monitor uptime with tools like UptimeRobot
- Set up status page for users

---

## 📦 Where is Data Stored?

### Primary Storage: Supabase (PostgreSQL)

**Location**: Supabase cloud (AWS-based)
- **Database**: PostgreSQL (encrypted at rest)
- **File Storage**: Supabase Storage (S3-compatible)
- **Backups**: Automatic daily backups (Supabase managed)
- **Retention**: 7 days for free tier, 30 days for paid

**Tables:**
- `profiles` - User information
- `products` - Listings/ads
- `categories` - Product categories
- `messages` - User communications
- `favorites` - Saved ads
- `user_ratings` - User ratings
- `user_comments` - User comments
- `reported_ads` - Content reports
- `moderation_logs` - Admin actions
- `audit_logs` - System events
- `platform_settings` - Site configuration

### Secondary Storage: Vercel (Next.js)

**Location**: Vercel Edge Network
- **Static Assets**: Images, CSS, JS (CDN cached)
- **API Routes**: Serverless functions
- **Build Artifacts**: Deployment snapshots

**Not Stored on Vercel:**
- User data
- Database records
- Uploaded files

### Backup Storage (Manual)

**Location**: Your local machine
- **Format**: JSON files
- **Frequency**: Manual (via backup button)
- **Recommended**: Upload to cloud storage (Google Drive, Dropbox, S3)

---

## 🔐 Recommended Security Improvements

### Immediate (Week 1)

1. **Set up automated backups**
   ```bash
   # Use cron job or scheduled action
   # Store in S3 or Google Cloud Storage
   ```

2. **Add rate limiting**
   ```typescript
   // app/api/middleware.ts
   import rateLimit from 'express-rate-limit'
   ```

3. **Implement CAPTCHA on forms**
   ```typescript
   // Use @google-cloud/recaptcha-enterprise
   ```

### Short-term (Month 1)

4. **Add security headers**
   ```typescript
   // next.config.mjs
   headers: [
     { key: 'X-Frame-Options', value: 'DENY' },
     { key: 'X-Content-Type-Options', value: 'nosniff' },
     { key: 'Referrer-Policy', value: 'origin-when-cross-origin' }
   ]
   ```

5. **Set up monitoring**
   - Sentry for error tracking
   - LogRocket for session replay
   - UptimeRobot for uptime monitoring

6. **Implement 2FA for admins**

### Long-term (3-6 Months)

7. **Security audit** by professional firm
8. **Penetration testing**
9. **GDPR compliance features**
10. **SOC 2 compliance** (if needed)

---

## 📞 Security Incident Response

**Security Team Contact:**
- Primary: [Your Email]
- Secondary: [Backup Contact]

**Reporting Vulnerabilities:**
- Email: security@yourdomain.com
- Bug Bounty: [If applicable]

**Response Time:**
- Critical: < 2 hours
- High: < 24 hours
- Medium: < 7 days
- Low: < 30 days

---

## ✅ Security Checklist

- [x] HTTPS enabled
- [x] Row Level Security (RLS) enabled
- [x] Authentication implemented
- [x] Authorization checks on API routes
- [x] Passwords hashed
- [x] Environment variables secured
- [x] Audit logging enabled
- [x] Manual backup system
- [ ] Automated daily backups
- [ ] Rate limiting
- [ ] CAPTCHA on forms
- [ ] Email verification required
- [ ] 2FA for admins
- [ ] Security headers configured
- [ ] Input sanitization (XSS prevention)
- [ ] CSRF protection verified
- [ ] Vulnerability scanning
- [ ] Intrusion detection
- [ ] Disaster recovery tested
- [ ] Security audit completed

---

## 📚 Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

---

**Last Updated:** 2025-11-13  
**Version:** 1.0  
**Maintained by:** Super Admin Team

