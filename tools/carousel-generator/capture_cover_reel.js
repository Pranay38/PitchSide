const { chromium } = require('playwright');
const path = require('path');

const OUT_W = 1080;
const OUT_H = 1920;

async function main() {
  console.log('📸 Launching Playwright to capture the full 9:16 reel cover...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: OUT_W, height: OUT_H },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();
  
  const filePath = `file://${path.resolve(__dirname, 'yamal_vs_olise_carousel.html')}?video`;
  await page.goto(filePath);
  
  // 1080 / 420 = 2.5714...
  // We use CSS transform to cleanly scale the 420px IG-frame structure to fit 1080x1920 
  // We also force the inner carousel to 9:16 aspect ratio so it fills the screen perfectly!
  await page.addStyleTag({ content: `
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      min-height: 100vh !important;
      display: block !important;
      background: #000 !important;
      overflow: hidden !important;
    }
    body {
      zoom: 2.57142857; /* scale up to 1080 */
    }
    .ig-frame {
      border-radius: 0 !important;
      box-shadow: none !important;
      width: 420px !important;
      height: 746.66px !important; /* exactly 9:16 ratio for 420px */
    }
    .carousel-viewport {
      height: 746.66px !important;
    }
    .slide {
      height: 746.66px !important;
    }
    /* Move the progress bar & controls a bit higher up from the huge bottom area for standard mobile screen safe zones */
    .prog {
      bottom: 24px !important;
    }
  ` });
  
  // Wait for initial animations
  await page.waitForTimeout(2500); 
  
  const outputPath = path.join(__dirname, 'reel_cover_9_16.png');
  await page.screenshot({ path: outputPath, type: 'png' });
  
  console.log(`✅ Reel cover successfully saved to: ${outputPath}`);
  await browser.close();
}

main().catch(console.error);
