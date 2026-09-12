export interface EmailTemplateProps {
  title: string;
  previewText?: string;
  content: string;
  unsubscribeUrl?: string;
}

/**
 * Generates a dark-mode, brand-matched email template for The Touchline Dribble.
 * Matches the website's design language: dark bg (#0A0A0A), green accent (#16A34A),
 * Space Grotesk for headlines, Inter for body, Newsreader for editorial flourishes.
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
      background-color: #050505;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      -webkit-text-size-adjust: 100%;
      color: #EDEDED;
    }
    img { max-width: 100%; border: 0; display: block; }
    a { color: #4ade80; text-decoration: none; }
    a:hover { text-decoration: underline; }

    /* Fonts */
    .headline { font-family: 'Space Grotesk', 'Inter', sans-serif; }
    .sans { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .serif { font-family: 'Newsreader', Georgia, 'Times New Roman', serif; }

    /* Layout */
    .container { max-width: 600px; margin: 0 auto; background-color: #0A0A0A; }
    .header {
      padding: 32px 40px 28px;
      text-align: center;
      background: linear-gradient(180deg, #0F1A12 0%, #0A0A0A 100%);
      border-bottom: 2px solid #16A34A;
    }
    .header-logo {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #ffffff;
      text-transform: uppercase;
    }
    .header-accent {
      display: inline-block;
      width: 40px;
      height: 3px;
      background: #16A34A;
      border-radius: 2px;
      margin-top: 12px;
    }
    .content-wrapper {
      padding: 40px;
      background-color: #0A0A0A;
    }
    .footer {
      padding: 32px 40px;
      background-color: #050505;
      text-align: center;
      border-top: 1px solid #1A1A1A;
    }

    /* Content */
    .body-text {
      font-size: 16px;
      line-height: 1.7;
      color: #94A3B8;
      margin-bottom: 20px;
    }
    .body-text strong {
      color: #EDEDED;
      font-weight: 600;
    }
    .headline-text {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 26px;
      line-height: 1.3;
      color: #ffffff;
      font-weight: 700;
      letter-spacing: -0.01em;
      margin-bottom: 16px;
    }
    .subheadline {
      font-size: 18px;
      line-height: 1.4;
      color: #CBD5E1;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .kicker {
      font-size: 11px;
      font-weight: 700;
      color: #16A34A;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 8px;
    }

    .divider {
      height: 1px;
      background-color: #1A1A1A;
      margin: 32px 0;
      border: none;
    }

    /* Buttons */
    .btn {
      display: inline-block;
      padding: 14px 28px;
      background: linear-gradient(135deg, #16A34A 0%, #22c55e 100%);
      color: #ffffff !important;
      font-weight: 600;
      font-size: 14px;
      border-radius: 12px;
      text-align: center;
      letter-spacing: 0.02em;
    }
    .btn:hover { background-color: #15803d; text-decoration: none; }

    /* Editor's Note */
    .editors-note {
      background-color: #121212;
      border-left: 3px solid #16A34A;
      border-radius: 0 12px 12px 0;
      padding: 20px 24px;
      margin-bottom: 28px;
      color: #94A3B8;
      font-size: 15px;
      line-height: 1.6;
    }
    .editors-note strong {
      color: #EDEDED;
    }

    /* Cards */
    .content-card {
      background-color: #121212;
      border: 1px solid #1A1A1A;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
    }

    @media only screen and (max-width: 600px) {
      .header, .content-wrapper, .footer { padding: 24px 20px !important; }
      .headline-text { font-size: 22px !important; }
    }
  </style>
</head>
<body>
  ${previewText ? `<div style="display: none; max-height: 0px; overflow: hidden;">${previewText}</div>` : ''}
  
  <!-- Preheader spacing -->
  <div style="display: none; max-height: 0px; overflow: hidden;">
    &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
  </div>

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #050505;">
    <tr>
      <td align="center">
        <table class="container" width="100%" border="0" cellspacing="0" cellpadding="0">
          
          <!-- Header -->
          <tr>
            <td class="header">
              <h1 class="header-logo">The Touchline Dribble</h1>
              <div class="header-accent"></div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td class="content-wrapper">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer">
              <p style="font-family: 'Space Grotesk', sans-serif; font-size: 14px; color: #64748b; font-weight: 600; margin-bottom: 8px; letter-spacing: -0.01em;">The Touchline Dribble</p>
              <p style="font-size: 12px; color: #475569; line-height: 1.5; margin-bottom: 16px;">
                Weaponized Ball Knowledge. Tactical breakdowns that cut through the noise.
              </p>
              <p style="font-size: 12px; color: #475569; margin: 0;">
                You're receiving this because you joined our community.<br>
                <a href="${unSub}" style="color: #64748b; text-decoration: underline;">Unsubscribe or manage preferences</a>
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
