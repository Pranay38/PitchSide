const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('Starting Yamal reel capture...');
  const browser = await chromium.launch();
  
  // Match viewport exactly to the CSS frame size — no mismatch
  const context = await browser.newContext({
    viewport: { width: 420, height: 525 },
    recordVideo: {
      dir: path.join(__dirname, 'output'),
      size: { width: 420, height: 525 }
    }
  });
  
  const page = await context.newPage();
  
  const reelPath = 'file://' + path.join(__dirname, 'yamal_injury_reel.html') + '?video';
  console.log('Navigating to:', reelPath);
  await page.goto(reelPath);
  
  await page.waitForTimeout(2000);
  
  console.log('Recording 6 slides (30s)...');
  await page.waitForTimeout(32000);
  
  console.log('Saving video...');
  await context.close();
  await browser.close();
  
  console.log('Done! Now upscale with ffmpeg.');
})();
