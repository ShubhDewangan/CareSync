// lib/resend.ts
// Sends emails via Resend HTTP API — no SMTP, no Appwrite mail needed

const RESEND_API_URL = "https://api.resend.com/emails"
const FROM = "onboarding@resend.dev" // free shared sender — works without a domain

type SendEmailParams = {
  to: string
  subject: string
  html: string
}

export const sendEmail = async ({ to, subject, html }: SendEmailParams) => {
  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })

  if (!res.ok) {
    const error = await res.json()
    console.log("Resend error:", error)
    throw new Error(error?.message || "Failed to send email")
  }

  return res.json()
}

// ─── EMAIL TEMPLATES ──────────────────────────────────────────────────────────

export const verificationEmailHtml = (verifyUrl: string, name: string) => `
<!DOCTYPE html>
<html>
<body style="font-family: 'DM Sans', sans-serif; background: #EFECE3; margin: 0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; border: 3px solid #203C67; overflow: hidden;">
    
    <div style="background: #203C67; padding: 28px 32px;">
      <h1 style="color: #EFECE3; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
        Verify your email
      </h1>
      <p style="color: #8FABD4; margin: 6px 0 0; font-size: 14px;">
        You're almost there, ${name}!
      </p>
    </div>

    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        Thanks for signing up. Click the button below to verify your email address and activate your account.
      </p>

      <a href="${verifyUrl}"
        style="display: block; width: fit-content; background: #203C67; color: #EFECE3;
          text-decoration: none; padding: 14px 32px; border-radius: 10px;
          font-size: 15px; font-weight: 600; letter-spacing: 0.2px;">
        Verify Email Address
      </a>

      <p style="color: #9CA3AF; font-size: 12px; margin: 24px 0 0; line-height: 1.6;">
        This link expires in 1 hour. If you didn't create an account, you can safely ignore this email.
      </p>

      <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />

      <p style="color: #9CA3AF; font-size: 11px; margin: 0;">
        Or copy this link into your browser:<br/>
        <span style="color: #8FABD4; word-break: break-all;">${verifyUrl}</span>
      </p>
    </div>
  </div>
</body>
</html>
`

export const passwordResetEmailHtml = (resetUrl: string, name: string) => `
<!DOCTYPE html>
<html>
<body style="font-family: 'DM Sans', sans-serif; background: #EFECE3; margin: 0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; border: 3px solid #203C67; overflow: hidden;">

    <div style="background: #203C67; padding: 28px 32px;">
      <h1 style="color: #EFECE3; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
        Reset your password
      </h1>
      <p style="color: #8FABD4; margin: 6px 0 0; font-size: 14px;">
        Hi ${name}, we got your request.
      </p>
    </div>

    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        Click the button below to set a new password for your account. This link is valid for 1 hour.
      </p>

      <a href="${resetUrl}"
        style="display: block; width: fit-content; background: #203C67; color: #EFECE3;
          text-decoration: none; padding: 14px 32px; border-radius: 10px;
          font-size: 15px; font-weight: 600; letter-spacing: 0.2px;">
        Reset Password
      </a>

      <p style="color: #9CA3AF; font-size: 12px; margin: 24px 0 0; line-height: 1.6;">
        If you didn't request a password reset, you can safely ignore this email.
        Your password will not be changed.
      </p>

      <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />

      <p style="color: #9CA3AF; font-size: 11px; margin: 0;">
        Or copy this link into your browser:<br/>
        <span style="color: #8FABD4; word-break: break-all;">${resetUrl}</span>
      </p>
    </div>
  </div>
</body>
</html>
`