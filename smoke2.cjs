const puppeteer = require('puppeteer');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const setReactInput = (page, el, v) => page.evaluate((el, v) => {
  const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}, el, v);
// robust: JS-click a selector (immune to smooth-scroll offset), with retry
const jsClick = async (page, sel, tries = 4) => {
  for (let i = 0; i < tries; i++) {
    const ok = await page.evaluate((s) => { const el = document.querySelector(s); if (el) { el.click(); return true; } return false; }, sel);
    if (ok) return true;
    await sleep(400);
  }
  return false;
};
// solve the math captcha in a given form scope (default: .auth-form)
const solveCaptcha = async (page, scope = '.auth-form') => {
  const q = await page.$eval(scope + ' .captcha-q', el => el.textContent).catch(() => null);
  if (!q) return false
  const m = q.match(/(\d+)\s*([+−])\s*(\d+)/)
  if (!m) return false
  const ans = m[2] === '+' ? Number(m[1]) + Number(m[3]) : Math.abs(Number(m[1]) - Number(m[3]))
  const inp = await page.$(scope + ' .captcha-input')
  if (!inp) return false
  await page.evaluate((el, v) => { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); }, inp, String(ans))
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

  // 1. SPIN WHEEL appears on first visit
  const spin = await page.$('.spin-modal');
  console.log('SPIN WHEEL SHOWN:', spin !== null);
  if (spin) {
    await page.click('.spin-btn');
    await sleep(4600);
    const res = await page.$('.spin-result');
    console.log('SPIN RESULT:', res !== null);
    await page.click('.spin-modal .modal-close');
    await sleep(300);
  }

  // 2. SEARCH SUGGESTIONS
  await page.type('.search', 'ipho');
  await sleep(400);
  const sugs = await page.$$('.suggestion');
  console.log('SEARCH SUGGESTIONS:', sugs.length);
  if (sugs.length) {
    await sugs[0].click();
    await sleep(400);
    console.log('SUGGESTION -> MODAL:', await page.$('.product-modal') !== null);
    // 3. SIMILAR PRODUCTS in modal
    const sim = await page.$$('.similar-item');
    console.log('SIMILAR PRODUCTS:', sim.length);
    if (sim.length) { await sim[0].click(); await sleep(300); console.log('SIMILAR -> NEW MODAL:', await page.$('.product-modal') !== null); }
    await page.click('.modal-close');
    await sleep(300);
  }

  // 4. COMPARE: pick 2 products
  const cmpBtns = await page.$$('.cmp-btn');
  console.log('COMPARE BUTTONS ON CARDS:', cmpBtns.length);
  await cmpBtns[0].click(); await sleep(200);
  await (await page.$$('.cmp-btn'))[1].click(); await sleep(400);
  const bar = await page.$('.compare-bar');
  console.log('COMPARE BAR:', bar !== null);
  if (bar) {
    await page.click('.compare-bar .primary-btn');
    await sleep(400);
    const rows = await page.$$('.compare-table tr');
    console.log('COMPARE TABLE ROWS:', rows.length);
    await page.click('.compare-modal .close-btn');
    await sleep(300);
  }

  // 5. FREE SHIPPING BAR after add to cart
  await page.click('.card .add-btn');
  await sleep(500);
  const shipbar = await page.$('.shipbar');
  console.log('FREE SHIPPING BAR:', shipbar !== null);
  if (shipbar) console.log('  text:', (await shipbar.$eval('.shipbar-text', el => el.textContent)).trim().slice(0, 60));

  // 6. HASH ROUTING
  const hash1 = await page.evaluate(() => location.hash);
  console.log('HASH ON HOME:', hash1);
  await page.evaluate(() => { [...document.querySelectorAll('.nav-link')].find(b => b.textContent.includes('Yêu thích')).click(); });
  await sleep(400);
  console.log('HASH ON WISHLIST:', await page.evaluate(() => location.hash));
  await page.goBack();
  await sleep(500);
  console.log('HASH AFTER BACK:', await page.evaluate(() => location.hash));

  // 7. LANG TOGGLE
  await page.evaluate(() => { [...document.querySelectorAll('.nav-link')].find(b => b.textContent.includes('Trang chủ')).click(); });
  await sleep(300);
  await page.click('.lang-btn');
  await sleep(300);
  const heroEn = await page.$eval('.hero h1', el => el.textContent);
  console.log('LANG TOGGLE (EN hero):', heroEn);
  await page.click('.lang-btn');
  await sleep(200);

  // 8. NOTIFICATIONS BELL exists
  console.log('NOTIF BELL:', await page.$('.notif-wrap') !== null);

  // ===== REGISTER (with referral from a first user) =====
  // create user A first to get a referral code
  await page.click('.login-btn'); await sleep(400);
  await page.click('.switch-mode a'); await sleep(300);
  const rf = await page.$$('.auth-form input');
  await setReactInput(page, rf[0], 'User A'); await setReactInput(page, rf[1], '0901111111');
  await setReactInput(page, rf[3], 'a@test.com'); await setReactInput(page, rf[4], 'pass123');
  await solveCaptcha(page);
  await page.evaluate(() => document.querySelector('.auth-form').requestSubmit()); await sleep(500);
  const refA = await page.evaluate(() => { const u = JSON.parse(localStorage.getItem('shop_users')).find(u => u.email === 'a@test.com'); return u ? u.referralCode : null; });
  console.log('USER A REFERRAL CODE:', refA);

  // logout via profile, then register user B with referral
  await page.click('.user-chip'); await sleep(500);
  await page.waitForSelector('.profile-card', { timeout: 4000 });
  await page.evaluate(() => { const b = [...document.querySelectorAll('.ghost-btn')].find(x => x.textContent.includes('Đăng xuất')); b && b.click(); });
  await page.waitForSelector('.login-btn', { timeout: 4000 });
  // wait for smooth-scroll to settle + toasts to fade before clicking
  await page.waitForFunction(() => window.scrollY === 0, { timeout: 6000 }).catch(() => {});
  await page.waitForFunction(() => !document.querySelector('.toast'), { timeout: 6000 }).catch(() => {});
  await sleep(400);
  await jsClick(page, '.login-btn');
  await page.waitForSelector('.auth-form', { timeout: 4000 });
  await jsClick(page, '.switch-mode a'); await sleep(300);
  await page.waitForSelector('.auth-form', { timeout: 4000 });
  const rb = await page.$$('.auth-form input');
  await setReactInput(page, rb[0], 'User B'); await setReactInput(page, rb[1], '0902222222');
  await setReactInput(page, rb[2], refA); await setReactInput(page, rb[3], 'b@test.com'); await setReactInput(page, rb[4], 'pass123');
  await solveCaptcha(page);
  await page.evaluate(() => document.querySelector('.auth-form').requestSubmit()); await sleep(600);
  const balA = await page.evaluate(() => JSON.parse(localStorage.getItem('shop_users')).find(u => u.email === 'a@test.com').balance);
  console.log('REFERRAL BONUS (A balance 50000+20000=70000):', balA);

  // 9. PROFILE: referral box + rank progress
  await page.evaluate(() => { [...document.querySelectorAll('.nav-link')].find(b => b.textContent.includes('Hồ sơ')).click(); });
  await sleep(400);
  console.log('REFERRAL BOX:', await page.$('.referral-box') !== null);
  console.log('RANK PROGRESS:', await page.$('.rank-progress') !== null);

  // 10. WALLET: gift card box present
  await page.evaluate(() => { [...document.querySelectorAll('.nav-link')].find(b => b.textContent.includes('Ví')).click(); });
  await sleep(400);
  console.log('GIFT CARD BOX:', await page.$('.giftcard-box') !== null);
  // try redeeming invalid code
  const gcInp = await page.$('.giftcard-row input');
  await setReactInput(page, gcInp, 'GC-INVALID');
  await page.click('.giftcard-row .ghost-btn');
  await sleep(300);
  console.log('INVALID GC REJECTED (no balance change):', await page.evaluate(() => JSON.parse(localStorage.getItem('shop_users')).find(u => u.email === 'b@test.com').balance) === 50000);

  // ===== ADMIN: gift cards + activity + chart + flash schedule =====
  await page.evaluate(() => document.querySelector('.f-bottom a').click());
  await sleep(500);
  const ai = await page.$$('.admin-login .auth-form input');
  await setReactInput(page, ai[0], 'admin@shopreact.vn'); await setReactInput(page, ai[1], 'admin123');
  await page.evaluate(() => document.querySelector('.admin-login .auth-form').requestSubmit()); await sleep(600);

  // dashboard: revenue chart
  console.log('REVENUE CHART COLS:', (await page.$$('.rev-col')).length);

  // gift cards tab
  await page.evaluate(() => { [...document.querySelectorAll('.admin-nav-btn')].find(b => b.textContent.includes('Thẻ quà tặng')).click(); });
  await page.waitForSelector('.giftcard-create', { timeout: 4000 });
  await jsClick(page, '.giftcard-create .primary-btn');
  await page.waitForFunction(() => { try { return (JSON.parse(localStorage.getItem('shop_giftcards')) || []).length > 0 } catch { return false } }, { timeout: 4000 });
  const gcCode = await page.evaluate(() => JSON.parse(localStorage.getItem('shop_giftcards'))[0].code);
  console.log('GIFT CARD CREATED:', gcCode);

  // redeem it as user B: go back to shop
  await page.evaluate(() => document.querySelector('.admin-side-foot .ghost-btn:last-child').click());
  await sleep(400);
  await page.evaluate(() => { [...document.querySelectorAll('.nav-link')].find(b => b.textContent.includes('Ví')).click(); });
  await page.waitForSelector('.giftcard-row input', { timeout: 4000 });
  const gcInp2 = await page.$('.giftcard-row input');
  await setReactInput(page, gcInp2, gcCode);
  await jsClick(page, '.giftcard-row .ghost-btn');
  await page.waitForFunction(() => { try { return (JSON.parse(localStorage.getItem('shop_giftcards')) || []).some(c => c.used) } catch { return false } }, { timeout: 4000 });
  const balB = await page.evaluate(() => JSON.parse(localStorage.getItem('shop_users')).find(u => u.email === 'b@test.com').balance);
  console.log('GC REDEEMED (B balance 50000+100000=150000):', balB);

  // activity tab
  await page.evaluate(() => document.querySelector('.f-bottom a').click());
  await sleep(500);
  await page.evaluate(() => { [...document.querySelectorAll('.admin-nav-btn')].find(b => b.textContent.includes('Hoạt động')).click(); });
  await sleep(400);
  const actItems = await page.$$('.activity-item');
  console.log('ACTIVITY LOG ITEMS:', actItems.length);

  // flash schedule: edit a FLASH product (MacBook = row 3), set end in the past -> disappears
  await page.evaluate(() => { [...document.querySelectorAll('.admin-nav-btn')].find(b => b.textContent.includes('Sản phẩm')).click(); });
  await page.waitForSelector('.admin-table', { timeout: 4000 });
  // find the row whose Flash cell shows 'Đang chạy' (an active flash product)
  const clicked = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.admin-table tbody tr')];
    const flashRow = rows.find(r => r.querySelector('td:nth-child(5)')?.textContent.includes('Đang chạy'));
    if (flashRow) { const b = flashRow.querySelectorAll('.row-actions .ghost-btn')[0]; b && b.click(); return flashRow.querySelector('td:nth-child(1) strong')?.textContent; }
    return null;
  });
  console.log('EDITING FLASH PRODUCT:', clicked);
  await page.waitForSelector('.modal input[type="datetime-local"]', { timeout: 4000 });
  const dtInps = await page.$$('.modal input[type="datetime-local"]');
  console.log('DATETIME INPUTS IN EDIT MODAL:', dtInps.length);
  if (dtInps.length >= 2) {
    await setReactInput(page, dtInps[1], '2020-01-01T00:00');
    await page.evaluate(() => { const m = document.querySelector('.modal'); if (m && m.querySelector('form')) m.querySelector('form').requestSubmit(); });
    await sleep(500);
  }
  // back to shop, count flash items (should be one less)
  await page.evaluate(() => document.querySelector('.admin-side-foot .ghost-btn:last-child').click());
  await page.waitForFunction(() => window.scrollY === 0, { timeout: 6000 }).catch(()=>{});
  await sleep(500);
  const flashCount = await page.$$('.flash-item');
  console.log('FLASH ITEMS AFTER PAST-END (was 4, now expect 3):', flashCount.length);

  // 11. CHECKOUT: note + save address + QR
  await page.evaluate(() => { [...document.querySelectorAll('.nav-link')].find(b => b.textContent.includes('Trang chủ')).click(); });
  await sleep(400);
  // add to cart
  await jsClick(page, '.card .add-btn:not(:disabled)'); await sleep(300);
  await jsClick(page, '.cart-btn'); await page.waitForSelector('.drawer.open', { timeout: 4000 });
  await jsClick(page, '.checkout-btn'); await page.waitForSelector('.modal .auth-form', { timeout: 4000 });
  const chkInputs = await page.$$('.auth-form input');
  console.log('CHECKOUT HAS NOTE INPUT (name,phone,note,saveaddr):', chkInputs.length >= 4);
  // fill: name, phone, [note], address textarea
  await page.evaluate(() => {
    const form = document.querySelector('.auth-form');
    const setI = (el, v) => { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
    const ins = form.querySelectorAll('input');
    setI(ins[0], 'Khách QR'); setI(ins[1], '0909999999');
    const ta = form.querySelector('textarea');
    const s2 = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set; s2.call(ta, '88 Đường Test'); ta.dispatchEvent(new Event('input', { bubbles: true }));
  });
  // select bank (radios have no value attr — pick the one in the 'Chuyển khoản' label)
  await page.evaluate(() => {
    const label = [...document.querySelectorAll('.pay-opt')].find(l => l.textContent.includes('Chuyển khoản'));
    label.querySelector('input').click();
  });
  await sleep(200);
  await page.evaluate(() => document.querySelector('.auth-form').requestSubmit());
  await sleep(600);
  console.log('ORDER SUCCESS:', await page.$('.success') !== null);
  const qrBtn = await page.$('.success .ghost-btn');
  console.log('QR BUTTON IN SUCCESS:', qrBtn !== null);
  if (qrBtn) {
    await jsClick(page, '.success .ghost-btn');
    await page.waitForSelector('.qr-modal', { timeout: 4000 });
    // QRCode.toDataURL is async — wait for the img
    await page.waitForFunction(() => !!document.querySelector('.qr-modal img'), { timeout: 4000 }).catch(() => {});
    const qrImg = await page.$('.qr-modal img');
    const qrSrc = qrImg ? await qrImg.evaluate(el => el.src.slice(0, 22)) : null;
    console.log('QR IMAGE RENDERED:', qrImg !== null, qrSrc || '');
    await jsClick(page, '.qr-modal .close-btn');
  }
  await page.click('.success .primary-btn'); await sleep(300);

  // notifications: admin changed order status earlier? push a notif via admin
  await page.evaluate(() => document.querySelector('.f-bottom a').click());
  await sleep(500);
  await page.evaluate(() => { [...document.querySelectorAll('.admin-nav-btn')].find(b => b.textContent.includes('Đơn hàng')).click(); });
  await sleep(400);
  const sel = await page.$('.status-select');
  if (sel) {
    await sel.select('shipped');
    await sleep(500);
  }
  const notifsLS = await page.evaluate(() => JSON.parse(localStorage.getItem('shop_notifs') || '[]'));
  console.log('NOTIF PUSHED TO LS (order status change):', notifsLS.length > 0, notifsLS[0] ? '-> ' + notifsLS[0].text : '');
  await page.evaluate(() => document.querySelector('.admin-side-foot .ghost-btn:last-child').click());
  await page.waitForFunction(() => window.scrollY === 0, { timeout: 6000 }).catch(() => {});
  await sleep(400);
  await jsClick(page, '.notif-wrap .theme-btn');
  await page.waitForSelector('.notif-panel', { timeout: 4000 }).catch(() => {});
  console.log('NOTIF DOT:', await page.$('.notif-dot') !== null, '| PANEL ITEMS:', (await page.$$('.notif-item')).length);

  // 12. CSV export button exists (orders)
  await page.evaluate(() => document.querySelector('.f-bottom a').click());
  await sleep(500);
  await page.evaluate(() => { [...document.querySelectorAll('.admin-nav-btn')].find(b => b.textContent.includes('Đơn hàng')).click(); });
  await sleep(400);
  console.log('CSV EXPORT BTN:', await page.evaluate(() => [...document.querySelectorAll('.admin-toolbar button')].some(b => b.textContent.includes('CSV'))));

  console.log('\n===== ERRORS (' + errors.length + ') =====');
  [...new Set(errors)].forEach(e => console.log(' -', e));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error('FATAL:', e); process.exit(2); });
