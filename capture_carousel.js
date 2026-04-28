const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  if (!fs.existsSync('assets')) fs.mkdirSync('assets');

  console.log("Launching headless browser for 4:5 Carousel...");
  const browser = await chromium.launch();
  
  // Strict 4:5 Ratio (1080x1350) using the exact 420x525 layout.
  // This preserves all original layout positioning, red lines, and borders perfectly.
  const imageContext = await browser.newContext({
    viewport: { width: 420, height: 525 },
    deviceScaleFactor: 2.571428
  });
  
  const imagePage = await imageContext.newPage();
  
  await imagePage.goto(`file://${path.resolve('chelsea_chaos_carousel.html')}?video=true`);
  
  await imagePage.addStyleTag({ content: `
    body.video-mode .ig-frame {
      width: 420px !important;
      height: 525px !important;
    }
    body.video-mode .carousel-viewport {
      height: 525px !important;
    }

    /* GLOBAL ANIMATION KILLER */
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
    }

    /* FORCE ALL ELEMENTS TO BE VISIBLE AND IN THEIR FINAL POSITIONS */
    .slide, .anim-fade, .anim-scale, .anim-up, .anim-left, [class*="anim-"] {
      opacity: 1 !important;
      transform: none !important;
    }

    /* ======= THE MAGIC CONTENT SCALING TRICK ======= */
    /* By giving the content pad an internally massive 560x700 canvas and then scaling it down to 0.75, 
       it perfectly fills the 420x525 screen (560 * 0.75 = 420, 700 * 0.75 = 525) while giving the text 
       an enormous amount of horizontal and vertical space to prevent any cropping! */
    .content-pad { 
      right: auto !important;
      bottom: auto !important;
      width: 560px !important; 
      height: 700px !important; 
      transform-origin: top left !important;
      transform: scale(0.75) !important; 
      /* Restore original padding for breathing room */
      padding: 40px 32px 54px !important; 
      justify-content: center !important;
    }
  `});

  // Stop autoplay immediately
  await imagePage.evaluate(() => {
    if (typeof autoTimer !== 'undefined') clearInterval(autoTimer);
    
    window.goTo = function(i) {
      const slides = document.querySelectorAll('.slide');
      if (i < 0 || i >= slides.length) return;
      const track = document.getElementById('track');
      track.style.transform = 'translateX(-' + (i * 100) + '%)';
    };
  });

  console.log("Generating 9 perfectly static 4:5 carousel images...");
  
  for (let i = 0; i < 9; i++) {
    await imagePage.evaluate((index) => {
      window.goTo(index);
    }, i);
    
    await imagePage.waitForTimeout(100); 
    
    const imagePath = `assets/carousel_4x5_slide_${i+1}.png`;
    await imagePage.screenshot({ path: imagePath });
    console.log(`✅ Captured ${imagePath}`);
  }

  await imageContext.close();
  await browser.close();
  
  console.log("🎉 4:5 Static Carousel images generated flawlessly!");
})();
