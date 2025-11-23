# Email Notification Setup Guide

This guide explains how to set up email notifications for your marketplace platform, including welcome emails and ad approval notifications.

## Features Implemented

✅ **In-app notifications** - Users receive notifications in the app when their ads are approved  
✅ **Email notifications** - Users receive email notifications (when configured)  
✅ **Welcome emails** - New users receive welcome emails after signup  
✅ **Ad approval emails** - Users receive emails when their ads are approved  

## Email Service Options

### 1. **Resend** (Recommended) ⭐
**Best for:** Modern apps, great developer experience, excellent deliverability

**Pros:**
- Free tier: 3,000 emails/month
- Excellent API and documentation
- Great deliverability rates
- Easy React email templates
- Built-in analytics

**Setup:**
1. Sign up at [resend.com](https://resend.com)
2. Get your API key from dashboard
3. Add to `.env`:
```env
EMAIL_SERVICE=resend
EMAIL_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

**Pricing:** Free up to 3,000 emails/month, then $20/month for 50,000 emails

---

### 2. **SendGrid** (Enterprise)
**Best for:** High volume, enterprise features

**Pros:**
- Free tier: 100 emails/day
- Advanced analytics and segmentation
- Marketing automation features
- Excellent for transactional emails

**Setup:**
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create API key in Settings > API Keys
3. Add to `.env`:
```env
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=SG.xxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

**Pricing:** Free up to 100 emails/day, then $19.95/month for 50,000 emails

---

### 3. **Mailgun**
**Best for:** Developers, flexible pricing

**Pros:**
- Free tier: 5,000 emails/month (first 3 months)
- Great for transactional emails
- Detailed logs and analytics
- Easy API integration

**Setup:**
1. Sign up at [mailgun.com](https://mailgun.com)
2. Get API key from dashboard
3. Add to `.env`:
```env
EMAIL_SERVICE=mailgun
EMAIL_API_KEY=key-xxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
```

**Pricing:** Free for 3 months (5,000 emails/month), then $35/month for 50,000 emails

---

### 4. **SMTP (Generic)**
**Best for:** Using your own email server or existing SMTP service

**Pros:**
- Works with any SMTP provider
- Full control
- Can use Gmail, Outlook, or custom SMTP

**Setup:**
1. Install nodemailer: `npm install nodemailer`
2. Add to `.env`:
```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

**Popular SMTP Providers:**
- **Gmail:** Free, 500 emails/day limit
- **Outlook/Hotmail:** Free, 300 emails/day limit
- **Amazon SES:** $0.10 per 1,000 emails
- **Postmark:** $15/month for 10,000 emails

---

## Supabase SMTP Configuration

Supabase also supports SMTP configuration directly in the dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **Auth** > **SMTP Settings**
3. Configure your SMTP provider
4. Enable email templates

**Note:** Supabase SMTP is primarily for auth emails (signup, password reset). For transactional emails (ad approvals, welcome), use the API route we created.

---

## Environment Variables

Add these to your `.env.local` file:

```env
# Email Service Configuration
EMAIL_SERVICE=resend  # Options: resend, sendgrid, mailgun, smtp
EMAIL_API_KEY=your_api_key_here
EMAIL_FROM=noreply@yourdomain.com

# Site Configuration (for email links)
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_NAME=Your Marketplace Name

# SMTP Configuration (if using SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

---

## Email Marketing Platforms (Optional)

For marketing emails (newsletters, promotions), consider these platforms:

### 1. **Mailchimp**
- Free tier: 500 contacts, 1,000 emails/month
- Great for newsletters and campaigns
- Easy-to-use interface
- Pricing: Free, then $13/month

### 2. **ConvertKit**
- Free tier: 1,000 subscribers
- Best for creators and bloggers
- Excellent automation features
- Pricing: Free, then $29/month

### 3. **Brevo (formerly Sendinblue)**
- Free tier: 300 emails/day
- All-in-one marketing platform
- SMS marketing included
- Pricing: Free, then $25/month

### 4. **Campaign Monitor**
- Free tier: 2,500 emails/month
- Beautiful email templates
- Great analytics
- Pricing: Free, then $9/month

---

## Testing Email Notifications

1. **Test welcome email:**
   - Sign up a new user
   - Check email inbox

2. **Test ad approval email:**
   - Post an ad as a regular user
   - Approve it as admin
   - Check user's email inbox

3. **Check logs:**
   - Check server logs for email sending errors
   - Verify environment variables are set correctly

---

## Troubleshooting

### Emails not sending?
1. Check environment variables are set correctly
2. Verify API key is valid
3. Check spam folder
4. Review server logs for errors

### Emails going to spam?
1. Set up SPF, DKIM, and DMARC records for your domain
2. Use a custom domain email (not Gmail/Outlook)
3. Warm up your sending domain gradually
4. Avoid spam trigger words in subject lines

### Rate limits?
- Most free tiers have daily/monthly limits
- Upgrade to paid plan for higher limits
- Implement email queue for high volume

---

## Next Steps

1. Choose an email service provider
2. Set up your API key
3. Configure environment variables
4. Test email sending
5. Set up domain authentication (SPF/DKIM) for better deliverability
6. Monitor email delivery rates

---

## Support

If you need help setting up email notifications, check:
- Provider documentation
- Server logs for error messages
- Email service dashboard for delivery status

