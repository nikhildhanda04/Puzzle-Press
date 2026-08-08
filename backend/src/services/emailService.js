import { Resend } from 'resend'

export function unsubscribeUrlFor(subscriber) {
  const apiUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:4000'
  return `${apiUrl}/api/unsubscribe?token=${subscriber.unsubscribeToken}`
}

export async function sendIssueEmail({ subscriber, issue }) {
  if (!process.env.RESEND_API_KEY) {
    return { status: 'skipped', providerMessageId: null, error: 'RESEND_API_KEY is not configured.' }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const siteUrl = process.env.PUBLIC_SITE_URL ?? 'http://localhost:5173'
  const issueUrl = `${siteUrl}/issues/${issue.slug}`
  const unsubscribeUrl = unsubscribeUrlFor(subscriber)

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: subscriber.email,
      subject: `Puzzle Press Issue #${issue.number}: ${issue.theme}`,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      html: `
        <div style="font-family: Georgia, serif; color: #24170f; background: #f7e6b2; padding: 24px;">
          <h1>${issue.title}</h1>
          <p>${issue.teaser || `The ${issue.theme} issue is ready.`}</p>
          <p><a href="${issueUrl}">Read the magazine</a></p>
          <p style="font-size: 12px;"><a href="${unsubscribeUrl}">Unsubscribe</a></p>
        </div>
      `,
    })

    if (result.error) {
      return { status: 'failed', providerMessageId: null, error: result.error.message }
    }

    return { status: 'sent', providerMessageId: result.data?.id ?? null, error: null }
  } catch (error) {
    return { status: 'failed', providerMessageId: null, error: error.message }
  }
}
