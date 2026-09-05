/* onboarding-shot.mjs — registers a brand-new user on a fresh profile,
   walks the onboarding wizard, screenshots each step. */

import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SHOTS = 'C:/Users/Jarvis/.zcode/workspace/default/lockedin/.shots';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-first-run', '--window-size=1440,1000'],
  defaultViewport: { width: 1440, height: 1000 },
});
const page = await browser.newPage();

// register a fresh account
await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle0' });
await page.type('input[placeholder="alex from it"]', 'nova test');
await page.type('input[placeholder="alex@lockedin.fun"]', `nova${Date.now()}@test.fun`);
await page.type('input[placeholder="something unhackable"]', 'frfr1234');
await page.click('button[type="submit"]');
await page.waitForSelector('.onboarding-card', { timeout: 15000 });
await page.screenshot({ path: `${SHOTS}/40-onboarding-step1.png` });

// step 1: name the workspace
await page.type('.onboarding-card input.input', 'nova labs');
await page.click('.onboarding-card .btn-accent');
await page.waitForSelector('.onboarding-steps span:nth-child(2).on', { timeout: 5000 });
await page.screenshot({ path: `${SHOTS}/41-onboarding-step2.png` });

// step 2: pick launch week template, name project, finish
await page.type('.onboarding-card input.input', 'first mission');
const templateBtn = await page.evaluateHandle(() =>
  [...document.querySelectorAll('.onboarding-card .mini-task')].find((b) => b.textContent.includes('launch week'))
);
await templateBtn.asElement().click();
await page.click('.onboarding-card .btn-accent');
await page.waitForFunction(() => window.location.pathname === '/app/home', { timeout: 10000 });
await new Promise((r) => setTimeout(r, 600));
await page.screenshot({ path: `${SHOTS}/42-new-user-home.png` });

console.log('ONBOARDING FLOW OK');
await browser.close();
