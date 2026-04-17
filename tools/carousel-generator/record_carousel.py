import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Carousel for Instagram is 1080x1350
        context = await browser.new_context(
            record_video_dir="recorded_videos/",
            record_video_size={"width": 1080, "height": 1350},
            viewport={"width": 1080, "height": 1350}
        )
        page = await context.new_page()
        # Ensure we wait until it's loaded
        await page.goto("file:///Users/pranayagrawal/Documents/Football%20blog/Football%20Blog%20Platform%20MVP/bayern_madrid_carousel.html")
        
        # Give JS time to initialize
        await asyncio.sleep(1)
        
        # Click center to trigger audio/autoplay
        await page.mouse.click(540, 675)
        
        # Wait 30 seconds for the entire 7 slide carousel to play
        await asyncio.sleep(30)
        
        await context.close()
        await browser.close()

if __name__ == "__main__":
    import os
    os.makedirs("recorded_videos", exist_ok=True)
    asyncio.run(run())
