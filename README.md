# 🛍️ ShopReact — Website E-commerce React (v2)

Website bán hàng công nghệ hoàn chỉnh với **khu vực Quản trị (Admin Panel 10 tab)**, build với **React 19 + Vite 8**, giao diện **Liquid Glass** (kính mờ, gradient động). Frontend đồng bộ với **server Node.js có database trong RAM** (tự lưu ra file định kỳ khi có thay đổi) — ảnh upload lưu trên disk của server, không cần cài thêm thư viện nào cho server.

![react](https://img.shields.io/badge/React-19.2.8-61dafb) ![vite](https://img.shields.io/badge/Vite-8.2.1-646cff) ![icons](https://img.shields.io/badge/Icons-Lucide-6c5ce7) ![i18n](https://img.shields.io/badge/Lang-vi%2Fen-00b894) ![pwa](https://img.shields.io/badge/PWA-ready-6c5ce7) ![db](https://img.shields.io/badge/DB-in--RAM%20%2B%20auto--persist-00b894) ![tests](https://img.shields.io/badge/Tests-4%20suites%20PASS-00b894)

## ✨ Tính năng (~80)

### 🛒 Cửa hàng (Storefront)
- 16+ sản phẩm với **ảnh thật**, chi tiết (modal: mô tả, chọn số lượng, tồn kho)
- ⭐ **Đánh giá & nhận xét** (gắn sao 1–5, điểm trung bình tự tính) + **🔢 CAPTCHA chống spam** khi đánh giá
- ❤️ **Yêu thích / Wishlist** (trang riêng, chuyển thẳng vào giỏ)
- 🔍 **Tìm kiếm** + **gợi ý autocomplete** (5 kết quả) + **🎤 tìm bằng giọng nói** (Web Speech API)
- Lọc danh mục, sắp xếp (giá/đánh giá/mới), lọc khoảng giá, **🖼️ chuyển Grid/List view**, phân trang "Xem thêm"
- 🎟️ **Mã giảm giá**: `GIAM10` · `SAVE50` · `VIP20` · `FREESHIP` · `MAU10` (min-total, admin thêm được mã mới)
- ⚡ **Flash sale + lịch hẹn giờ** (admin đặt giờ bắt đầu/kết thúc) + đồng hồ đếm ngược
- 📦 **Quản lý tồn kho**: giảm khi mua, "sắp hết", "hết hàng", chặn vượt stock
- 🎀 Đóng gói quà tặng (+25K) · 🕘 Xem gần đây · 📖 **Sản phẩm tương tự**
- ⚖️ **So sánh tối đa 4 sản phẩm** (thanh so sánh nổi + bảng so sánh)
- 🚚 **Thanh tiến độ miễn phí ship** (đơn từ 10 triệu)
- 🎨 **Biến thể sản phẩm** (dung lượng/bản — giá tự điều chỉnh)
- 📸 **Gallery nhiều ảnh** (ảnh thật + 2 ảnh chi tiết sinh động, bấm thumb để đổi)
- ❓ **Hỏi đáp sản phẩm (Q&A)**: khách hỏi, chủ shop trả lời từ admin
- 📉 **Báo giá giảm** + 📋 **Báo có hàng** (để SĐT → admin thông báo khi đạt điều kiện)
- 🎡 **Vòng quay may mắn** (spin-to-win, 1 lần/ngày, ra mã giảm giá — ô quay hiển thị cả mã)
- 🚪 **Exit-intent popup** (khách định rời trang → tặng mã `MAU10`, đóng được bằng nút "Để lại")
- 🌐 **Đa ngôn ngữ vi/en** (1 nút chuyển, ghi nhớ)
- 🌙 **Dark mode** (liquid glass cả 2 chế độ, ghi nhớ)
- 📱 **PWA** (manifest + service worker, offline, cài đặt được)
- 🧭 **Hash routing** (`#/home`, `#/wishlist`... — link chia sẻ được, nút back hoạt động)

### 🛒 Giỏ hàng & Thanh toán
- 🧺 **Upsell "Gợi ý thêm"** trong giỏ (sản phẩm cùng danh mục, rating cao)
- 🎁 **Combo cùng danh mục −5%** (mua 2+ SP cùng danh mục)
- 📊 **Giảm theo số lượng** (2+: −3%, 3+: −6%)
- 🚚 **Phí ship theo vùng** (TP.HCM 30K / Hà Nội 35K / Tỉnh 45K)
- 💳 **Trả góp 0%** (3x/6x/12x, hiển thị tiền mỗi tháng)
- 3 phương thức: COD · Ví điện tử · Chuyển khoản + **📱 QR VietQR** (quét để chuyển khoản)
- 📝 **Ghi chú đơn hàng** · 📍 **Sổ địa chỉ** (lưu & chọn nhanh khi checkout)
- 🎁 Dùng điểm thưởng khi thanh toán
- Miễn phí ship đơn từ 10 triệu hoặc mã `FREESHIP`

### 👤 Tài khoản & Loyalty
- Đăng ký / đăng nhập / đăng xuất (localStorage) + **🔢 CAPTCHA chống spam** khi đăng ký
- Đăng ký tặng **50K + 100 điểm** 🎁
- **🤝 Giới thiệu bạn bè**: nhập mã khi đăng ký → **cả 2 bên cùng nhận 20K**
- **Điểm thưởng loyalty**: 10K = 1 điểm, 1000 điểm = 10K khi thanh toán
- Hạng thành viên: Bronze → Silver → Gold → 💎 Diamond + **thanh tiến độ lên hạng**
- **📅 Điểm danh ngày**: nhận 10–50 điểm (tăng theo chuỗi ngày)
- **🏅 Thành tựu (badges)**: Đơn đầu tiên, Khách thân thiết, Tỷ phú, VIP, Sưu tầm, Đánh giá viên, Siêu chăm, Thích quà
- Hồ sơ: thống kê, chỉnh sửa thông tin, lịch sử đơn hàng
- 📷 **Avatar upload**: chọn ảnh từ máy (tự lưu server, fallback data-URL khi offline) + xóa ảnh
- **🔁 Mua lại đơn cũ** (1 nút, tự tra giá/tồn kho hiện tại)
- 📍 **Theo dõi đơn hàng** (timeline 4 bước) + hủy đơn COD
- **🔄 Đổi trả**: khách yêu cầu (đơn đã giao) → admin duyệt/từ chối → **tự động hoàn tiền vào ví** + thông báo

### 👛 Ví điện tử
- Nạp tiền (preset 100K–5M hoặc tùy chỉnh, 3 phương thức)
- Lịch sử giao dịch
- **🃏 Đổi thẻ quà tặng** (admin phát mã `GC-XXXXXX`)
- Thanh toán nhanh bằng ví khi checkout

### 🤖 Trải nghiệm
- 🤖 **ShopBot** chatbot (giá, ship, mã giảm giá, bảo hành, tích điểm)
- 🔔 **Chuông thông báo** (đổi trạng thái đơn, hoàn tiền, báo giá/hàng — phân biệt theo user)
- 🔔 Toast notifications · 📬 Newsletter + FAQ
- 📰 **Blog/Tin tức** (3 bài mẫu + admin viết thêm, trang đọc riêng)
- Responsive đầy đủ (mobile → desktop)

---

## 🛡️ Khu vực Quản trị (Admin Panel)

Truy cập: link **"🛡️ Quản trị"** ở cuối trang (footer).

> **Tài khoản demo:** `admin@shopreact.vn` / `admin123` (đổi được trong Cài đặt)

### 📊 Tổng quan (Dashboard)
- 4 thẻ thống kê: **Doanh thu** (tính từ đơn đã thanh toán), tổng đơn, khách hàng, sản phẩm
- 📈 **Biểu đồ doanh thu 6 tháng gần nhất**
- 🧮 **Phễu bán hàng**: xem sản phẩm → thêm giỏ → đặt hàng + tỷ lệ chuyển đổi
- 🏆 Top 5 sản phẩm bán chạy (biểu đồ thanh)
- ⚠️ Cảnh báo hàng sắp hết (≤ 5)
- 🕘 5 đơn hàng mới nhất

### 📦 Đơn hàng
- Bảng đơn hàng gộp từ tất cả khách, lọc theo 6 trạng thái + tìm kiếm
- Đổi trạng thái trực tiếp (khách nhận **thông báo** khi đổi)
- Chi tiết đơn: khách, địa chỉ, sản phẩm (có ảnh), hóa đơn đầy đủ, timeline 5 bước
- 🖨️ **In hóa đơn** (cửa sổ in riêng) · 📤 **Xuất CSV**

### 📱 Sản phẩm
- **Sửa** giá, giá gốc, tồn kho, tên, danh mục, ảnh, mô tả, flash sale
- 📤 **Ảnh sản phẩm**: nhập URL (ngoài/emoji) **hoặc tải file từ trình duyệt** (lưu server disk, có preview)
- ⏰ **Lịch flash sale**: đặt giờ bắt đầu / kết thúc (badge chỉ hiện khi đang chạy)
- **Thêm** sản phẩm mới · **Xóa** sản phẩm
- 📥 **Nhập CSV hàng loạt** (name, category, price, oldPrice, stock, image, desc) · 📤 Xuất CSV
- Thay đổi phản ánh **ngay lập tức** trên cửa hàng

### 👥 Khách hàng
- Xem thông tin, số đơn, tổng chi, số dư, điểm, mã giới thiệu
- 🎭 **Phân nhóm khách hàng**: 💎 VIP · ⭐ Thường xuyên · 🌱 Mới · 😴 Không hoạt động (lọc theo nhóm)
- 🔒 **Khóa / mở khóa** tài khoản · 🔐 Đặt lại mật khẩu · 💰 Chỉnh số dư ví (+/−) · 🗑️ Xóa tài khoản
- 📤 **Xuất CSV**

### 🎟️ Mã giảm giá
- Xem 4 mã mặc định (bảo vệ, không xóa được)
- **Thêm mã tùy chỉnh**: giảm % (có trần), giảm cố định, miễn phí ship + điều kiện đơn tối thiểu

### 🎁 Thẻ quà tặng
- **Tạo thẻ** (mệnh giá preset hoặc tùy chỉnh) → mã `GC-XXXXXX`
- Sao chép mã để gửi khách · Xóa thẻ chưa dùng · Xem thẻ đã dùng (ai, khi nào)
- 📤 Xuất CSV

### 🔔 Báo giá/hàng + Q&A
- 📉 **Báo giá giảm**: khách để SĐT + giá mong muốn → admin bấm **Thông báo** khi hạ giá (khách nhận thông báo trong app)
- 📋 **Báo có hàng**: khách chờ hàng hết → admin thông báo khi nhập hàng
- ❓ **Trả lời Q&A** sản phẩm (câu hỏi từ khách)

### ↩️ Đổi trả
- Danh sách yêu cầu đổi trả (đơn, khách, số tiền, lý do, ngày)
- **Duyệt** → tự động **hoàn tiền vào ví khách** + thông báo · **Từ chối** → thông báo

### 📰 Tin tức
- **Viết bài blog** (tiêu đề, tóm tắt, nội dung — ảnh tự sinh)
- Xóa bài (bài mẫu không xóa được)

### 📈 Hoạt động
- Log **60 sự kiện gần nhất**: đăng ký, đặt hàng, đổi trạng thái, sản phẩm, khách, mã, thẻ quà, giới thiệu, đổi trả, blog...

### ⚙️ Cài đặt
- Đổi mật khẩu quản trị
- ⚠️ Reset toàn bộ dữ liệu cửa hàng

---

## 🗄️ Database (server Node.js — không cần cài thêm thư viện)

Project có kèm **server Node.js thuần** (`server/index.js`) làm database:

- **DB trong RAM** — toàn bộ dữ liệu chung (user, giỏ, wishlist, review, tồn kho, đơn, mã, Q&A, thẻ quà, blog, log...) nằm trong một object trong bộ nhớ.
- **Load khi khởi động** — server đọc `data/db.json` (nếu có) vào RAM lúc start.
- **Lưu file định kỳ khi có thay đổi** — mỗi thay đổi đánh dấu "dirty", server tự ghi `data/db.json` mỗi **2 giây** (viết atomic qua file `.tmp` + rename) và ghi lần cuối khi tắt server (SIGINT/SIGTERM).
- **Ảnh lưu trên disk** — upload ảnh (sản phẩm, avatar) → lưu `data/uploads/<id>.<ext>` → serve tại `/uploads/<id>.<ext>` (cache immutable, chặn path traversal, giới hạn 8MB).
- **Đồng bộ với frontend** (`src/utils/db.js`):
  - Khi mở app: kéo DB từ server vào `localStorage` (server là nguồn sự thật), sau đó đẩy ngược các key chỉ có ở local (lần đầu / tạo khi offline).
  - Trong lúc dùng: watcher 1s so sánh 28 key chung, tự push thay đổi (debounce 0.8s, retry sau 5s, `sendBeacon` khi đóng tab).
  - **Offline-resilient**: tắt server thì app vẫn chạy hoàn toàn bằng `localStorage`; mở lại server thì tự đồng bộ.

**API server** (port 3001):

| Endpoint | Phương | Chức năng |
|---|---|---|
| `/api/health` | GET | kiểm tra server (uptime, số key, dirty) |
| `/api/db` | GET | snapshot toàn bộ DB |
| `/api/db/key` | POST | upsert 1 key (`{key, value}`; `value: null` = xóa) |
| `/api/db/bulk` | POST | upsert nhiều key `{keys: {...}}` (dùng khi đóng tab) |
| `/api/upload` | POST | upload ảnh (multipart, `Content-Type: image/*`) → `{url: "/uploads/..."}` |
| `/uploads/<file>` | GET | serve ảnh đã upload |

> Trong dev, Vite **proxy** `/api` + `/uploads` sang port 3001 (`vite.config.js`) nên frontend gọi cùng origin.
> Biến môi trường: `PORT` (mặc định 3001), `SHOP_DATA_DIR` (mặc định `./data`), `SAVE_INTERVAL_MS` (mặc định 2000).

## 🚀 Chạy project

```bash
# Yêu cầu: Node.js 20.19+ (hoặc 22.12+)
npm install
npm run dev:all    # chạy server (3001) + frontend (5173) cùng lúc
```

Chạy tách 2 terminal:
```bash
npm run dev:server # chỉ server DB (http://localhost:3001)
npm run dev        # chỉ frontend (http://localhost:5173)
```

Build production:
```bash
npm run build      # output: dist/
npm run preview    # xem build (PWA hoạt động ở đây)
npm start          # chạy server (serve /api + /uploads)
```

> **Không bật server?** App vẫn chạy bình thường bằng `localStorage` (offline mode) — ảnh upload khi đó tự lưu dạng data-URL.
>
> **Lưu ý tunnel:** nếu truy cập qua tunnel (ngrok, pinggy...), config đã bật
> `server.allowedHosts: true` trong `vite.config.js` nên hoạt động ngay.

## 📁 Cấu trúc

```
shop-react/
├── index.html                  # + favicon SVG, meta, manifest (PWA)
├── vite.config.js              # + proxy /api + /uploads → server 3001
├── package.json                # scripts: dev:all, dev:server, start
├── README.md
├── server/
│   └── index.js                # ⭐ DB trong RAM + auto-persist + upload ảnh (Node thuần, 0 dep)
├── scripts/
│   └── dev-all.js              # chạy server + Vite cùng lúc
├── data/                       # dữ liệu runtime (đã gitignore)
│   ├── db.json                 # snapshot DB (ghi định kỳ 2s khi có thay đổi)
│   └── uploads/                # ảnh upload (sản phẩm, avatar)
├── public/
│   ├── images/                 # 16 ảnh sản phẩm thật (đã nén)
│   ├── manifest.webmanifest    # PWA
│   └── sw.js                   # service worker (offline)
└── src/
    ├── main.jsx                # initDb() trước khi render + đăng ký service worker
    ├── App.jsx                 # điều hướng hash + lọc/sắp xếp + grid/list + pagination
    ├── index.css               # theme Liquid Glass (light + dark) + admin + 40+ component mới
    ├── data/
    │   ├── products.js         # 16 sản phẩm (tồn kho, flash, biến thể)
    │   ├── coupons.js          # mã giảm giá (dạng serializable)
    │   └── blog.js             # 3 bài blog mẫu
    ├── utils/
    │   ├── format.js           # format tiền VND
    │   ├── orderStatus.js      # 6 trạng thái đơn hàng
    │   ├── i18n.jsx            # đa ngôn ngữ vi/en (~150 key)
    │   ├── flash.js            # lịch flash sale
    │   ├── csv.js              # xuất CSV (BOM UTF-8)
    │   ├── track.js            # phễu bán hàng (views/carts/orders)
    │   ├── badges.js           # 8 thành tựu
    │   ├── segments.js         # phân nhóm khách hàng
    │   ├── imggen.js           # sinh ảnh SVG (gallery, blog)
    │   ├── db.js               # ⭐ đồng bộ localStorage ↔ server DB (boot/push/beacon)
    │   └── upload.js           # ⭐ uploadImage (server-first) + fileToDataUrl (fallback)
    ├── context/
    │   ├── ThemeContext.jsx    # dark mode
    │   ├── ToastContext.jsx    # thông báo
    │   ├── AuthContext.jsx     # user, ví, điểm, đơn, giới thiệu, thẻ quà, điểm danh, đổi trả
    │   ├── StoreContext.jsx    # wishlist, review, tồn kho, Q&A, báo giá/hàng
    │   ├── CartContext.jsx     # giỏ, mã, quà, combo, giảm SL, vùng ship
    │   ├── AdminContext.jsx    # admin + API quản trị (10 nhóm)
    │   ├── CompareContext.jsx  # so sánh sản phẩm
    │   └── NotifyContext.jsx   # chuông thông báo (phân theo user)
    ├── components/
    │   ├── Ic.jsx / Emj.jsx / ProductImg.jsx
    │   ├── Navbar.jsx          # + autocomplete, voice, lang, chuông
    │   ├── ProductCard.jsx     # + nút so sánh
    │   ├── ProductModal.jsx    # + biến thể, gallery, Q&A, báo giá/hàng, captcha
    │   ├── CartDrawer.jsx      # + upsell, combo, vùng ship
    │   ├── CheckoutModal.jsx   # + ghi chú, sổ địa chỉ, trả góp, QR
    │   ├── QRModal.jsx         # QR VietQR
    │   ├── FlashSale.jsx       # + lịch hẹn giờ
    │   ├── Compare.jsx         # thanh + bảng so sánh
    │   ├── FreeShippingBar.jsx # thanh tiến độ miễn phí ship
    │   ├── SpinWheel.jsx       # vòng quay may mắn
    │   ├── ExitIntentPopup.jsx # popup giữ chân
    │   ├── NotificationsBell.jsx
    │   ├── CheckinCard.jsx     # điểm danh ngày
    │   ├── Badges.jsx          # thành tựu
    │   ├── Captcha.jsx         # captcha toán
    │   ├── ChatBot.jsx / Footer.jsx
    └── pages/
        ├── AuthPage.jsx        # + captcha, mã giới thiệu
        ├── WalletPage.jsx      # ví + nạp + đổi thẻ quà
        ├── ProfilePage.jsx     # hồ sơ + checkin + badges + đổi trả + mua lại
        ├── WishlistPage.jsx
        ├── BlogPage.jsx        # tin tức + đọc bài
        └── admin/
            ├── AdminLogin.jsx
            ├── AdminLayout.jsx # sidebar 10 tab
            ├── Dashboard.jsx   # + biểu đồ doanh thu + phễu
            ├── OrdersAdmin.jsx # + in hóa đơn + CSV
            ├── ProductsAdmin.jsx # + lịch flash + nhập CSV
            ├── UsersAdmin.jsx  # + phân nhóm
            ├── CouponsAdmin.jsx
            ├── GiftCardsAdmin.jsx
            ├── AlertsAdmin.jsx # báo giá/hàng + Q&A
            ├── ReturnsAdmin.jsx
            ├── BlogAdmin.jsx
            ├── ActivityAdmin.jsx
            └── SettingsAdmin.jsx
```

## 🧪 Kiểm thử

Test tự động bằng **Puppeteer + Chromium** (headless) — **toàn bộ PASS, 0 console error, 0 HTTP error**:

| Bộ test | Nội dung | Kết quả |
|---------|---------|:---:|
| `smoke-test.cjs` | Luồng cốt lõi: 13 phase — lọc, tìm, review (+captcha), wishlist, giỏ, mã giảm giá, checkout, ví, nạp tiền, hồ sơ, admin 10 tab, dark mode, flash, chatbot | ✅ |
| `smoke2.cjs` | Tính năng v1: spin wheel, autocomplete, similar, so sánh, free-ship bar, hash routing, đa ngôn ngữ, giới thiệu (+20K), gift card, biểu đồ doanh thu, lịch flash, QR, thông báo, CSV | ✅ |
| `smoke3.cjs` | Tính năng A+B: biến thể, gallery, Q&A, báo giá, vùng ship, combo, giảm SL, upsell, trả góp, grid/list, blog, exit-intent, điểm danh, badges, mua lại, phễu, alert+Q&A admin, blog admin, nhập CSV, đổi trả→hoàn tiền | ✅ |
| `smoke4.cjs` | Phân nhóm khách hàng (VIP/thường xuyên/mới/không hoạt động) + CAPTCHA (đúng/sai ở đăng ký & review) | ✅ |

```bash
node smoke-test.cjs   # chạy từng bộ (dev server cần đang bật)
node smoke2.cjs
node smoke3.cjs
node smoke4.cjs
```

## 📌 Tài khoản demo & mã

| Mục | Giá trị |
|-----|---------|
| Admin | `admin@shopreact.vn` / `admin123` |
| Khách | tự đăng ký (tặng 50K + 100 điểm) |
| Mã giảm giá | `GIAM10` · `SAVE50` · `VIP20` · `FREESHIP` · `MAU10` (exit-intent) |
| Thẻ quà | admin tạo ở tab "Thẻ quà tặng" |
| Mã giới thiệu | xem ở Hồ sơ của mỗi user |

## 🛠️ Stack & phiên bản

| Package | Version |
|---------|---------|
| react / react-dom | 19.2.8 |
| vite | 8.2.1 (Rolldown) |
| @vitejs/plugin-react | 6.0.5 (Oxc) |
| lucide-react | 1.31.0 |
| qrcode | 1.5.x (QR VietQR) |
| puppeteer | dev (kiểm thử) |
| Node.js (server) | 20.19+ — server DB thuần, **0 dependency** |

## 📝 Ghi chú

- **Dữ liệu chung** (tài khoản, giỏ, wishlist, review, tồn kho, điểm, đơn, mã tùy chỉnh, override sản phẩm, Q&A, alert, thẻ quà, blog, funnel, log hoạt động, so sánh, thông báo) lưu trong **DB RAM của server** → tự ghi `data/db.json` định kỳ 2s khi có thay đổi → load lại khi khởi động. `localStorage` là cache mirror để UI chạy nhanh + offline.
- **Ảnh upload** (sản phẩm, avatar) lưu **disk của server** trong `data/uploads/` (product lưu URL `/uploads/...`; chỉ fallback data-URL khi server offline).
- Phiên đăng nhập + trang hiện tại vẫn theo trình duyệt (`localStorage`/`sessionStorage`).
- Ảnh sản phẩm mặc định: Wikimedia Commons (license tự do). Ảnh chi tiết gallery/blog: SVG tự sinh (không tốn dung lượng).
- Icon: Lucide (ISC license) — toàn bộ emoji UI đã thay bằng SVG.
- PWA (service worker) chỉ kích hoạt ở **production build** (`npm run preview`).
- CAPTCHA là câu hỏi toán đơn giản (chống spam bot, không phải bảo mật cao).
- Thanh toán/QR/vận chuyển là **mock** (demo) — tích hợp cổng thật cần backend.
