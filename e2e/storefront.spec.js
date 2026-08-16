import { test, expect } from '@playwright/test'

test.describe('Storefront', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.clear())
    await page.goto('/')
  })

  test('home renders hero, flash sale, product grid, footer', async ({ page }) => {
    const errs = []
    page.on('console', m => m.type() === 'error' && errs.push(m.text()))
    await expect(page.locator('h1')).toContainText('Siêu thị Công nghệ')
    await expect(page.locator('.flash-box')).toBeVisible()
    await expect(page.locator('.countdown .cd-unit').first()).toBeVisible()
    await expect(page.locator('.card')).toHaveCount(16)
    await expect(page.locator('.footer')).toContainText('ShopReact')
    expect(errs, 'console errors: ' + errs.join(' | ')).toEqual([])
  })

  test('category filter works', async ({ page }) => {
    await page.click('.chip:has-text("Laptop")')
    await expect(page.locator('.card')).toHaveCount(3)
    await page.click('.chip:has-text("Tất cả")')
    await expect(page.locator('.card')).toHaveCount(16)
  })

  test('search filters products', async ({ page }) => {
    await page.fill('.search', 'iphone')
    await expect(page.locator('.card')).toHaveCount(2)
    await page.fill('.search', 'zzzz')
    await expect(page.locator('.no-result')).toBeVisible()
    await page.fill('.search', '')
    await expect(page.locator('.card')).toHaveCount(16)
  })

  test('sort by price asc/desc', async ({ page }) => {
    await page.selectOption('.select >> nth=0', 'price-asc')
    const first = await page.locator('.card .price').first().innerText()
    expect(first).toContain('3.990.000') // Kindle is cheapest
    await page.selectOption('.select >> nth=0', 'price-desc')
    const firstDesc = await page.locator('.card .price').first().innerText()
    expect(firstDesc).toContain('42.990.000') // MacBook most expensive
  })

  test('price range filter', async ({ page }) => {
    await page.selectOption('.select >> nth=1', 'lt5')
    const count = await page.locator('.card').count()
    expect(count).toBeGreaterThan(0)
    // all shown must be < 5tr
    for (const el of await page.locator('.card .price').all()) {
      const v = Number((await el.innerText()).replace(/\D/g, ''))
      expect(v).toBeLessThan(5000000)
    }
  })

  test('product modal: qty, stock, reviews, add to cart', async ({ page }) => {
    await page.click('.card-name:has-text("Kindle")')
    await expect(page.locator('.product-modal')).toBeVisible()
    await expect(page.locator('.pm-stock')).toContainText('Còn')
    // qty +
    await page.click('.pm-buy .qty button >> nth=1')
    await expect(page.locator('.pm-buy .qty span')).toHaveText('2')
    // submit review
    await page.click('.pm-tabs .tab:has-text("Đánh giá")')
    await page.fill('.review-row input >> nth=1', 'Test review từ e2e')
    await page.click('.review-form .primary-btn')
    await expect(page.locator('.toast')).toContainText('Cảm ơn bạn')
    await expect(page.locator('.review-item')).toContainText('Test review từ e2e')
    // add to cart
    await page.click('.pm-buy .primary-btn')
    await expect(page.locator('.toast')).toContainText('Đã thêm')
    await expect(page.locator('.cart-btn .badge')).toHaveText('2')
  })

  test('wishlist: add, page, move to cart', async ({ page }) => {
    await page.click('.card-name:has-text("Kindle")')
    await page.click('.pm-wish')
    await page.click('.modal-close')
    await page.click('.nav-link:has-text("Yêu thích")')
    await expect(page.locator('.wish-item')).toHaveCount(1)
    await expect(page.locator('.page-title')).toContainText('(1)')
    await page.click('.wish-actions .primary-btn')
    await expect(page.locator('.toast')).toContainText('vào giỏ')
    await expect(page.locator('.wish-item')).toHaveCount(0)
  })

  test('cart drawer: qty, remove, coupon, gift wrap, totals', async ({ page }) => {
    await page.click('.card .add-btn >> nth=0') // MacBook Pro 42.990.000
    await page.click('.cart-btn')
    await expect(page.locator('.drawer.open')).toBeVisible()
    // qty +
    await page.click('.cart-item .qty button >> nth=1')
    // apply FREESHIP
    await page.fill('.coupon-row input', 'FREESHIP')
    await page.click('.coupon-row + * .ghost-btn, .coupon-row ~ .ghost-btn')
    await expect(page.locator('.coupon-applied')).toContainText('FREESHIP')
    // gift wrap
    await page.check('.gift-wrap input')
    await page.uncheck('.gift-wrap input')
    // totals: 2 x 42.990.000 = 85.980.000 > 10tr => free ship
    await expect(page.locator('.sum-row.total strong')).toContainText('85.980.000')
    // remove
    await page.click('.cart-item .remove')
    await expect(page.locator('.empty')).toBeVisible()
  })

  test('coupon validation: min total + invalid code', async ({ page }) => {
    // Cheap product (Kindle 3.990.000) -> VIP20 (min 5tr) must FAIL
    await page.click('.card-name:has-text("Kindle")')
    await page.click('.pm-buy .primary-btn')
    await page.click('.modal-close')
    await page.click('.cart-btn')
    await page.fill('.coupon-row input', 'VIP20')
    await page.click('.coupon-box .ghost-btn')
    await expect(page.locator('.toast')).toContainText('tối thiểu')
    // SAVE50 (min 1tr) should PASS
    await page.fill('.coupon-row input', 'SAVE50')
    await page.click('.coupon-box .ghost-btn')
    await expect(page.locator('.coupon-applied')).toContainText('SAVE50')
    // invalid code
    await page.click('.coupon-applied .close-btn')
    await page.fill('.coupon-row input', 'FAKE99')
    await page.click('.coupon-box .ghost-btn')
    await expect(page.locator('.toast')).toContainText('không tồn tại')
  })

  test('recently viewed appears after opening product', async ({ page }) => {
    await page.click('.card-name:has-text("Kindle")')
    await page.click('.modal-close')
    await expect(page.locator('.recent-section')).toBeVisible()
    await expect(page.locator('.recent-item')).toContainText('Kindle')
  })

  test('dark mode toggle persists', async ({ page }) => {
    await page.click('.theme-btn')
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.click('.theme-btn')
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })

  test('chatbot answers questions', async ({ page }) => {
    await page.click('.bot-fab')
    await expect(page.locator('.bot-box')).toBeVisible()
    await page.click('.bot-quick .hint-chip >> nth=0') // Mã giảm giá?
    await expect(page.locator('.bot-msg.in').last()).toContainText('GIAM10')
  })

  test('out-of-stock guard: cannot add more than stock', async ({ page }) => {
    // PS5 stock = 10. Add 10 via modal, 11th must be blocked
    await page.click('.card-name:has-text("PlayStation")')
    for (let i = 0; i < 9; i++) await page.click('.pm-buy .qty button >> nth=1')
    await page.click('.pm-buy .primary-btn') // qty 10
    await expect(page.locator('.cart-btn .badge')).toHaveText('10')
    await page.click('.pm-buy .primary-btn') // should fail
    await expect(page.locator('.toast')).toContainText('Chỉ còn')
  })
})
