const puppeteer = require('puppeteer');
const fs = require('fs');
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
const nav = (page, label) => page.evaluate((l) => { [...document.querySelectorAll('.nav-link')].find(b => b.textContent.includes(l)).click(); }, label);

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

  // ============ PHASE 1: product page features (no login) ============
  await jsClick(page, '.card .card-img'); await sleep(500);
  const variantChips = await page.$$('.variant-chip');
  console.log('1. VARIANT CHIPS (iPhone):', variantChips.length);
  if (variantChips.length >= 2) {
    const p1 = await page.$eval('.price.big', el => el.textContent);
    await variantChips[1].click(); await sleep(200);
    const p2 = await page.$eval('.price.big', el => el.textContent);
    console.log('   price changes on variant:', p1 !== p2, `(${p1} -> ${p2})`);
  }
  const thumbs = await page.$$('.gallery-thumbs .thumb');
  console.log('2. GALLERY THUMBS:', thumbs.length);
  if (thumbs.length >= 2) {
    const s1 = await page.$eval('.pm-gallery img', el => el.src.slice(0, 30));
    await thumbs[1].click(); await sleep(200);
    const s2 = await page.$eval('.pm-gallery img', el => el.src.slice(0, 30));
    console.log('   image changes on thumb:', s1 !== s2);
  }
  const qaTabs = await page.$$('.pm-tabs .tab');
  await qaTabs[2].click(); await sleep(300);
  const qaInput = await page.$('.qa-form input');
  await setI(page, qaInput, 'Sản phẩm này có bảo hành không?');
  await page.evaluate(() => document.querySelector('.qa-form').requestSubmit());
  await sleep(400);
  console.log('3. Q&A ITEMS AFTER ASK:', (await page.$$('.qa-item')).length);
  await jsClick(page, '.modal-close'); await sleep(300);

  // ============ PHASE 2: register user (so orders/alerts are tied to a user) ============
  await jsClick(page, '.login-btn'); await sleep(500);
  await jsClick(page, '.switch-mode a'); await sleep(400);
  let rf = await page.$$('.auth-form input');
  await setI(page, rf[0], 'User C'); await setI(page, rf[1], '0904444444');
  await setI(page, rf[3], 'c@test.com'); await setI(page, rf[4], 'pass123');
  await solveCaptcha(page);
  await page.evaluate(() => document.querySelector('.auth-form').requestSubmit());
  await sleep(700);
  console.log('REGISTERED:', await page.$('.user-chip') !== null);

  // ============ PHASE 3: cart features (logged in) ============
  // PRICE ALERT (logged in -> carries email)
  await jsClick(page, '.card .card-img'); await sleep(500);
  const alertInputs = await page.$$('.alert-box input');
  await setI(page, alertInputs[0], '30000000');
  await setI(page, alertInputs[1], '0901234567');
  await jsClick(page, '.alert-box .ghost-btn'); await sleep(300);
  const pa = await page.evaluate(() => JSON.parse(localStorage.getItem('shop_price_alerts') || '[]'));
  console.log('4. PRICE ALERT SAVED (with email):', pa.length === 1 && !!pa[0].email);
  await jsClick(page, '.modal-close'); await sleep(300);

  // add AirPods (4.99M) — under 10M so zone shipping applies
  await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.card')];
    cards.find(c => c.querySelector('.card-name')?.textContent === 'AirPods Pro 2').querySelector('.add-btn').click();
  });
  await sleep(400);
  await jsClick(page, '.cart-btn'); await page.waitForSelector('.drawer.open', { timeout: 4000 });
  const shipRow = () => page.evaluate(() => [...document.querySelectorAll('.drawer .sum-row.sub')].find(r => r.textContent.includes('Phí ship'))?.textContent || 'NF');
  const ship1 = await shipRow();
  await page.select('.zone-select', 'other'); await sleep(400);
  const ship2 = await shipRow();
  console.log('5. ZONE SHIPPING CHANGES:', ship1 !== ship2, `(${ship1} -> ${ship2})`);
  // add Sony (same category Phụ kiện) -> combo; qty 2 -> qty discount
  await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.card')];
    cards.find(c => c.querySelector('.card-name')?.textContent === 'Sony WH-1000XM5').querySelector('.add-btn').click();
  });
  await sleep(400);
  console.log('6. COMBO DISCOUNT (2 same-cat):', await page.$eval('.drawer', el => el.textContent.includes('Combo')));
  await page.evaluate(() => { const b = document.querySelector('.cart-item .qty button:last-child'); b.click(); });
  await sleep(400);
  console.log('   QTY DISCOUNT (qty>=2):', await page.$eval('.drawer', el => el.textContent.includes('số lượng')));
  console.log('7. UPSELL ITEMS IN CART:', (await page.$$('.upsell-item')).length);
  await jsClick(page, '.cart-btn'); await sleep(400);

  // ============ PHASE 4: checkout (installment) — order saved to user C ============
  await jsClick(page, '.checkout-btn'); await page.waitForSelector('.modal .auth-form', { timeout: 4000 });
  await page.evaluate(() => {
    const form = document.querySelector('.auth-form');
    const ins = form.querySelectorAll('input');
    const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    s.call(ins[1], '0904444444'); ins[1].dispatchEvent(new Event('input', { bubbles: true }));
    const ta = form.querySelector('textarea');
    const s2 = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    s2.call(ta, '123 Test St'); ta.dispatchEvent(new Event('input', { bubbles: true }));
    [...document.querySelectorAll('.pay-opt')].find(l => l.textContent.includes('Chuyển khoản')).querySelector('input').click();
  });
  await sleep(300);
  console.log('8. INSTALLMENT BOX:', await page.$('.installment-box') !== null);
  await page.evaluate(() => document.querySelector('.installment-box input[type="checkbox"]').click());
  await sleep(300);
  const plans = await page.$$('.inst-plan');
  console.log('   plans:', plans.length, '| select 12x');
  await page.evaluate(() => { [...document.querySelectorAll('.inst-plan')][2].click(); });
  await sleep(200);
  console.log('   selected:', await page.$eval('.inst-plan.active strong', el => el.textContent));
  await page.evaluate(() => document.querySelector('.auth-form').requestSubmit());
  await sleep(700);
  console.log('   ORDER SUCCESS:', await page.$('.success') !== null);
  const orderSaved = await page.evaluate(() => JSON.parse(localStorage.getItem('shop_users')).find(u => u.email === 'c@test.com').orders.length);
  console.log('   ORDER SAVED TO USER:', orderSaved === 1);
  await jsClick(page, '.success .primary-btn'); await sleep(400);

  // ============ PHASE 5: grid/list + blog + exit intent ============
  const toggleBtns = await page.$$('.view-toggle button');
  await toggleBtns[1].click(); await sleep(300);
  console.log('9. LIST VIEW ACTIVE:', await page.$eval('.grid', el => el.classList.contains('grid-list')));
  await toggleBtns[0].click(); await sleep(200);
  await nav(page, 'Tin'); await sleep(500);
  const blogCards = await page.$$('.blog-card');
  console.log('10. BLOG CARDS:', blogCards.length);
  await blogCards[0].click(); await sleep(400);
  console.log('   article opens:', await page.$('.blog-article') !== null);
  await jsClick(page, '.blog-back'); await sleep(300);
  await page.mouse.move(640, 300); await page.mouse.move(640, -50); await sleep(600);
  const exitModal = await page.$('.exit-modal');
  console.log('11. EXIT INTENT MODAL:', exitModal !== null, exitModal ? '| code: ' + await page.$eval('.exit-code', el => el.textContent) : '');
  if (exitModal) { await jsClick(page, '.exit-modal .ghost-btn'); await sleep(200); }

  // ============ PHASE 6: profile (checkin, badges, buy-again) ============
  await page.waitForFunction(() => window.scrollY === 0, { timeout: 6000 }).catch(() => {});
  await jsClick(page, '.user-chip');
  await page.waitForSelector('.profile-card', { timeout: 4000 });
  console.log('12. CHECKIN CARD:', await page.$('.checkin-card') !== null);
  const ptsBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('shop_users')).find(u => u.email === 'c@test.com').points);
  await jsClick(page, '.checkin-btn'); await sleep(500);
  const ptsAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('shop_users')).find(u => u.email === 'c@test.com').points);
  console.log('   checkin gives points:', ptsAfter > ptsBefore, `(${ptsBefore} -> ${ptsAfter})`);
  console.log('13. BADGES TOTAL / EARNED:', (await page.$$('.badge-item')).length, '/', (await page.$$('.badge-item.earned')).length);
  await page.evaluate(() => { [...document.querySelectorAll('.tab')].find(b => b.textContent.includes('Đơn hàng')).click(); });
  await page.waitForSelector('.order-item', { timeout: 4000 });
  const cartBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]').reduce((s, i) => s + i.qty, 0));
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.order-actions .ghost-btn')];
    btns.find(b => b.textContent.includes('Mua lại')).click();
  });
  await sleep(500);
  const cartAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '[]').reduce((s, i) => s + i.qty, 0));
  console.log('14. BUY AGAIN (cart grows):', cartAfter > cartBefore, `(${cartBefore} -> ${cartAfter})`);

  // ============ PHASE 7: admin ============
  await page.evaluate(() => { const a = document.querySelector('.f-bottom a'); a && a.click(); });
  await sleep(600);
  const ai = await page.$$('.admin-login .auth-form input');
  await setI(page, ai[0], 'admin@shopreact.vn'); await setI(page, ai[1], 'admin123');
  await page.evaluate(() => document.querySelector('.admin-login .auth-form').requestSubmit());
  await sleep(700);

  const funnelVals = await page.evaluate(() => [...document.querySelectorAll('.funnel-val')].map(e => e.textContent));
  console.log('15. FUNNEL (views/carts/orders):', funnelVals.join('/'));

  // alerts: notify price alert customer
  await page.evaluate(() => { [...document.querySelectorAll('.admin-nav-btn')].find(b => b.textContent.includes('Báo giá')).click(); });
  await sleep(500);
  console.log('16. ALERT ITEMS:', (await page.$$('.alert-item')).length);
  const notifyOk = await page.evaluate(() => {
    const b = [...document.querySelectorAll('.alert-item .ghost-btn')].find(x => x.textContent.includes('Thông báo'));
    if (b) { b.click(); return true; } return false;
  });
  await sleep(500);
  const notifs1 = await page.evaluate(() => JSON.parse(localStorage.getItem('shop_notifs') || '[]'));
  console.log('   notified customer:', notifyOk && notifs1.some(n => n.text.includes('giảm giá')));
  // answer a Q&A
  const qaAnswered = await page.evaluate(() => {
    const b = [...document.querySelectorAll('.alert-item .ghost-btn')].find(x => x.textContent.includes('Trả lời'));
    if (b) { b.click(); return true; } return false;
  });
  if (qaAnswered) {
    await sleep(300);
    const inp = await page.$('.qa-answer-row input');
    await setI(page, inp, 'Có ạ, bảo hành 12 tháng chính hãng!');
    await page.evaluate(() => { const b = document.querySelector('.qa-answer-row .ghost-btn'); b.click(); });
    await sleep(400);
    const answered = await page.evaluate(() => {
      const all = JSON.parse(localStorage.getItem('shop_qa') || '{}');
      return Object.values(all).flat().some(x => x.a);
    });
    console.log('   Q&A ANSWERED:', answered);
  }

  // blog admin
  await page.evaluate(() => { [...document.querySelectorAll('.admin-nav-btn')].find(b => b.textContent.includes('Tin tức')).click(); });
  await sleep(400);
  await jsClick(page, '.admin-toolbar .primary-btn'); await sleep(400);
  const baInputs = await page.$$('.modal .auth-form input, .modal .auth-form textarea');
  await setI(page, baInputs[0], 'Bài viết test tự động');
  await setI(page, baInputs[baInputs.length - 1], 'Nội dung bài viết test cho kiểm thử.');
  await page.evaluate(() => { const m = document.querySelector('.modal form'); if (m) m.requestSubmit(); });
  await sleep(500);
  const blogPosts = await page.evaluate(() => JSON.parse(localStorage.getItem('shop_blog') || '[]'));
  console.log('17. BLOG POST CREATED:', blogPosts.length === 1, blogPosts[0] ? '-> ' + blogPosts[0].title : '');

  // CSV import
  await page.evaluate(() => { [...document.querySelectorAll('.admin-nav-btn')].find(b => b.textContent.includes('Sản phẩm')).click(); });
  await sleep(400);
  const csvPath = '/tmp/import-test.csv';
  fs.writeFileSync(csvPath, 'name,category,price,stock\nTest Phone X,Điện thoại,1000000,5\nTest Watch Y,Phụ kiện,2000000,10\n');
  const importInput = await page.$('input[type="file"]');
  await importInput.uploadFile(csvPath);
  await sleep(900);
  const custom = await page.evaluate(() => JSON.parse(localStorage.getItem('shop_custom_products') || '[]'));
  console.log('18. CSV IMPORT:', custom.length === 2, custom.map(p => p.name).join(', '));

  // RETURN FLOW: set order delivered -> user requests -> admin approves -> refund
  await page.evaluate(() => { [...document.querySelectorAll('.admin-nav-btn')].find(b => b.textContent.includes('Đơn hàng')).click(); });
  await sleep(400);
  const sels = await page.$$('.status-select');
  if (sels.length) { await sels[0].select('delivered'); await sleep(400); }
  await page.evaluate(() => document.querySelector('.admin-side-foot .ghost-btn:last-child').click());
  await sleep(500);
  await jsClick(page, '.user-chip');
  await page.waitForSelector('.profile-card', { timeout: 4000 });
  await page.evaluate(() => { [...document.querySelectorAll('.tab')].find(b => b.textContent.includes('Đơn hàng')).click(); });
  await page.waitForSelector('.order-item', { timeout: 4000 });
  await sleep(300);
  const retBtn = await page.evaluate(() => {
    const b = [...document.querySelectorAll('.order-actions .ghost-btn')].find(x => x.textContent.toLowerCase().includes('đổi trả'));
    if (b) { b.click(); return true; } return false;
  });
  console.log('19. RETURN BTN AFTER DELIVERED:', retBtn);
  if (retBtn) {
    const rtTa = await page.$('.modal textarea');
    await setI(page, rtTa, 'Hàng bị trầy xước');
    await jsClick(page, '.modal .primary-btn'); await sleep(500);
    const pending = await page.evaluate(() => {
      const u = JSON.parse(localStorage.getItem('shop_users')).find(u => u.email === 'c@test.com');
      return u.orders.some(o => o.return && o.return.status === 'pending');
    });
    console.log('   RETURN PENDING:', pending);
    // admin approves
    await page.evaluate(() => { const a = document.querySelector('.f-bottom a'); a && a.click(); });
    await sleep(500);
    await page.evaluate(() => { [...document.querySelectorAll('.admin-nav-btn')].find(b => b.textContent.includes('Đổi trả')).click(); });
    await sleep(400);
    const approveBtn = await page.evaluate(() => {
      const b = [...document.querySelectorAll('.row-actions .ghost-btn')].find(x => x.textContent.includes('Duyệt'));
      if (b) { b.click(); return true; } return false;
    });
    await sleep(600);
    const bal = await page.evaluate(() => JSON.parse(localStorage.getItem('shop_users')).find(u => u.email === 'c@test.com').balance);
    const notifs2 = await page.evaluate(() => JSON.parse(localStorage.getItem('shop_notifs') || '[]'));
    console.log('   ADMIN APPROVED:', approveBtn);
    console.log('   REFUNDED TO WALLET:', bal > 0, `-> ${bal}`);
    console.log('   user notified of refund:', notifs2.some(n => n.text.includes('hoàn vào ví')));
  }

  console.log('\n===== ERRORS (' + errors.length + ') =====');
  [...new Set(errors)].forEach(e => console.log(' -', e));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error('FATAL:', e); process.exit(2); });
