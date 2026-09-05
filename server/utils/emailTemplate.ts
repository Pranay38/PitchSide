export interface EmailTemplateProps {
  title: string;
  previewText?: string;
  content: string;
  unsubscribeUrl?: string;
}

/**
 * Generates a highly professional, editorial-style email template.
 * Inspired by The Athletic / Premium broadsheet newspapers.
 * Clean, light-mode, highly legible typography with personal touches.
 */
export function buildEditorialEmail({ title, previewText, content, unsubscribeUrl }: EmailTemplateProps): string {
  // Use a fallback unsubscribe URL if none provided, though usually it should be specific per user.
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
  <style>
    /* Reset & Base Settings */
    body, p, h1, h2, h3, h4, h5, h6 { margin: 0; padding: 0; }
    body { background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; color: #0f172a; }
    img { max-width: 100%; border: 0; line-height: 100%; outline: none; text-decoration: none; display: block; }
    a { color: #16A34A; text-decoration: none; }
    a:hover { text-decoration: underline; }
    
    /* Typography Utilities */
    .serif { font-family: "Georgia", "Times New Roman", serif; }
    .sans { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    
    /* Layout */
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { padding: 32px 40px; text-align: center; border-bottom: 3px solid #16A34A; background-color: #ffffff; }
    .header-logo { font-size: 26px; font-weight: 900; letter-spacing: -0.02em; color: #0f172a; margin: 0; text-transform: uppercase; }
    .content-wrapper { padding: 40px; background-color: #ffffff; }
    .footer { padding: 32px 40px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0; }
    
    /* Content Styles */
    .body-text { font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 20px; }
    .headline { font-size: 24px; line-height: 1.3; color: #0f172a; font-weight: 700; margin-bottom: 12px; }
    .subheadline { font-size: 18px; line-height: 1.4; color: #1e293b; font-weight: 600; margin-bottom: 16px; }
    .kicker { font-size: 11px; font-weight: 700; color: #16A34A; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
    
    .divider { height: 1px; background-color: #e2e8f0; margin: 32px 0; border: none; }
    
    /* Buttons */
    .btn { display: inline-block; padding: 12px 24px; background-color: #16A34A; color: #ffffff !important; font-weight: 600; font-size: 14px; border-radius: 4px; text-align: center; letter-spacing: 0.02em; }
    .btn:hover { background-color: #15803d; text-decoration: none; }
    
    /* Editor's Note */
    .editors-note { background-color: #f8fafc; border-left: 4px solid #16A34A; padding: 20px; margin-bottom: 32px; font-style: italic; color: #475569; }
    
    @media only screen and (max-width: 600px) {
      .header, .content-wrapper, .footer { padding: 24px 20px !important; }
      .headline { font-size: 22px !important; }
    }
  </style>
</head>
<body>
  ${previewText ? `<div style="display: none; max-height: 0px; overflow: hidden;">${previewText}</div>` : ''}
  
  <!-- Preheader spacing -->
  <div style="display: none; max-height: 0px; overflow: hidden;">
    &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
  </div>

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc;">
    <tr>
      <td align="center">
        <table class="container" width="100%" border="0" cellspacing="0" cellpadding="0">
          
          <!-- Header -->
          <tr>
            <td class="header">
              <h1 class="header-logo sans">The Touchline Dribble</h1>
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
              <p style="font-size: 14px; color: #64748b; font-weight: 600; margin-bottom: 8px;">The Touchline Dribble</p>
              <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin-bottom: 16px;">
                Intelligent football analysis, tactical breakdowns, and stories that matter.
              </p>
              <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                You are receiving this email because you are a valued member of our community.<br>
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
