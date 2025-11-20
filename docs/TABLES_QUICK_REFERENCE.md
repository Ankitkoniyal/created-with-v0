# Database Tables Quick Reference

## 📋 All Tables at a Glance

### ✅ Core Tables (Keep These)
| Table | Purpose | Usage | Impact if Renamed |
|-------|---------|-------|-------------------|
| `profiles` | User profiles | 50+ refs | 🔴 CRITICAL |
| `products` | Product listings | 100+ refs | 🔴 CRITICAL |
| `categories` | Product categories | 20+ refs | 🔴 CRITICAL |
| `messages` | Messaging system | 30+ refs | 🔴 CRITICAL |
| `favorites` | User favorites | 15+ refs | 🟠 HIGH |
| `subcategories` | Product subcategories | 10+ refs | 🟠 HIGH |
| `locations` | City/province data | 5+ refs | 🟡 MEDIUM |

### ⭐ Rating System
| Table | Purpose | Usage | Impact if Renamed |
|-------|---------|-------|-------------------|
| `user_ratings` | User ratings | 10+ refs | 🟠 HIGH |
| `user_rating_stats` | Rating stats (VIEW) | 5+ refs | 🟠 HIGH |
| `user_comments` | User comments | 8+ refs | 🟠 HIGH |
| `reviews` | Legacy reviews | 0 refs | 🟢 LOW (may be unused) |

### 🛡️ Moderation Tables
| Table | Purpose | Usage | Impact if Renamed |
|-------|---------|-------|-------------------|
| `reports` | Reported items | 15+ refs | 🟠 HIGH |
| `blocked_users` | Blocked users | 8+ refs | 🟡 MEDIUM |
| `banned_users` | Banned users | 5+ refs | 🟡 MEDIUM |
| `deactivated_ads` | Deactivated ads | 5+ refs | 🟡 MEDIUM |
| `moderation_logs` | Moderation logs | 2+ refs | 🟢 LOW |
| `audit_logs` | Audit logs | 2+ refs | 🟢 LOW |
| `admin_audit_log` | Admin audit logs | 2+ refs | 🟢 LOW |

### ⚙️ Settings Tables
| Table | Purpose | Usage | Impact if Renamed |
|-------|---------|-------|-------------------|
| `platform_settings` | Platform settings | 10+ refs | 🟠 HIGH |
| `notifications` | User notifications | 10+ refs | 🟠 HIGH |
| `localities` | Locality management | 8+ refs | 🟡 MEDIUM |
| `conversations` | Conversation threads | 1 ref | 🟢 LOW |

### 🗑️ Staging Tables (Safe to Delete)
| Table | Purpose | Status |
|-------|---------|--------|
| `staging_geonames_ca` | GeoNames import staging | ❌ DELETE |
| `province_code_map` | Province code mapping | ❌ DELETE |

---

## 🔍 How to Check if a Table is Used

```bash
# Quick check
grep -r "\.from\([\"']TABLE_NAME[\"']\)" . | wc -l

# Detailed search
./scripts/find_table_references.sh TABLE_NAME
```

---

## 📊 Table Status Summary

- **Total Tables:** ~24 tables
- **Actively Used:** 22 tables
- **Safe to Delete:** 2 tables (staging)
- **May Not Exist:** 3 tables (subcategories, notifications, blocked_users)

---

## 🚨 Critical Tables (Never Rename Without Careful Planning)

1. `profiles` - Core user data
2. `products` - Core product data
3. `categories` - Core category system
4. `messages` - Core messaging system

---

## 📝 Notes

- Tables marked with "may not exist" are gracefully handled in code
- Staging tables can be safely deleted
- Always backup before renaming tables
- See `DATABASE_TABLES_COMPLETE_ANALYSIS.md` for detailed analysis

