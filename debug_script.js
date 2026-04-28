const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1920 }
  });
  const page = await context.newPage();
  
  await page.goto(`file://${path.resolve('chelsea_chaos_reel.html')}?video=true`);
  
  await page.addStyleTag({ content: `
    html, body { width: 1080px; height: 1920px; margin: 0; padding: 0; background: #000; overflow: hidden; }
    body.video-mode .ig-frame {
      width: 420px !important;
      height: 746px !important;
      transform: scale(2.5714) !important;
      transform-origin: 0 0 !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
    }
    body.video-mode .carousel-viewport {
      height: 746px !important;
    }
  `});

  // wait 2 seconds for animations to settle
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'assets/debug_scale.png' });
  await browser.close();
  console.log("Debug screenshot saved");
})();
