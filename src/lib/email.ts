import { Resend } from 'resend'

const resend = new Resend(import.meta.env.RESEND_API_KEY)

const TEMPLATE = (link: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
</head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:Inter,system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0f;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <h1 style="margin:0;font-family:'Space Grotesk',sans-serif;font-size:28px;color:#c084fc;font-weight:700;">
                007-Sama
              </h1>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color:#16161f;border-radius:16px;padding:40px 32px;border:1px solid #1e1e2e;">
              <!-- Title -->
              <h2 style="margin:0 0 16px;font-size:22px;color:#f1f5f9;font-weight:700;font-family:'Space Grotesk',sans-serif;">
                Recuperá tu contraseña
              </h2>
              <!-- Body -->
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#94a3b8;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta.
                Hacé clic en el botón para continuar.
                <br><br>
                Este link expira en <strong style="color:#f1f5f9;">1 hora</strong>.
              </p>
              <!-- Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td align="center" style="background:linear-gradient(90deg,#7c3aed,#a855f7);border-radius:10px;padding:0;">
                    <a href="${link}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#fff;text-decoration:none;border-radius:10px;">
                      Restablecer contraseña
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Footer text -->
              <p style="margin:0;font-size:13px;color:#475569;line-height:1.5;">
                Si no solicitaste esto, ignorá este email.
                Tu contraseña no será modificada.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#475569;">
                007-Sama &mdash; Video Game Store
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

interface SendResult {
  success: boolean
  error?: string
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<SendResult> {
  const siteUrl = import.meta.env.AUTH_URL || 'http://localhost:4321'
  const link = `${siteUrl}/auth/reset-password?token=${token}`

  try {
    await resend.emails.send({
      from: import.meta.env.RESEND_FROM_EMAIL || 'noreply@007-sama.com',
      to: email,
      subject: 'Recuperá tu contraseña — 007-Sama',
      html: TEMPLATE(link),
    })
    return { success: true }
  } catch (err) {
    console.error('[email] sendPasswordResetEmail error:', err)
    return { success: false, error: String(err) }
  }
}
