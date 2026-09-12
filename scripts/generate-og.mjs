import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2,
  });
  
  console.log('Navigating to http://localhost:3002...');
  // Use 'load' instead of 'networkidle' because nextjs dev server might have HMR connections keeping network active
  await page.goto('http://localhost:3002', { waitUntil: 'load', timeout: 90000 });
  
  console.log('Page loaded. Waiting for 5 seconds for fonts/animations to settle...');
  // Wait a bit for images/fonts/animations to load
  await page.waitForTimeout(5000);
  
  console.log('Taking screenshot...');
  // Take screenshot
  await page.screenshot({ path: 'public/og-default.png' });
  
  await browser.close();
  console.log('OG image generated at public/og-default.png');
})();
