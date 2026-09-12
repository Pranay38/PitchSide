export interface EmailTemplateProps {
  title: string;
  previewText?: string;
  content: string;
  unsubscribeUrl?: string;
}

/**
 * Generates a clean, editorial email template matching PitchSide's light-mode brand.
 * Inspired by The Athletic — warm white background, crisp typography,
 * Space Grotesk headlines, Inter body, green (#16A34A) accents.
 */
export function buildEditorialEmail({ title, previewText, content, unsubscribeUrl }: EmailTemplateProps): string {
  const unSub = unsubscribeUrl || "https://www.thetouchlinedribble.in/";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=Newsreader:ital,wght@0,400;1,400&display=swap" rel="stylesheet">
  <style>
    /* Reset */
    body, p, h1, h2, h3, h4, h5, h6 { margin: 0; padding: 0; }
    body {
      background-color: #F1F5F9;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      -webkit-text-size-adjust: 100%;
      color: #1A1A1A;
    }
    img { max-width: 100%; border: 0; display: block; }
    a { color: #16A34A; text-decoration: none; }
    a:hover { text-decoration: underline; }

    @media only screen and (max-width: 600px) {
      .header, .content-wrapper, .footer { padding: 24px 20px !important; }
      .headline-text { font-size: 22px !important; }
    }
  </style>
</head>
<body>
  ${previewText ? `<div style="display: none; max-height: 0px; overflow: hidden;">${previewText}</div>` : ''}
  <div style="display: none; max-height: 0px; overflow: hidden;">
    &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
  </div>

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F1F5F9;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px 24px; text-align: center; border-bottom: 3px solid #16A34A; background-color: #ffffff;">
              <p style="font-family: 'Space Grotesk', 'Inter', sans-serif; font-size: 11px; font-weight: 700; color: #16A34A; text-transform: uppercase; letter-spacing: 0.2em; margin: 0 0 8px 0;">Football Analysis</p>
              <h1 style="font-family: 'Space Grotesk', 'Inter', sans-serif; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; color: #0F172A; text-transform: uppercase; margin: 0;">The Touchline Dribble</h1>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td class="content-wrapper" style="padding: 40px; background-color: #ffffff;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer" style="padding: 28px 40px; background-color: #FAFAF8; text-align: center; border-top: 1px solid #E2E8F0;">
              <p style="font-family: 'Space Grotesk', 'Inter', sans-serif; font-size: 13px; color: #0F172A; font-weight: 700; margin: 0 0 4px 0; letter-spacing: -0.01em;">The Touchline Dribble</p>
              <p style="font-family: 'Inter', sans-serif; font-size: 12px; color: #64748B; line-height: 1.5; margin: 0 0 16px 0;">
                The tactical detail your pundit missed. Sharp analysis, bold opinions, and the football debates that actually matter.
              </p>
              <p style="font-family: 'Inter', sans-serif; font-size: 11px; color: #94A3B8; margin: 0;">
                You're receiving this because you joined our community.<br>
                <a href="${unSub}" style="color: #64748B; text-decoration: underline;">Unsubscribe or manage preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
