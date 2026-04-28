const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('Starting high-quality reel capture...');
  const browser = await chromium.launch({
    args: ['--autoplay-policy=no-user-gesture-required'] // Allows audio playing
  });
  
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 },
    recordVideo: {
      dir: '.',
      size: { width: 414, height: 896 }
    }
  });
  
  const page = await context.newPage();
  
  console.log('Navigating to reel file...');
  await page.goto('file://' + path.join(__dirname, 'pep_arteta_reel.html'));
  
  console.log('Clicking to bypass overlay and trigger web audio...');
  await page.click('#start-overlay');
  
  console.log('Recording 7 scenes x 5 seconds...');
  // Wait 38 seconds to capture all 7 slides playing automatically
  await page.waitForTimeout(38000);
  
  console.log('Saving video...');
  const videoPath = await page.video().path();
  await browser.close();
  
  console.log('High quality mp4/webm saved at:', videoPath);
})();
