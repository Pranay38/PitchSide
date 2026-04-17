const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const ffmpegPath = require('ffmpeg-static');
const WIDTH = 420;
const HEIGHT = 525;
const SCALE = 2; // 2x retina
const FPS = 24;
const SLIDE_DURATION = 5;
const TOTAL_SLIDES = 7;
const TOTAL_SECONDS = TOTAL_SLIDES * SLIDE_DURATION + 4; // Add 4 sec buffer at end
const TOTAL_FRAMES = TOTAL_SECONDS * FPS;

const FRAMES_DIR = path.join(__dirname, '_virtual_frames');
const OUTPUT = path.join(__dirname, 'yamal_vs_olise_reel.mp4');

async function main() {
  if (fs.existsSync(FRAMES_DIR)) fs.rmSync(FRAMES_DIR, { recursive: true });
  fs.mkdirSync(FRAMES_DIR);

  console.log(`🎬 Recording ${TOTAL_SECONDS}s at ${FPS}fps (${TOTAL_FRAMES} frames)...`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: SCALE });

  const client = await page.target().createCDPSession();

  // Load normal URL (without ?video auto-play so it stays still)
  const filePath = `file://${path.resolve(__dirname, 'yamal_vs_olise_carousel.html')}?video`;
  
  await page.goto(filePath, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  
  console.log('📄 Page loaded, resetting animations...');
  
  // Stop JS autoplay and jump to slide 0, resetting its animations
  await page.evaluate(() => {
    if (window.autoplayInterval) clearInterval(window.autoplayInterval);
    const slides = document.querySelectorAll('.slide');
    slides.forEach(s => s.classList.remove('active'));
    goTo(0); // This makes slide 0 active and starts animations
  });

  // Start Virtual Time immediately after animations reset
  await client.send('Emulation.setVirtualTimePolicy', { policy: 'pause' });

  const frameMs = 1000 / FPS;
  console.log('📸 Capturing frames...');

  for (let i = 0; i < TOTAL_FRAMES; i++) {
    await page.screenshot({
      path: path.join(FRAMES_DIR, `frame_${String(i).padStart(5, '0')}.png`),
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT }
    });

    // Advance physical time in the renderer
    await client.send('Emulation.setVirtualTimePolicy', { policy: 'advance', budget: frameMs });
    await new Promise(resolve => client.once('Emulation.virtualTimeBudgetExpired', resolve));
    
    // JS trigger for next slide every 5 virtual seconds
    if (i > 0 && i % (FPS * SLIDE_DURATION) === 0) {
      await page.evaluate(() => {
        if (typeof current !== 'undefined' && current < 6) {
          goTo(current + 1);
        }
      });
    }

    if (i % (FPS * 5) === 0) {
      let sec = Math.floor(i / FPS);
      console.log(`  Captured ${sec}s / ${TOTAL_SECONDS}s`);
    }
  }

  await browser.close();

  console.log('🎥 Assembling MP4 with ffmpeg...');
  const cmd = `"${ffmpegPath}" -y -framerate ${FPS} -i "${FRAMES_DIR}/frame_%05d.png" -c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow "${OUTPUT}"`;
  
  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`\n🎉 Success! Wrote to ${OUTPUT}`);
  } catch (e) {
    console.error('❌ ffmpeg failed:', e.message);
  }

  fs.rmSync(FRAMES_DIR, { recursive: true });
}

main().catch(console.error);
