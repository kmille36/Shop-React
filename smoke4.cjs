const puppeteer = require('puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const setI = (page, el, v) => page.evaluate((el, v) => {
  const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}, el, v);
const jsClick = async (page, sel, tries = 4) => {
  for (let i = 0; i < tries; i++) {
    const ok = await page.evaluate((s) => { const el = document.querySelector(s); if (el) { el.click(); return true; } return false; }, sel);
    if (ok) return true;
    await sleep(400);
  }
  return false;
};

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGE ERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  await page.setViewport({ width: 1280, height: 900 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(600);
  await jsClick(page, '.spin-modal .modal-close'); await sleep(300);

  // ============ CAPTCHA: REGISTER ============
  await jsClick(page, '.login-btn'); await sleep(500);
  await jsClick(page, '.switch-mode a'); await sleep(400);
  const capRow = await page.$('.auth-form .captcha-row');
  console.log('1. CAPTCHA ON REGISTER:', capRow !== null);
  const capQ = capRow ? await page.$eval('.captcha-q', el => el.textContent) : '';
  console.log('   challenge:', capQ);
  // parse challenge "a + b = ?" or "a − b = ?"
  const m = capQ.match(/(\d+)\s*([+−])\s*(\d+)/);
  const ans = m ? (m[2] === '+' ? Number(m[1]) + Number(m[3]) : Math.abs(Number(m[1]) - Number(m[3]))) : 0;

  // fill form, WRONG captcha first -> should fail
  let rf = await page.$$('.auth-form input');
  // inputs: name, phone, referral, email, password, captcha
  await setI(page, rf[0], 'User X'); await setI(page, rf[1], '0905555555');
  await setI(page, rf[3], 'x@test.com'); await setI(page, rf[4], 'pass123');
  await setI(page, rf[5], String(ans + 1)); // wrong
  await page.evaluate(() => document.querySelector('.auth-form').requestSubmit());
  await sleep(500);
  const errWrong = await page.evaluate(() => document.querySelector('.form-error')?.textContent || '');
  const usersAfterWrong = await page.evaluate(() => JSON.parse(localStorage.getItem('shop_users') || '[]').length);
  console.log('2. WRONG CAPTCHA BLOCKED:', usersAfterWrong === 0, '| error:', errWrong.slice(0, 50));

  // refresh captcha, answer correctly
  await jsClick(page, '.captcha-row .ghost-btn'); await sleep(300);
  const capQ2 = await page.$eval('.captcha-q', el => el.textContent);
  const m2 = capQ2.match(/(\d+)\s*([+−])\s*(\d+)/);
  const ans2 = m2 ? (m2[2] === '+' ? Number(m2[1]) + Number(m2[3]) : Math.abs(Number(m2[1]) - Number(m2[3]))) : 0;
  rf = await page.$$('.auth-form input');
  await setI(page, rf[5], String(ans2));
  await page.evaluate(() => document.querySelector('.auth-form').requestSubmit());
  await sleep(600);
  const usersAfterRight = await page.evaluate(() => JSON.parse(localStorage.getItem('shop_users') || '[]').length);
  console.log('3. RIGHT CAPTCHA REGISTERS:', usersAfterRight === 1);

  // ============ CAPTCHA: REVIEW ============
  await jsClick(page, '.card .card-img'); await sleep(500);
  const qaTabs = await page.$$('.pm-tabs .tab');
  await qaTabs[1].click(); await sleep(300);
  const revCap = await page.$('.review-form .captcha-row');
  console.log('4. CAPTCHA ON REVIEW:', revCap !== null);
  // wrong answer
  const rq = await page.$eval('.review-form .captcha-q', el => el.textContent);
  const rm = rq.match(/(\d+)\s*([+−])\s*(\d+)/);
  const rans = rm ? (rm[2] === '+' ? Number(rm[1]) + Number(rm[3]) : Math.abs(Number(rm[1]) - Number(rm[3]))) : 0;
  const revInputs = await page.$$('.review-row input');
  await setI(page, revInputs[1], 'Nhận xét test');
  const capInp = await page.$('.review-form .captcha-input');
  await setI(page, capInp, String(rans + 1));
  await page.evaluate(() => document.querySelector('.review-form').requestSubmit());
  await sleep(400);
  const revCountWrong = await page.evaluate(() => (JSON.parse(localStorage.getItem('shop_reviews') || '{}')[1] || []).length);
  console.log('5. WRONG REVIEW CAPTCHA BLOCKED (no new review):', revCountWrong === 1); // only seed
  // refresh + correct
  await jsClick(page, '.review-form .captcha-row .ghost-btn'); await sleep(300);
  const rq2 = await page.$eval('.review-form .captcha-q', el => el.textContent);
  const rm2 = rq2.match(/(\d+)\s*([+−])\s*(\d+)/);
  const rans2 = rm2 ? (rm2[2] === '+' ? Number(rm2[1]) + Number(rm2[3]) : Math.abs(Number(rm2[1]) - Number(rm2[3]))) : 0;
  const capInp2 = await page.$('.review-form .captcha-input');
  await setI(page, capInp2, String(rans2));
  await page.evaluate(() => document.querySelector('.review-form').requestSubmit());
  await sleep(400);
  const revCountRight = await page.evaluate(() => (JSON.parse(localStorage.getItem('shop_reviews') || '{}')[1] || []).length);
  console.log('6. RIGHT REVIEW CAPTCHA SUBMITS:', revCountRight === 2);
  await jsClick(page, '.modal-close'); await sleep(300);

  // ============ SEGMENTS: admin ============
  // create users in different segments via localStorage
  await page.evaluate(() => {
    const users = JSON.parse(localStorage.getItem('shop_users') || '[]');
    const now = Date.now();
    // VIP: 3000 points
    users.push({ name: 'VIP User', email: 'vip@test.com', phone: '0911', password: 'pass123', balance: 0, points: 3000, transactions: [], orders: [], createdAt: now - 100 * 86400000, referralCode: 'SR-VIP' });
    // regular: 3 orders
    users.push({ name: 'Regular User', email: 'reg@test.com', phone: '0922', password: 'pass123', balance: 0, points: 50, transactions: [], orders: [1, 2, 3].map(i => ({ id: 'o' + i, items: [], total: 1000000, date: now - i * 5 * 86400000, status: 'delivered', method: 'COD', address: '', customer: 'Regular User' })), createdAt: now - 90 * 86400000, referralCode: 'SR-REG' });
    // inactive: 1 order 45 days ago
    users.push({ name: 'Inactive User', email: 'ina@test.com', phone: '0933', password: 'pass123', balance: 0, points: 10, transactions: [], orders: [{ id: 'o9', items: [], total: 500000, date: now - 45 * 86400000, status: 'delivered', method: 'COD', address: '', customer: 'Inactive User' }], createdAt: now - 60 * 86400000, referralCode: 'SR-INA' });
    localStorage.setItem('shop_users', JSON.stringify(users));
  });
  // admin login
  await page.evaluate(() => { const a = document.querySelector('.f-bottom a'); a && a.click(); });
  await sleep(600);
  const ai = await page.$$('.admin-login .auth-form input');
  await setI(page, ai[0], 'admin@shopreact.vn'); await setI(page, ai[1], 'admin123');
  await page.evaluate(() => document.querySelector('.admin-login .auth-form').requestSubmit());
  await sleep(700);
  await page.evaluate(() => { [...document.querySelectorAll('.admin-nav-btn')].find(b => b.textContent.includes('Khách hàng')).click(); });
  await sleep(500);
  const segChips = await page.$$('.seg-toolbar .chip');
  console.log('7. SEGMENT CHIPS:', segChips.length);
  const segLabels = await page.evaluate(() => [...document.querySelectorAll('.seg-toolbar .chip')].map(c => c.textContent.trim()));
  console.log('   labels:', segLabels.join(' | '));
  // click VIP filter
  const vipClicked = await page.evaluate(() => {
    const b = [...document.querySelectorAll('.seg-toolbar .chip')].find(c => c.textContent.includes('VIP'));
    if (b) { b.click(); return true; } return false;
  });
  await sleep(400);
  const vipRows = await page.evaluate(() => [...document.querySelectorAll('.admin-table tbody tr')].map(r => r.querySelector('strong')?.textContent));
  console.log('8. VIP FILTER -> rows:', vipRows.length, vipRows.join(','));
  const vipPill = await page.$eval('.seg-pill.vip', el => el.textContent).catch(() => 'none');
  console.log('   VIP pill shown:', vipPill);
  // inactive filter
  await page.evaluate(() => { [...document.querySelectorAll('.seg-toolbar .chip')].find(c => c.textContent.includes('Không hoạt động')).click(); });
  await sleep(400);
  const inaRows = await page.evaluate(() => [...document.querySelectorAll('.admin-table tbody tr')].map(r => r.querySelector('strong')?.textContent));
  console.log('9. INACTIVE FILTER -> rows:', inaRows.length, inaRows.join(','));

  console.log('\n===== ERRORS (' + errors.length + ') =====');
  [...new Set(errors)].forEach(e => console.log(' -', e));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error('FATAL:', e); process.exit(2); });
