import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

function getAppUrl(origin?: string | null) {
  return (origin || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "")
}

export async function sendVerificationEmail(email: string, token: string, origin?: string | null) {
  const url = `${getAppUrl(origin)}/api/verify-email?token=${encodeURIComponent(token)}`
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Verify your SecureGate account',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2 style="color:#111">Verify your email</h2>
          <p>Click the button below to verify your account.
             This link expires in 15 minutes.</p>
          <a href="${url}"
             style="display:inline-block;background:#111;color:#fff;
                    padding:12px 24px;border-radius:6px;
                    text-decoration:none;margin:16px 0">
            Verify my account
          </a>
          <p style="color:#888;font-size:13px">
            If you didn't create a SecureGate account, ignore this email.
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('sendVerificationEmail error:', error)
    return { success: false, error }
  }
}

export async function sendPasswordResetEmail(email: string, token: string, origin?: string | null) {
  const url = `${getAppUrl(origin)}/reset-password/${encodeURIComponent(token)}`
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Reset your SecureGate password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2 style="color:#111">Reset your password</h2>
          <p>Click the button below to set a new password.
             This link expires in 1 hour.</p>
          <a href="${url}"
             style="display:inline-block;background:#111;color:#fff;
                    padding:12px 24px;border-radius:6px;
                    text-decoration:none;margin:16px 0">
            Reset my password
          </a>
          <p style="color:#888;font-size:13px">
            If you didn't request a password reset, ignore this email.
          </p>
        </div>
      `,
    })
    return { success: true }
  } catch (error) {
    console.error('sendPasswordResetEmail error:', error)
    return { success: false, error }
  }
}
