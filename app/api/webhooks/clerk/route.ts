import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    // Note: For production, you should verify the webhook signature using `svix`
    // and process.env.CLERK_WEBHOOK_SECRET. 
    // We are skipping it here for the MVP to ensure immediate delivery.
    const payload = await req.json();
    
    if (payload.type === 'user.created') {
      const email = payload.data.email_addresses?.[0]?.email_address;
      const firstName = payload.data.first_name || '';
      
      if (email) {
        // 1. Add to Resend Audience (Newsletter list)
        // You need to set RESEND_AUDIENCE_ID in your .env.local
        if (process.env.RESEND_AUDIENCE_ID) {
          await resend.contacts.create({
            email: email,
            firstName: firstName,
            audienceId: process.env.RESEND_AUDIENCE_ID,
            unsubscribed: false,
          });
        }
        
        // 2. Send Welcome Email
        await resend.emails.send({
          from: 'The Touchline Dribble <newsletter@thetouchlinedribble.in>',
          to: [email],
          subject: 'Welcome to The Touchline Dribble! ⚽',
          html: `
            <div style="font-family: sans-serif; max-w-2xl mx-auto; color: #333;">
              <h2 style="color: #16A34A;">Welcome to PitchSide!</h2>
              <p>Hi ${firstName ? firstName : 'there'},</p>
              <p>Thanks for creating a free account at <strong>The Touchline Dribble</strong>.</p>
              <p>You now have full access to:</p>
              <ul>
                <li>Deep-dive tactical breakdowns</li>
                <li>Data-driven match analysis</li>
                <li>Our matchday newsletter</li>
              </ul>
              <p>We're excited to have you on board!</p>
              <br/>
              <p>Cheers,<br/>The Touchline Dribble Team</p>
            </div>
          `
        });
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Clerk webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
