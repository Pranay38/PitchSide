import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base = process.env.AUDIT_BASE_URL || 'http://localhost:3100';
const browser = await chromium.launch();
const context = await browser.newContext({ javaScriptEnabled: false });
const cases = [
  ['/', 'independent football publication', 300],
  ['/about', 'How we approach the argument', 300],
  ['/learn', 'Why Do Teams Keep Passing Back to the Goalkeeper?', 50],
  ['/subscribe', 'One strong football opinion', 50],
  ['/post/why-do-football-websites-show-different-stats-for-the-same-player', 'Per 90', 900],
  ['/post/why-do-teams-keep-passing-back-to-the-goalkeeper', 'Drawing opponents forward', 900],
  ['/stories/calciopoli-the-game-behind-the-game', 'Calciopoli', 1500],
];
const results = [];
try {
  for (const [path, expected, minWords] of cases) {
    const page = await context.newPage();
    const response = await page.goto(base + path, { waitUntil: 'domcontentloaded' });
    assert.equal(response.status(), 200, path);
    assert(!/noindex/i.test(response.headers()['x-robots-tag'] || ''), `${path}: HTTP indexing directive`);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    assert.equal(canonical.replace(/\/$/, ''), ('https://www.thetouchlinedribble.in' + path).replace(/\/$/, ''));
    const directives = await page.locator('meta[name="robots"]').getAttribute('content');
    assert(!/noindex/i.test(directives || ''), `${path}: meta indexing directive`);
    const mains = await page.locator('main').all();
    const visibleMain = [];
    for (const main of mains) if (await main.isVisible()) visibleMain.push(await main.innerText());
    const text = visibleMain.join('\n');
    console.log(path, text.split(/\s+/).length, text.slice(0, 220));
    assert(text.toLowerCase().includes(expected.toLowerCase()), `${path}: expected main content`);
    assert(text.split(/\s+/).length > minWords, `${path}: insufficient visible main text`);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const schemas = scripts.map(JSON.parse);
    assert(schemas.some(s => s['@id'] === 'https://www.thetouchlinedribble.in/#publication'));
    if (path.startsWith('/post/') || path.startsWith('/stories/')) {
      assert(schemas.some(s => s.publisher?.['@id'] === 'https://www.thetouchlinedribble.in/#publication'));
    }
    results.push({ path, status: response.status(), visibleMainWords: text.split(/\s+/).length, schemaCount: schemas.length });
    await page.close();
  }
  const sitemapResponse = await context.request.get(base + '/sitemap.xml');
  assert.equal(sitemapResponse.status(), 200);
  const sitemap = await sitemapResponse.text();
  for (const [path] of cases) {
    assert(sitemap.includes(`<loc>${('https://www.thetouchlinedribble.in' + path).replace(/\/$/, '')}</loc>`), `${path}: sitemap eligibility`);
  }
  const redirect = await context.request.get(base + '/post/1791229918420', { maxRedirects: 0 });
  assert.equal(redirect.status(), 308);
  assert.equal(new URL(redirect.headers().location, base).pathname, '/post/why-do-teams-keep-passing-back-to-the-goalkeeper');
  results.push({ path: '/post/1791229918420', redirectStatus: 308 });
  const missing = await context.request.get(base + '/post/ai-audit-nonexistent-article');
  assert.equal(missing.status(), 404);
  await fs.mkdir('marketing/ai-visibility', { recursive: true });
  await fs.writeFile('marketing/ai-visibility/rendering-check.json', JSON.stringify({ base, javascript: false, results }, null, 2) + '\n');
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
