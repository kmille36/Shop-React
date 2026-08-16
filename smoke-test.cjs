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
const solveCaptcha = async (page, scope = '.auth-form') => {
  const q = await page.$eval(scope + ' .captcha-q', el => el.textContent).catch(() => null);
  if (!q) return false
  const m = q.match(/(\d+)\s*([+−])\s*(\d+)/)
  if (!m) return false
  const ans = m[2] === '+' ? Number(m[1]) + Number(m[3]) : Math.abs(Number(m[1]) - Number(m[3]))
  const inp = await page.$(scope + ' .captcha-input')
  if (!inp) return false
  await setI(page, inp, String(ans))
  return true
};

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGE ERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push('HTTP ' + r.status() + ' ' + r.url()); });

  const base = 'http://localhost:5173';
  await page.goto(base, { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(600);
  await jsClick(page, '.spin-modal .modal-close'); await sleep(300);

  console.log('TITLE:', await page.title());
  console.log('PRODUCT CARDS:', (await page.$$('.card')).length);

  // product modal + review (with captcha)
  await jsClick(page, '.card .card-img'); await sleep(500);
  console.log('PRODUCT MODAL:', await page.$('.product-modal') !== null);
  await page.evaluate(() => { const tabs = document.querySelectorAll('.pm-tabs .tab'); tabs[1].click(); });
  await sleep(400);
  console.log('REVIEW ITEMS:', (await page.$$('.review-item')).length);
  const revInputs = await page.$$('.review-row input');
  await setI(page, revInputs[1], 'Test review tự động');
  await solveCaptcha(page, '.review-form');
  await page.evaluate(() => document.querySelector('.review-form').requestSubmit());
  await sleep(400);
  console.log('REVIEW AFTER SUBMIT:', (await page.$$('.review-item')).length);
  await jsClick(page, '.modal-close'); await sleep(300);

  // add to cart
  await jsClick(page, '.card .add-btn'); await sleep(400);
  console.log('CART BADGE:', await page.$eval('.badge', el => el.textContent).catch(() => 'none'));
  await jsClick(page, '.cart-btn'); await page.waitForSelector('.drawer.open', { timeout: 4000 });
  console.log('CART ITEMS:', (await page.$$('.cart-item')).length);
  const couponInp = await page.$('.coupon-row input');
  await setI(page, couponInp, 'GIAM10');
  await jsClick(page, '.coupon-row .ghost-btn'); await sleep(300);
  console.log('COUPON APPLIED:', await page.$('.coupon-applied') !== null);

  // checkout
  await jsClick(page, '.checkout-btn'); await page.waitForSelector('.modal .auth-form', { timeout: 4000 });
  await page.evaluate(() => {
    const form = document.querySelector('.auth-form');
    const ins = form.querySelectorAll('input');
    const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    s.call(ins[0], 'Khách Test'); ins[0].dispatchEvent(new Event('input', { bubbles: true }));
    s.call(ins[1], '0901234567'); ins[1].dispatchEvent(new Event('input', { bubbles: true }));
    const ta = form.querySelector('textarea');
    const s2 = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    s2.call(ta, '123 Phố Test, HN'); ta.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.evaluate(() => document.querySelector('.auth-form').requestSubmit());
  await sleep(600);
  console.log('ORDER SUCCESS:', await page.$('.success') !== null);
  if (await page.$('.success')) { console.log('  success:', await page.$eval('.success h2', el => el.textContent)); await jsClick(page, '.success .primary-btn'); }
  await sleep(300);

  // register (with captcha)
  await jsClick(page, '.login-btn'); await sleep(500);
  await jsClick(page, '.switch-mode a'); await sleep(400);
  const rf = await page.$$('.auth-form input');
  await setI(page, rf[0], 'Người Dùng Test'); await setI(page, rf[1], '0912345678');
  await setI(page, rf[3], 'test@example.com'); await setI(page, rf[4], 'pass123');
  await solveCaptcha(page);
  await page.evaluate(() => document.querySelector('.auth-form').requestSubmit());
  await sleep(600);
  console.log('REGISTERED (user chip):', await page.$('.user-chip') !== null);

  // wallet + topup
  await page.evaluate(() => { [...document.querySelectorAll('.nav-link')].find(b => b.textContent.includes('Ví')).click(); });
  await page.waitForSelector('.balance-card', { timeout: 4000 });
  console.log('WALLET PAGE:', true);
  await jsClick(page, '.topup-btn'); await sleep(1800);
  console.log('TOPUP SUCCESS:', await page.$('.success-toast') !== null);

  // profile
  await page.evaluate(() => { [...document.querySelectorAll('.nav-link')].find(b => b.textContent.includes('Hồ sơ')).click(); });
  await page.waitForSelector('.profile-card', { timeout: 4000 });
  console.log('PROFILE PAGE:', true);

  // wishlist
  await page.evaluate(() => { [...document.querySelectorAll('.nav-link')].find(b => b.textContent.includes('Yêu thích')).click(); });
  await sleep(500);
  console.log('WISHLIST PAGE:', await page.$('.wish-grid, .empty-page') !== null);

  // admin
  await page.evaluate(() => { const a = document.querySelector('.f-bottom a'); a && a.click(); });
  await sleep(600);
  console.log('ADMIN LOGIN PAGE:', await page.$('.admin-login') !== null);
  const ai = await page.$$('.admin-login .auth-form input');
  await setI(page, ai[0], 'admin@shopreact.vn'); await setI(page, ai[1], 'admin123');
  await page.evaluate(() => document.querySelector('.admin-login .auth-form').requestSubmit());
  await sleep(700);
  console.log('ADMIN DASHBOARD:', await page.$('.admin-content') !== null);
  for (const label of ['Đơn hàng', 'Sản phẩm', 'Khách hàng', 'Mã giảm giá', 'Thẻ quà tặng', 'Báo giá', 'Đổi trả', 'Tin tức', 'Hoạt động', 'Cài đặt']) {
    await page.evaluate(l => { [...document.querySelectorAll('.admin-nav-btn')].find(b => b.textContent.includes(l)).click(); }, label);
    await sleep(400);
    console.log('  ADMIN TAB', label, ':', await page.$('.admin-content') !== null);
  }

  // dark mode
  await page.evaluate(() => document.querySelector('.admin-side-foot .ghost-btn:last-child').click());
  await sleep(400);
  await page.evaluate(() => { const b = [...document.querySelectorAll('.nav-right button')].find(x => x.title === 'Đổi giao diện'); b && b.click(); });
  await sleep(300);
  console.log('DARK MODE TOGGLED:', await page.evaluate(() => document.documentElement.classList.contains('dark')));
  await page.evaluate(() => { const b = [...document.querySelectorAll('.nav-right button')].find(x => x.title === 'Đổi giao diện'); b && b.click(); });

  // flash item
  await page.evaluate(() => { [...document.querySelectorAll('.nav-link')].find(b => b.textContent.includes('Trang chủ')).click(); });
  await sleep(400);
  const flash = await page.$('.flash-item');
  if (flash) { await page.evaluate(() => document.querySelector('.flash-item').click()); await sleep(400); console.log('FLASH ITEM -> MODAL:', await page.$('.product-modal') !== null); await jsClick(page, '.modal-close'); }

  // chatbot
  await jsClick(page, '.bot-fab'); await sleep(400);
  const botInp = await page.$('.bot-input input');
  await setI(page, botInp, 'mã giảm giá');
  await jsClick(page, '.bot-input .primary-btn'); await sleep(1500);
  console.log('BOT MESSAGES:', (await page.$$('.bot-msg')).length);

  console.log('\n===== ERRORS (' + errors.length + ') =====');
  [...new Set(errors)].forEach(e => console.log(' -', e));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error('FATAL:', e); process.exit(2); });
