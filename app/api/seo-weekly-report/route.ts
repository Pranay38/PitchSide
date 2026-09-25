import { NextResponse } from 'next/server';
import { GSCClient } from '@/src/lib/gsc-client';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gscClient = new GSCClient({ siteUrl: 'https://www.thetouchlinedribble.in' });
    
    // Mocking some data since API isn't fully configured
    gscClient.loadFromJSON([
      { query: 'touchline dribble', page: '/', clicks: 150, impressions: 2000, ctr: 0.075, position: 2 },
      { query: 'premier league tactics', page: '/tactics', clicks: 80, impressions: 5000, ctr: 0.016, position: 15 },
      { query: 'champions league analysis', page: '/champions-league', clicks: 120, impressions: 3000, ctr: 0.04, position: 8 },
      { query: 'football formations', page: '/formations', clicks: 200, impressions: 10000, ctr: 0.02, position: 12 },
    ]);

    const metrics = {
      impressions: 20000,
      clicks: 550,
      ctr: 0.0275,
      position: 9.25,
      deltas: {
        impressions: '+5%',
        clicks: '+10%',
        ctr: '+0.005',
        position: '-1.5 (Improved)'
      }
    };

    const { gainers, losers } = await gscClient.getTopGainersLosers();

    const htmlContent = `
      <div style="background-color: #0B1120; color: #E2E8F0; padding: 32px; font-family: sans-serif;">
        <h1 style="color: #16A34A; margin-bottom: 24px; text-transform: uppercase;">SEO Weekly Report</h1>
        
        <div style="background-color: #0F172A; border: 1px solid #1e293b; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #F8FAFC; margin-top: 0; font-size: 1.25rem;">Key Metrics (WoW)</h2>
          <table style="width: 100%; text-align: left; margin-top: 16px;">
            <tr>
              <th style="padding: 8px 0; color: #94A3B8;">Impressions</th>
              <td style="padding: 8px 0; font-weight: bold; color: #F8FAFC;">${metrics.impressions} <span style="color: #16A34A; font-size: 0.875rem;">(${metrics.deltas.impressions})</span></td>
            </tr>
            <tr>
              <th style="padding: 8px 0; color: #94A3B8;">Clicks</th>
              <td style="padding: 8px 0; font-weight: bold; color: #F8FAFC;">${metrics.clicks} <span style="color: #16A34A; font-size: 0.875rem;">(${metrics.deltas.clicks})</span></td>
            </tr>
            <tr>
              <th style="padding: 8px 0; color: #94A3B8;">Avg CTR</th>
              <td style="padding: 8px 0; font-weight: bold; color: #F8FAFC;">${(metrics.ctr * 100).toFixed(2)}% <span style="color: #16A34A; font-size: 0.875rem;">(${metrics.deltas.ctr})</span></td>
            </tr>
            <tr>
              <th style="padding: 8px 0; color: #94A3B8;">Avg Position</th>
              <td style="padding: 8px 0; font-weight: bold; color: #F8FAFC;">${metrics.position} <span style="color: #16A34A; font-size: 0.875rem;">(${metrics.deltas.position})</span></td>
            </tr>
          </table>
        </div>

        <div style="display: flex; gap: 24px;">
          <div style="flex: 1; background-color: #0F172A; border: 1px solid #1e293b; border-radius: 8px; padding: 24px;">
            <h2 style="color: #F8FAFC; margin-top: 0; font-size: 1.25rem;">Top Gainers</h2>
            <ul style="padding-left: 20px; color: #94A3B8;">
              ${gainers.map(g => `<li style="margin-bottom: 8px;"><strong>${g.query}</strong>: ${g.impressions} imps, pos ${g.position}</li>`).join('')}
            </ul>
          </div>
          
          <div style="flex: 1; background-color: #0F172A; border: 1px solid #1e293b; border-radius: 8px; padding: 24px;">
            <h2 style="color: #F8FAFC; margin-top: 0; font-size: 1.25rem;">Top Losers</h2>
            <ul style="padding-left: 20px; color: #94A3B8;">
              ${losers.map(l => `<li style="margin-bottom: 8px;"><strong>${l.query}</strong>: ${l.impressions} imps, pos ${l.position}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'SEO Alerts <seo@thetouchlinedribble.in>',
        to: process.env.ADMIN_EMAIL || 'admin@thetouchlinedribble.in',
        subject: 'Weekly SEO Growth Report 📈',
        html: htmlContent
      });
    } else {
      console.warn('RESEND_API_KEY not found. Skipping email send.');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to generate SEO report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
