/* smoke.mjs — drives the real app in headless chrome and checks the
   critical flows. prints PASS/FAIL per step. not shipped to prod, dev-only. */

import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173';
const results = [];
const check = (name, ok, extra = '') => {
  results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ` — ${extra}` : ''}`);
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-first-run', '--window-size=1440,1000'],
  defaultViewport: { width: 1440, height: 1000 },
});
const page = await browser.newPage();
page.on('pageerror', (e) => results.push(`PAGEERROR ${String(e).slice(0, 140)}`));

// 1. deep-link login as jules
await page.goto(`${BASE}/login?as=u_jules`, { waitUntil: 'networkidle0', timeout: 30000 });
await page.waitForFunction(() => window.location.pathname === '/app/home', { timeout: 15000 }).catch(() => {});
check('login deep link lands on /app/home', page.url().includes('/app/home'), page.url());

// 2. hero renders
const heroText = await page.$eval('h1', (el) => el.textContent).catch(() => '');
check('home hero renders', heroText.includes('locked in'), heroText.slice(0, 40));

// 3. open a task detail from hottest list
await page.waitForSelector('.mini-task', { timeout: 10000 });
await page.click('.mini-task');
await page.waitForSelector('.modal-panel', { timeout: 5000 }).catch(() => {});
check('task detail modal opens', Boolean(await page.$('.modal-panel')));

// 4. comments tab + comment with a mention
await page.evaluate(() => {
  [...document.querySelectorAll('.detail-tabs button')].find((b) => b.textContent.includes('comments'))?.click();
});
await page.waitForSelector('.mention-box textarea', { timeout: 3000 }).catch(() => {});
const commentBox = await page.$('.mention-box textarea');
if (commentBox) {
  await commentBox.type('hey @zar');
  await page.waitForSelector('.mention-pop .mention-item', { timeout: 3000 }).catch(() => {});
  const mentionCount = await page.$$eval('.mention-pop .mention-item', (els) => els.length).catch(() => 0);
  check('@mention autocomplete pops', mentionCount > 0, `${mentionCount} matches`);
  await page.keyboard.press('Enter'); // pick mention
  await page.keyboard.press('Tab');
  await commentBox.type(' smoke test comment');
} else {
  check('comment box renders', false);
}
// click the exact "comment" button by text
const commentBtn = await page.evaluateHandle(() =>
  [...document.querySelectorAll('button')].find((b) => b.textContent.trim().toLowerCase() === 'comment')
);
if (commentBtn) {
  await commentBtn.asElement()?.click();
  await new Promise((r) => setTimeout(r, 300));
  const hasComment = (await page.$$eval('.comment', (els) => els.length).catch(() => 0)) > 0;
  check('comment posts', hasComment);
}

// 5. close modal with Escape
await page.keyboard.press('Escape');
await new Promise((r) => setTimeout(r, 200));
check('escape closes modal', !(await page.$('.modal-panel')));

// 6. command palette: ctrl+k, search, navigate to project
await page.keyboard.down('Control');
await page.keyboard.press('k');
await page.keyboard.up('Control');
await page.waitForSelector('.palette input', { timeout: 3000 }).catch(() => {});
check('cmd+k opens palette', Boolean(await page.$('.palette input')));
if (await page.$('.palette input')) {
  await page.type('.palette input', 'rebrand');
  await new Promise((r) => setTimeout(r, 200));
  const foundProject = await page.$$eval('.palette-item', (els) =>
    els.some((e) => e.textContent.toLowerCase().includes('rebrand'))
  );
  check('palette global search finds project', foundProject);
  await page.keyboard.press('Escape');
}

// 7. board page: add a task via inline composer
await page.goto(`${BASE}/app/project/p_rebrand`, { waitUntil: 'networkidle0' });
await page.waitForSelector('.board-col', { timeout: 10000 });
const beforeCount = await page.$$eval('.task-card', (els) => els.length);
await page.click('.board-col .btn-sm.btn-block'); // first column's add task
await page.waitForSelector('.composer-inline textarea', { timeout: 3000 }).catch(() => {});
await page.type('.composer-inline textarea', 'smoke test task');
await page.keyboard.press('Enter');
await new Promise((r) => setTimeout(r, 400));
const afterCount = await page.$$eval('.task-card', (els) => els.length);
check('inline composer adds task', afterCount === beforeCount + 1, `${beforeCount} -> ${afterCount}`);

// 8. undo it via ctrl+z (blur first so we are not "typing")
await page.click('.page-head h1, h1').catch(() => {});
await page.keyboard.down('Control');
await page.keyboard.press('z');
await page.keyboard.up('Control');
await new Promise((r) => setTimeout(r, 400));
const afterUndo = await page.$$eval('.task-card', (els) => els.length);
check('ctrl+z undoes the add', afterUndo === beforeCount, `${afterCount} -> ${afterUndo}`);

// 9. list view + group-by present
await page.click('.view-switcher button:nth-child(2)');
await new Promise((r) => setTimeout(r, 300));
check('list view renders table', Boolean(await page.$('.task-table')));

// 10. dark mode toggle
await page.click('[title="go dark"]');
await new Promise((r) => setTimeout(r, 300));
const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
check('theme toggles to dark', theme === 'dark');
await page.screenshot({ path: '.shots/20-dark-board.png' });
await page.click('[title="go light"]');

// 11. notifications page unread flow
await page.goto(`${BASE}/app/notifications`, { waitUntil: 'networkidle0' });
await page.waitForSelector('.notif-item', { timeout: 10000 }).catch(() => {});
const unreadBefore = await page.$$eval('.notif-item.unread', (els) => els.length);
if (unreadBefore > 0) {
  await page.click('.notif-item.unread');
  await new Promise((r) => setTimeout(r, 300));
  const unreadAfter = await page.$$eval('.notif-item.unread', (els) => els.length);
  check('clicking notification marks read', unreadAfter === unreadBefore - 1, `${unreadBefore} -> ${unreadAfter}`);
  await page.keyboard.press('Escape');
} else {
  check('notifications exist', false, 'no unread to test');
}

// 12. persistence: reload keeps session + data
await page.reload({ waitUntil: 'networkidle0' });
const stillLoggedIn = await page.$('.user-menu-trigger');
check('session survives reload', Boolean(stillLoggedIn));

console.log(results.join('\n'));
await browser.close();
const failed = results.filter((r) => r.startsWith('FAIL') || r.startsWith('PAGEERROR'));
process.exit(failed.length ? 1 : 0);
