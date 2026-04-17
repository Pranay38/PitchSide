const { chromium } = require('playwright');
const path = require('path');

const OUT_W = 840;
const OUT_H = 1050;

async function main() {
  console.log('📸 Launching Playwright to capture the reel cover...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: OUT_W, height: OUT_H },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();
  
  const filePath = `file://${path.resolve(__dirname, 'yamal_vs_olise_carousel.html')}?video`;
  await page.goto(filePath);
  
  await page.addStyleTag({ content: `
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      min-height: 100vh !important;
      display: block !important;
      background: #0a0a0a !important;
    }
    body {
      zoom: 2;
    }
    .ig-frame {
      border-radius: 0 !important;
      box-shadow: none !important;
      width: 420px !important;
      height: 525px !important;
    }
    .carousel-viewport {
      height: 525px !important;
    }
  ` });
  
  // Wait just enough time so that all initial text animations on slide 1 are fully faded in (they take ~1.5 - 2s)
  await page.waitForTimeout(2500); 
  
  const outputPath = path.join(__dirname, 'reel_cover.png');
  await page.screenshot({ path: outputPath, type: 'png' });
  
  console.log(`✅ Reel cover successfully saved to: ${outputPath}`);
  await browser.close();
}

main().catch(console.error);
