/* date-check.mjs — opens a seeded task's detail modal and screenshots the
   due-date field to confirm it renders instead of the mm/dd/yyyy placeholder. */

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

await page.goto('http://localhost:5173/login?as=u_jules', { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.location.pathname === '/app/home', { timeout: 15000 });

// open the project board and click the first task card
await page.goto('http://localhost:5173/app/project/p_rebrand', { waitUntil: 'networkidle0' });
await page.waitForSelector('.task-card', { timeout: 10000 });
await page.click('.task-card');
await page.waitForSelector('.modal-panel', { timeout: 5000 });

const dateValue = await page.$eval('.meta-grid input[type="date"]', (el) => el.value);
console.log('due-date input value:', JSON.stringify(dateValue));
console.log(dateValue ? 'PASS — date renders' : 'FAIL — still mm/dd/yyyy placeholder');

await page.screenshot({ path: `${SHOTS}/80-task-detail-dates.png` });
await browser.close();
process.exit(dateValue ? 0 : 1);
