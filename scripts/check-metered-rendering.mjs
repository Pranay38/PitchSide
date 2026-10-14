import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import nextEnv from '@next/env';
import fs from 'node:fs/promises';

// Local-only: use the same secret as next start without printing credentials.
const base = process.env.AUDIT_BASE_URL || 'http://localhost:3100';
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname));
nextEnv.loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const path = '/post/how-did-manchester-united-lost-this-derby-to-ten-men-city';
  await page.goto(base + path, { waitUntil: 'domcontentloaded' });
  const fullText = await page.locator('.pitchside-article-content').innerText();
  const paragraphs = await page.locator('.pitchside-article-content p').allTextContents();
  const withheld = [...paragraphs].reverse().find(p => p.trim().length > 100)?.trim();
  assert(withheld, 'Need a substantive tail paragraph for the regression check');
  const date = new Date();
  const data = Buffer.from(JSON.stringify({ count: 2, month: `${date.getFullYear()}-${date.getMonth()+1}`, seen: [] })).toString('base64');
  const signature = createHmac('sha256', process.env.JWT_SECRET || 'fallback_secret_for_metering').update(data).digest('hex');
  await context.addCookies([{ name: '_article_metering', value: `${data}.${signature}`, url: base, httpOnly: true }]);
  const response = await page.goto(base + path, { waitUntil: 'domcontentloaded' });
  const gatedText = await page.locator('.pitchside-article-content').innerText();
  assert(gatedText.length < fullText.length * .8, 'Metered content should be shortened');
  assert(!gatedText.includes(withheld), 'Restricted paragraph must not render');
  const html = await response.text();
  const sample = withheld.match(/[A-Za-z][A-Za-z ,.-]{60,}/)?.[0].slice(0, 70);
  assert(sample, 'Need a plain-text payload sample');
  assert(!html.includes(sample), 'Restricted paragraph must not leak in the response payload');
  assert(await page.getByText('Keep Reading', { exact: true }).isVisible());
  const result = { base, path, javascript: false, fullCharacters: fullText.length, gatedCharacters: gatedText.length, withheldTailAbsentFromPayload: true, gateVisible: true };
  await fs.writeFile('marketing/ai-visibility/metering-check.json', JSON.stringify(result, null, 2)+'\n');
  console.log(JSON.stringify(result));
} finally { await browser.close(); }
