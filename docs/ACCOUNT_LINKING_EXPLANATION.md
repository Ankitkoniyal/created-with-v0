# 🔗 Account Linking: Email/Password vs Google OAuth

## ⚠️ Important: How Supabase Handles Same Email

### Current Behavior

When a user:
1. **First signs up** with email/password (e.g., `user@example.com`)
2. **Later signs in** with Google OAuth using the **same email** (`user@example.com`)

**What happens:**
- Supabase creates a **NEW separate account** for the OAuth login
- The user will have **TWO different accounts** with the same email:
  - Account 1: Email/Password (User ID: `abc-123`)
  - Account 2: Google OAuth (User ID: `xyz-789`)
- Both accounts can exist simultaneously
- They are **NOT automatically linked**

### Why This Happens

Supabase treats authentication methods separately:
- Email/Password = One account
- Google OAuth = Another account
- Even with the same email, they're different user IDs

---

## ✅ What Works Currently

### Scenario 1: User signs up with Google first
- ✅ User signs up with Google OAuth
- ✅ Profile created with Google data
- ✅ User can sign in with Google anytime
- ✅ If user later tries email/password signup with same email → **Will create separate account**

### Scenario 2: User signs up with email/password first
- ✅ User signs up with email/password
- ✅ Profile created
- ✅ User can sign in with email/password
- ✅ If user later uses Google OAuth with same email → **Will create NEW account** (current behavior)

---

## 🔄 Current Implementation

The callback route (`app/auth/callback/route.ts`) now:
1. ✅ Detects if a profile exists with the same email but different user ID
2. ✅ Logs a warning (for debugging)
3. ✅ Proceeds with OAuth account creation
4. ✅ User can access via Google OAuth

**Note:** The email/password account remains separate and accessible.

---

## 🎯 User Experience

### What Users See:

**If user has email/password account and uses Google:**
- ✅ Google OAuth works
- ✅ User is logged in
- ✅ New profile created (separate from email/password account)
- ⚠️ User might be confused why they have two accounts

**If user has Google account and tries email/password:**
- ✅ Email/password signup will work
- ✅ New account created
- ⚠️ User might be confused why they have two accounts

---

## 💡 Future Improvements (Optional)

### Option 1: Account Linking (Recommended)
Implement Supabase account linking to merge accounts:

```typescript
// When OAuth user signs in, check for existing email/password account
// If found, link the accounts using Supabase's linkAccount method
await supabase.auth.linkIdentity({
  provider: 'google',
  // ... link to existing account
})
```

### Option 2: Prevent Duplicate Accounts
Show a message when user tries OAuth with existing email:

```typescript
// Check if email exists before OAuth
// If exists, show: "Account already exists. Please sign in with email/password or link your Google account."
```

### Option 3: Auto-Detection & Warning
Detect duplicate and show a warning:

```typescript
// After OAuth, check for existing account
// Show: "We found an account with this email. Would you like to link them?"
```

---

## 📊 Database Impact

### Current State:
- **profiles table** can have multiple rows with same email but different `id`
- Each row represents a different authentication method
- Both are valid and functional

### Example:
```
| id       | email              | full_name | phone      |
|----------|-------------------|-----------|------------|
| abc-123  | user@example.com  | John Doe  | 1234567890 | (Email/Password)
| xyz-789  | user@example.com  | John Doe  | NULL       | (Google OAuth)
```

---

## ✅ Recommendation

### For Now (Current Implementation):
- ✅ Works as-is
- ✅ Users can use either method
- ⚠️ May create duplicate accounts (but both work)

### For Production (Future Enhancement):
1. **Implement account linking** - Best user experience
2. **Add warning messages** - Inform users about duplicate accounts
3. **Add account merge feature** - Let users link accounts manually

---

## 🧪 Testing

To test the current behavior:

1. **Sign up with email/password:**
   - Use: `test@example.com`
   - Create account with password

2. **Sign in with Google OAuth:**
   - Use same email: `test@example.com`
   - Should create new account
   - Both accounts will work independently

3. **Check Supabase:**
   - Go to `profiles` table
   - You'll see two rows with same email but different IDs

---

## 📝 Summary

**Current Status:**
- ✅ Google OAuth works
- ✅ Email/password works
- ⚠️ Same email can create separate accounts
- ✅ Both accounts are functional

**User Impact:**
- Users can use either authentication method
- If they use both, they'll have two separate accounts
- Both accounts work independently

**Future Enhancement:**
- Implement account linking for better UX
- Add warnings/notifications about duplicate accounts
- Allow users to merge accounts

---

**This is expected Supabase behavior and works correctly. Account linking is an optional enhancement for better UX.**

