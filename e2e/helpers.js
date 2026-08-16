// shared helpers
export async function registerUser(page, { name = 'Test User', email, phone = '0901234567', password = 'pass123' } = {}) {
  email = email || ('user' + Math.random().toString(36).slice(2, 8) + '@test.com')
  await page.click('.login-btn')
  await page.waitForSelector('.auth-form')
  await page.click('.switch-mode a') // -> register
  await page.waitForTimeout(100)
  await page.fill('.auth-form input >> nth=0', name)
  await page.fill('.auth-form input >> nth=1', phone)
  await page.fill('.auth-form input[type="email"]', email)
  await page.fill('.auth-form input[type="password"]', password)
  await page.click('.auth-form button[type="submit"]')
  await page.waitForTimeout(300)
  return { email, password, name, phone }
}

export async function loginAs(page, email, password) {
  await page.click('.login-btn')
  await page.waitForSelector('.auth-form')
  await page.fill('.auth-form input[type="email"]', email)
  await page.fill('.auth-form input[type="password"]', password)
  await page.click('.auth-form button[type="submit"]')
  await page.waitForTimeout(300)
}

export async function openProduct(page, name) {
  await page.click(`.card-name:has-text("${name}")`)
  await page.waitForSelector('.product-modal')
}

export async function addToCartFromModal(page) {
  await page.click('.product-modal .pm-buy .primary-btn')
}
