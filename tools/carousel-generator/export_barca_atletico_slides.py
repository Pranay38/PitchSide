import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
import os

INPUT_HTML = Path("/Users/pranayagrawal/Documents/Football blog/Football Blog Platform MVP/barca_atletico_carousel_fixed.html")
OUTPUT_DIR = Path("/Users/pranayagrawal/Documents/Football blog/Football Blog Platform MVP/barca_atletico_slides")
OUTPUT_DIR.mkdir(exist_ok=True, parents=True)

TOTAL_SLIDES = 7

VIEW_W = 420
VIEW_H = 525
SCALE = 1080 / 420

async def export_slides():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(
            viewport={"width": VIEW_W, "height": VIEW_H},
            device_scale_factor=SCALE,
        )
        html_content = INPUT_HTML.read_text(encoding="utf-8")
        await page.set_content(html_content, wait_until="networkidle")
        await page.wait_for_timeout(3000)

        # In case the IG frame exists (from Figma export, they often have different wrappers, but let's hide similar ones)
        await page.evaluate("""() => {
            const igHeader = document.querySelector('.ig-header');
            if(igHeader) igHeader.style.display='none';
            const igDots = document.querySelector('.ig-dots');
            if(igDots) igDots.style.display='none';
            const igActions = document.querySelector('.ig-actions');
            if(igActions) igActions.style.display='none';
            const igCaption = document.querySelector('.ig-caption');
            if(igCaption) igCaption.style.display='none';
            
            const frame = document.querySelector('.ig-frame');
            if(frame) frame.style.cssText = 'width:420px;height:525px;max-width:none;border-radius:0;box-shadow:none;overflow:hidden;margin:0;';
            const viewport = document.querySelector('.carousel-viewport');
            if(viewport) viewport.style.cssText = 'width:420px;height:525px;aspect-ratio:unset;overflow:hidden;cursor:default;';
            document.body.style.cssText = 'padding:0;margin:0;display:block;overflow:hidden;';
        }""")
        await page.wait_for_timeout(500)

        for i in range(TOTAL_SLIDES):
            await page.evaluate(f"""(idx) => {{
                const track = document.querySelector('.carousel-track');
                if(track) {{
                    track.style.transition = 'none';
                    track.style.transform = 'translateX(' + (-idx * 420) + 'px)';
                }} else {{
                    window.scrollTo(idx * 420, 0); 
                }}
            }}""", i)
            await page.wait_for_timeout(400)
            
            output_file = OUTPUT_DIR / f"slide_{i+1}.png"
            await page.screenshot(
                path=str(output_file),
                clip={"x": 0, "y": 0, "width": VIEW_W, "height": VIEW_H}
            )
            print(f"Exported slide {i+1}/{TOTAL_SLIDES} to {output_file}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(export_slides())
