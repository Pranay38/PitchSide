import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || 'The Touchline Dribble';
    const club = searchParams.get('club');
    const date = searchParams.get('date');
    const subtitle = searchParams.get('subtitle');

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0b1326',
            backgroundImage: 'linear-gradient(135deg, #0b1326 0%, #0F172A 40%, #0d2818 100%)',
            padding: '0',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Atmospheric glow - top right */}
          <div
            style={{
              position: 'absolute',
              top: '-100px',
              right: '-100px',
              width: '500px',
              height: '500px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(22,163,74,0.15) 0%, transparent 70%)',
            }}
          />
          {/* Atmospheric glow - bottom left */}
          <div
            style={{
              position: 'absolute',
              bottom: '-80px',
              left: '-80px',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(22,163,74,0.1) 0%, transparent 70%)',
            }}
          />

          {/* Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              padding: '60px 70px',
              position: 'relative',
            }}
          >
            {/* Top: Brand + Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #16A34A, #1ca64d)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 20px rgba(22,163,74,0.3)',
                  }}
                >
                  <div style={{ fontSize: 22, color: 'white', fontWeight: 900 }}>⚽</div>
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#dae2fd',
                    letterSpacing: '-0.01em',
                  }}
                >
                  The Touchline Dribble
                </div>
              </div>
              {club && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(22,163,74,0.12)',
                    color: '#62df7d',
                    padding: '8px 20px',
                    borderRadius: '50px',
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {club}
                </div>
              )}
            </div>

            {/* Center: Title */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                flex: 1,
                justifyContent: 'center',
                paddingTop: '20px',
                paddingBottom: '20px',
              }}
            >
              <div
                style={{
                  fontSize: title.length > 60 ? 52 : 64,
                  fontWeight: 900,
                  color: '#ffffff',
                  lineHeight: 1.08,
                  letterSpacing: '-0.035em',
                  maxWidth: '950px',
                }}
              >
                {title}
              </div>
              {subtitle && (
                <div
                  style={{
                    fontSize: 22,
                    color: '#bdcaba',
                    fontWeight: 500,
                    lineHeight: 1.4,
                    maxWidth: '800px',
                  }}
                >
                  {subtitle}
                </div>
              )}
            </div>

            {/* Bottom: Meta */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {date && (
                  <div style={{ display: 'flex', color: '#94A3B8', fontSize: 18, fontWeight: 500 }}>
                    {date}
                  </div>
                )}
              </div>
              <div
                style={{
                  display: 'flex',
                  color: '#475569',
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                thetouchlinedribble.in
              </div>
            </div>
          </div>

          {/* Bottom accent line */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #16A34A, #4ade80, #16A34A)',
            }}
          />
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
