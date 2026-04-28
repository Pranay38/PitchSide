const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  if (!fs.existsSync('assets')) {
    fs.mkdirSync('assets');
  }

  console.log("Launching headless browser...");
  const browser = await chromium.launch();
  
  // ----- 1. RECORD VIDEO (NATIVE 9:16 FORMAT) -----
  // By recording at the native 420x746 instead of scaling, we bypass the Playwright/Chromium 
  // hardware compositor bug that was causing the black screens.
  console.log("Recording video in native 9:16 format...");
  const videoContext = await browser.newContext({
    viewport: { width: 420, height: 746 },
    recordVideo: {
      dir: 'assets/',
      size: { width: 420, height: 746 }
    }
  });

  const videoPage = await videoContext.newPage();
  await videoPage.goto(`file://${path.resolve('chelsea_chaos_reel.html')}?video=true`);
  
  // Force exactly 9:16 layout limits, but NO scaling transforms to ensure perfect video recording
  await videoPage.addStyleTag({ content: `
    body.video-mode .ig-frame {
      width: 420px !important;
      height: 746px !important;
    }
    body.video-mode .carousel-viewport {
      height: 746px !important;
    }
  `});
  
  // Wait 50 seconds for the entire autoplay sequence
  await videoPage.waitForTimeout(50000);
  
  const videoPath = await videoPage.video().path();
  await videoContext.close(); // Saves the video
  
  const finalVideoPath = 'assets/chelsea_chaos_reel.webm';
  if (fs.existsSync(finalVideoPath)) fs.unlinkSync(finalVideoPath);
  fs.renameSync(videoPath, finalVideoPath);
  console.log(`✅ Video saved to: ${finalVideoPath}`);

  // ----- 2. CAPTURE CAROUSEL SCREENSHOTS (1080x1920) -----
  // We can still use 1080x1920 for the images since deviceScaleFactor works flawlessly for static screenshots
  console.log("Capturing 9 high-res carousel images (1080x1920)...");
  const imageContext = await browser.newContext({
    viewport: { width: 420, height: 746 },
    deviceScaleFactor: 2.5714
  });
  const imagePage = await imageContext.newPage();
  
  await imagePage.goto(`file://${path.resolve('chelsea_chaos_reel.html')}?video=true`);
  
  await imagePage.addStyleTag({ content: `
    body.video-mode .ig-frame {
      width: 420px !important;
      height: 746px !important;
    }
    body.video-mode .carousel-viewport {
      height: 746px !important;
    }
  `});

  // Stop autoplay so we can manually screenshot each slide
  await imagePage.evaluate(() => {
    if (typeof autoTimer !== 'undefined') clearInterval(autoTimer);
  });

  for (let i = 0; i < 9; i++) {
    // Navigate to slide
    await imagePage.evaluate((index) => {
      goTo(index);
      // Disable CSS transitions instantly so screenshot is clean
      document.querySelectorAll('.carousel-track, .slide, [class*="anim-"]').forEach(el => {
        el.style.transition = 'none';
        el.style.animation = 'none';
      });
    }, i);
    
    // Tiny wait just to ensure DOM updates
    await imagePage.waitForTimeout(100); 
    
    const imagePath = `assets/carousel_slide_${i+1}.png`;
    await imagePage.screenshot({ path: imagePath });
    console.log(`✅ Captured ${imagePath}`);
  }

  await imageContext.close();
  await browser.close();
  
  console.log("🎉 All 9:16 assets generated successfully!");
})();
