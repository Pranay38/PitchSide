import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
import os

TOTAL_SLIDES = 7

configs = [
    {
        "input": "bayern_madrid_carousel.html",
        "out_dir": "bayern_madrid_slides_4x5",
        "w": 420,
        "h": 525,
        "scale": 1080 / 420
    },
    {
        "input": "bayern_madrid_carousel_3x4.html",
        "out_dir": "bayern_madrid_slides_3x4",
        "w": 420,
        "h": 560,
        "scale": 1080 / 420
    }
]

async def export_slides():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        
        for config in configs:
            out_dir = Path(config["out_dir"])
            out_dir.mkdir(exist_ok=True, parents=True)
            
            page = await browser.new_page(
                viewport={"width": config["w"], "height": config["h"]},
                device_scale_factor=config["scale"],
            )
            
            html_content = Path(config["input"]).read_text(encoding="utf-8")
            await page.set_content(html_content, wait_until="networkidle")
            await page.wait_for_timeout(2000)

            # Hide UI elements and adjust layout for clean screenshot
            await page.evaluate(f"""() => {{
                const igHeader = document.querySelector('.ig-header');
                if(igHeader) igHeader.style.display='none';
                const igDots = document.querySelector('.ig-dots');
                if(igDots) igDots.style.display='none';
                const igActions = document.querySelector('.ig-actions');
                if(igActions) igActions.style.display='none';
                const igCaption = document.querySelector('.ig-caption');
                if(igCaption) igCaption.style.display='none';
                
                const frame = document.querySelector('.ig-frame');
                if(frame) frame.style.cssText = 'width:{config["w"]}px;height:{config["h"]}px;max-width:none;border-radius:0;box-shadow:none;overflow:hidden;margin:0;';
                const viewport = document.querySelector('.carousel-viewport');
                if(viewport) viewport.style.cssText = 'width:{config["w"]}px;height:{config["h"]}px;aspect-ratio:unset;overflow:hidden;cursor:default;';
                document.body.style.cssText = 'padding:0;margin:0;display:block;overflow:hidden;';
            }}""")
            await page.wait_for_timeout(500)

            for i in range(TOTAL_SLIDES):
                await page.evaluate(f"""() => {{
                    const track = document.querySelector('.carousel-track');
                    if(track) {{
                        track.style.transition = 'none';
                        track.style.transform = 'translateX(' + ({-i * config["w"]}) + 'px)';
                    }} else {{
                        window.scrollTo({i * config["w"]}, 0); 
                    }}
                }}""")
                
                await page.wait_for_timeout(400)
                
                output_file = out_dir / f"slide_{i+1}.png"
                await page.screenshot(
                    path=str(output_file),
                    clip={"x": 0, "y": 0, "width": config["w"], "height": config["h"]}
                )
                print(f"Exported {config['out_dir']} slide {i+1}/{TOTAL_SLIDES}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(export_slides())
