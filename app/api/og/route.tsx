import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || 'The Touchline Dribble';
    const club = searchParams.get('club');
    const date = searchParams.get('date');

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            backgroundColor: '#0F172A',
            backgroundImage: 'linear-gradient(to bottom right, #0F172A, #064E3B)',
            padding: '80px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Logo / Brand Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                background: '#16A34A',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '50px',
                fontSize: 24,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                boxShadow: '0 10px 25px rgba(22, 163, 74, 0.4)',
              }}
            >
              PitchSide
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              display: 'flex',
              fontSize: 72,
              fontWeight: 900,
              color: 'white',
              lineHeight: 1.1,
              letterSpacing: '-0.04em',
              marginBottom: '30px',
              maxWidth: '900px',
            }}
          >
            {title}
          </div>

          {/* Meta Information */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginTop: 'auto',
            }}
          >
            {club && (
              <div
                style={{
                  display: 'flex',
                  color: '#16A34A',
                  fontSize: 28,
                  fontWeight: 600,
                }}
              >
                {club}
              </div>
            )}
            {club && date && (
              <div style={{ color: '#475569', fontSize: 28 }}>•</div>
            )}
            {date && (
              <div
                style={{
                  display: 'flex',
                  color: '#94A3B8',
                  fontSize: 28,
                }}
              >
                {date}
              </div>
            )}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
