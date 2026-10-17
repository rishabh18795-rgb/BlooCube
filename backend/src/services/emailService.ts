import { Resend } from 'resend';

export type SendEmailResult = { sent: boolean; reason?: 'not_configured' | 'provider_error' | 'exception' };

type SendEmailInput = { to: string; subject: string; html: string; text: string };

// Minimal shape sendEmail() actually depends on, so tests can inject a fake
// client instead of hitting the real Resend API.
type EmailClient = { emails: { send: (args: { from: string; to: string; subject: string; html: string; text: string }) => Promise<{ data?: { id?: string } | null; error?: { name?: string } | null }> } };

// Reads env + constructs the client fresh per call (not frozen at import
// time) so a config change takes effect without a process restart, and so
// tests can swap RESEND_API_KEY / EMAIL_FROM / the client between cases.
function resolveClient(injected?: EmailClient): { client: EmailClient | null; from: string | undefined } {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const client = injected ?? (apiKey ? new Resend(apiKey) : null);
  return { client, from };
}

// Never logs `to`'s message content, the email body, or any token/URL
// embedded in it — only enough to confirm delivery attempted/succeeded in
// operational logs. `injectedClient` is test-only — production callers
// never pass it.
export async function sendEmail({ to, subject, html, text }: SendEmailInput, injectedClient?: EmailClient): Promise<SendEmailResult> {
  const { client: resend, from: EMAIL_FROM } = resolveClient(injectedClient);
  if (!resend || !EMAIL_FROM) {
    console.log(`[email] Not configured (RESEND_API_KEY/EMAIL_FROM missing) — skipped "${subject}" to ${to}`);
    return { sent: false, reason: 'not_configured' };
  }

  try {
    const result = await resend.emails.send({ from: EMAIL_FROM, to, subject, html, text });
    if (result.error) {
      console.error(`[email] Resend rejected "${subject}" to ${to}: ${result.error.name}`);
      return { sent: false, reason: 'provider_error' };
    }
    console.log(`[email] Sent "${subject}" to ${to} (id: ${result.data?.id ?? 'unknown'})`);
    return { sent: true };
  } catch (err) {
    console.error(`[email] Exception sending "${subject}" to ${to}:`, err instanceof Error ? err.message : 'unknown error');
    return { sent: false, reason: 'exception' };
  }
}

function emailShell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px 32px;">
                <span style="color:#ffffff;font-size:20px;font-weight:700;">BlooCube</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">${title}</h1>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:12px;color:#94a3b8;">BlooCube — Creator &amp; Brand Collaboration Marketplace</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function passwordResetEmailTemplate(resetUrl: string): { html: string; text: string } {
  const html = emailShell(
    'Reset your password',
    `
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#334155;">
        We received a request to reset the password for your BlooCube account. This link expires in 30 minutes and can only be used once.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td style="border-radius:10px;background:#0f172a;">
            <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Reset password</a>
          </td>
        </tr>
      </table>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#94a3b8;">
        If you didn't request this, you can safely ignore this email — your password will not be changed.
      </p>
    `
  );
  const text = [
    'Reset your BlooCube password',
    '',
    'We received a request to reset the password for your BlooCube account.',
    'This link expires in 30 minutes and can only be used once.',
    '',
    resetUrl,
    '',
    "If you didn't request this, you can safely ignore this email — your password will not be changed.",
  ].join('\n');
  return { html, text };
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<SendEmailResult> {
  const { html, text } = passwordResetEmailTemplate(resetUrl);
  return sendEmail({ to, subject: 'Reset your BlooCube password', html, text });
}
