import { NextResponse } from "next/server"

// Email templates
const getEmailTemplate = (type: string, data: any) => {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Your Marketplace"
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

  switch (type) {
    case "ad_approved":
      return {
        subject: "🎉 Your ad has been approved!",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ad Approved</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">🎉 Great News!</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
              <p style="font-size: 18px; margin-bottom: 20px;">Your ad has been approved and is now live!</p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                <h2 style="margin-top: 0; color: #059669;">${data.productTitle || "Your Listing"}</h2>
                <p style="color: #6b7280; margin-bottom: 0;">Your ad is now visible to all users on ${siteName}.</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.productUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Your Ad</a>
              </div>
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Thank you for using ${siteName}!<br>
                If you have any questions, feel free to contact our support team.
              </p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
              <p>This is an automated email from ${siteName}</p>
            </div>
          </body>
          </html>
        `,
        text: `Great news! Your ad "${data.productTitle || "listing"}" has been approved and is now live on ${siteName}. View it here: ${data.productUrl}`,
      }

    case "ad_status_change":
      return {
        subject: `Your ad status has been updated`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ad Status Updated</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f3f4f6; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: #374151; margin: 0;">Ad Status Update</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
              <p style="font-size: 18px; margin-bottom: 20px;">Your ad status has been updated.</p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1;">
                <h2 style="margin-top: 0; color: #4f46e5;">${data.productTitle || "Your Listing"}</h2>
                <p style="color: #6b7280; margin-bottom: 10px;"><strong>Status:</strong> ${data.status || "Updated"}</p>
                ${data.note ? `<p style="color: #6b7280; margin-bottom: 0;"><strong>Note:</strong> ${data.note}</p>` : ""}
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.productUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Your Ad</a>
              </div>
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Thank you for using ${siteName}!<br>
                If you have any questions, feel free to contact our support team.
              </p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
              <p>This is an automated email from ${siteName}</p>
            </div>
          </body>
          </html>
        `,
        text: `Your ad "${data.productTitle || "listing"}" status has been updated to ${data.status || "updated"}. ${data.note ? `Note: ${data.note}` : ""} View it here: ${data.productUrl}`,
      }

    case "welcome":
      return {
        subject: `Welcome to ${siteName}! 🎉`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Welcome to ${siteName}!</h1>
            </div>
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
              <p style="font-size: 18px; margin-bottom: 20px;">Hi there! 👋</p>
              <p>We're excited to have you join our community! You can now:</p>
              <ul style="color: #6b7280; line-height: 2;">
                <li>Post your first ad and reach thousands of buyers</li>
                <li>Browse and search through thousands of listings</li>
                <li>Connect with sellers directly</li>
                <li>Save your favorite items</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${siteUrl}/sell" style="display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Post Your First Ad</a>
              </div>
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                If you have any questions, feel free to contact our support team.<br>
                Happy selling! 🚀
              </p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
              <p>This is an automated email from ${siteName}</p>
            </div>
          </body>
          </html>
        `,
        text: `Welcome to ${siteName}! We're excited to have you join our community. Get started by posting your first ad at ${siteUrl}/sell`,
      }

    default:
      return {
        subject: "Notification from " + siteName,
        html: `<p>${data.message || "You have a new notification."}</p>`,
        text: data.message || "You have a new notification.",
      }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to, type, subject, data } = body

    if (!to || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if email service is configured
    const emailService = process.env.EMAIL_SERVICE || "resend" // Options: resend, sendgrid, mailgun, smtp
    const emailApiKey = process.env.EMAIL_API_KEY
    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT
    const smtpUser = process.env.SMTP_USER
    const smtpPassword = process.env.SMTP_PASSWORD
    const smtpFrom = process.env.SMTP_FROM || process.env.EMAIL_FROM || "noreply@yourmarketplace.com"

    if (!emailApiKey && !smtpHost) {
      console.warn("Email service not configured. Skipping email send.")
      return NextResponse.json({ 
        success: false, 
        error: "Email service not configured",
        message: "Email notifications are disabled. Please configure SMTP or email service API key."
      }, { status: 503 })
    }

    const template = getEmailTemplate(type, data || {})
    const emailSubject = subject || template.subject
    const emailHtml = template.html
    const emailText = template.text

    let emailSent = false

    // Send via Resend (recommended)
    if (emailService === "resend" && emailApiKey) {
      try {
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${emailApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: smtpFrom,
            to: [to],
            subject: emailSubject,
            html: emailHtml,
            text: emailText,
          }),
        })

        if (resendResponse.ok) {
          emailSent = true
        } else {
          const error = await resendResponse.json()
          console.error("Resend API error:", error)
        }
      } catch (error) {
        console.error("Failed to send via Resend:", error)
      }
    }

    // Send via SendGrid
    if (!emailSent && emailService === "sendgrid" && emailApiKey) {
      try {
        const sendgridResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${emailApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: to }] }],
            from: { email: smtpFrom },
            subject: emailSubject,
            content: [
              { type: "text/plain", value: emailText },
              { type: "text/html", value: emailHtml },
            ],
          }),
        })

        if (sendgridResponse.ok) {
          emailSent = true
        } else {
          const error = await sendgridResponse.text()
          console.error("SendGrid API error:", error)
        }
      } catch (error) {
        console.error("Failed to send via SendGrid:", error)
      }
    }

    // Send via SMTP (using nodemailer would require additional setup)
    // For now, we'll log that SMTP needs to be configured
    if (!emailSent && emailService === "smtp") {
      console.warn("SMTP email sending requires nodemailer package. Please install it: npm install nodemailer")
      return NextResponse.json({ 
        success: false, 
        error: "SMTP requires nodemailer package",
        message: "Please install nodemailer: npm install nodemailer"
      }, { status: 503 })
    }

    if (emailSent) {
      return NextResponse.json({ success: true, message: "Email sent successfully" })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: "Failed to send email",
        message: "Email service configuration issue. Please check your environment variables."
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Email notification error:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

