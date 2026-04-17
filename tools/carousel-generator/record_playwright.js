const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

// Target output size
const OUT_W = 840;
const OUT_H = 1050;

async function main() {
  const outputVideoPath = path.join(__dirname, 'yamal_vs_olise_reel.mp4');
  if (fs.existsSync(outputVideoPath)) {
    fs.unlinkSync(outputVideoPath);
  }

  console.log('🎬 Launching Playwright to record fullscreen without black bars...');
  const browser = await chromium.launch();
  
  const _videosDir = path.join(__dirname, '_playwright_videos');
  if (fs.existsSync(_videosDir)) fs.rmSync(_videosDir, { recursive: true });
  fs.mkdirSync(_videosDir);
  
  // Create context with viewport explicitly set to the 2x output size
  // and recordVideo exactly matching it to prevent black borders.
  const context = await browser.newContext({
    recordVideo: {
      dir: _videosDir,
      size: { width: OUT_W, height: OUT_H } 
    },
    viewport: { width: OUT_W, height: OUT_H },
    deviceScaleFactor: 1
  });
  
  const page = await context.newPage();
  
  const filePath = `file://${path.resolve(__dirname, 'yamal_vs_olise_carousel.html')}?video`;
  
  console.log(`⏱️ Navigating and injecting CSS to scale video...`);
  await page.goto(filePath);
  
  // Inject CSS to scale the 420px layout to 840px (zoom: 2)
  // Also remove backgrounds, borders, padding so it is a perfectly clean edge-to-edge video.
  await page.addStyleTag({ content: `
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      min-height: 100vh !important;
      display: block !important;
      background: #0a0a0a !important;
    }
    body {
      zoom: 2; /* 420 * 2 = 840 */
    }
    .ig-frame {
      border-radius: 0 !important;
      box-shadow: none !important;
      width: 420px !important;
      height: 525px !important; /* height of the carousel only */
    }
    .carousel-viewport {
      height: 525px !important;
    }
  ` });
  
  // The slides advance every 5 seconds. Total 7 slides = 35s. + Buffer = 38s
  const totalSecs = 38;
  
  console.log('📹 Capturing gameplay...');
  for (let i = 0; i < totalSecs; i++) {
    await page.waitForTimeout(1000); 
    if ((i+1) % 5 === 0) {
      console.log(`  Recorded ${i + 1}s / ${totalSecs}s`);
    }
  }
  
  console.log('✅ Finishing recording and closing context...');
  
  await context.close();
  await browser.close();
  
  const files = fs.readdirSync(_videosDir);
  const webmFile = files.find(f => f.endsWith('.webm'));
  
  if (webmFile) {
     const webmPath = path.join(_videosDir, webmFile);
     console.log(`\n🎥 Transcoding WebM to H.264 MP4 using internal ffmpeg...`);
     const cmd = `"${ffmpegPath}" -y -i "${webmPath}" -c:v libx264 -pix_fmt yuv420p -crf 18 -preset fast "${outputVideoPath}"`;
     execSync(cmd, { stdio: 'inherit' });
     
     console.log(`\n🎉 Success! Wrote to ${outputVideoPath}`);
  } else {
     console.error('❌ Could not find Playwright output video file.');
  }
  
  try { fs.rmSync(_videosDir, { recursive: true }); } catch(err) {}
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
