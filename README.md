# 🛍️ ShopReact — Website E-commerce React

Website bán hàng công nghệ hoàn chỉnh với **khu vực Quản trị (Admin Panel)**, build với **React 19 + Vite 8**, giao diện **Liquid Glass** (kính mờ, gradient động). 100% client-side, dữ liệu lưu `localStorage` — không cần backend.

![react](https://img.shields.io/badge/React-19.2.8-61dafb) ![vite](https://img.shields.io/badge/Vite-8.2.1-646cff) ![icons](https://img.shields.io/badge/Icons-Lucide-6c5ce7) ![tests](https://img.shields.io/badge/Tests-105%2F105%20PASS-00b894)

## ✨ Tính năng

### 🛒 Cửa hàng (Storefront)
- 16 sản phẩm với **ảnh thật** (Wikimedia Commons, đã tối ưu ~450KB)
- Chi tiết sản phẩm (modal: mô tả, chọn số lượng, tồn kho)
- ⭐ **Đánh giá & nhận xét** (gắn sao 1–5, điểm trung bình tự tính)
- ❤️ **Yêu thích / Wishlist** (trang riêng, chuyển thẳng vào giỏ)
- Lọc danh mục, tìm kiếm, sắp xếp (giá/đánh giá/mới), lọc khoảng giá
- 🎟️ **Mã giảm giá**: `GIAM10` · `SAVE50` · `VIP20` · `FREESHIP` (có min-total, admin thêm được mã mới)
- ⚡ **Flash sale** + đồng hồ đếm ngược
- 📦 **Quản lý tồn kho**: giảm khi mua, "sắp hết", "hết hàng", chặn vượt stock
- 🎀 Đóng gói quà tặng (+25K) · 🕘 Xem gần đây

### 👛 Ví điện tử
- Nạp tiền (preset 100K–5M hoặc tùy chỉnh, 3 phương thức)
- Lịch sử giao dịch
- Thanh toán nhanh bằng ví khi checkout

### 👤 Tài khoản khách hàng
- Đăng ký / đăng nhập / đăng xuất (localStorage)
- Đăng ký tặng **50K + 100 điểm** 🎁
- **Điểm thưởng loyalty**: 10K = 1 điểm, 100 điểm = 10K khi thanh toán
- Hạng thành viên: Bronze → Silver → Gold → 💎 Diamond
- Hồ sơ: thống kê, chỉnh sửa thông tin, lịch sử đơn hàng
- 📍 **Theo dõi đơn hàng** (timeline 4 bước) + hủy đơn COD

### 💳 Thanh toán
- 3 phương thức: COD · Ví điện tử · Chuyển khoản
- Dùng điểm thưởng khi thanh toán
- Miễn phí ship đơn từ 10 triệu hoặc mã `FREESHIP`

### 🎨 Trải nghiệm
- 🌙 **Dark mode** (liquid glass cả 2 chế độ, ghi nhớ)
- 🤖 **ShopBot** chatbot (giá, ship, mã giảm giá, bảo hành, tích điểm)
- 🔔 Toast notifications · 📬 Newsletter + FAQ
- Responsive đầy đủ (mobile → desktop)

---

## 🛡️ Khu vực Quản trị (Admin Panel)

Truy cập: link **"🛡️ Quản trị"** ở cuối trang (footer).

> **Tài khoản demo:** `admin@shopreact.vn` / `admin123` (đổi được trong Cài đặt)

### 📊 Tổng quan (Dashboard)
- 4 thẻ thống kê: **Doanh thu** (tính từ đơn đã thanh toán), tổng đơn, khách hàng, sản phẩm
- 🏆 Top 5 sản phẩm bán chạy (biểu đồ thanh)
- ⚠️ Cảnh báo hàng sắp hết (≤ 5)
- 🕘 5 đơn hàng mới nhất

### 📦 Đơn hàng
- Bảng đơn hàng gộp từ tất cả khách, lọc theo 6 trạng thái + tìm kiếm
- Đổi trạng thái trực tiếp: Chờ xử lý → Đã thanh toán → Đang xử lý → Đang giao → Hoàn thành / Đã hủy
- Chi tiết đơn: khách, địa chỉ, sản phẩm (có ảnh), hóa đơn đầy đủ (giảm giá, ship, quà, điểm), timeline 5 bước

### 📱 Sản phẩm
- **Sửa** giá, giá gốc, tồn kho, tên, danh mục, ảnh, mô tả, flash sale
- **Thêm** sản phẩm mới · **Xóa** sản phẩm
- Thay đổi phản ánh **ngay lập tức** trên cửa hàng

### 👥 Khách hàng
- Xem thông tin, số đơn, số dư, điểm
- 🔒 **Khóa / mở khóa** tài khoản (khách bị khóa không đăng nhập được)
- 🔐 Đặt lại mật khẩu · 💰 Chỉnh số dư ví (+/−) · 🗑️ Xóa tài khoản

### 🎟️ Mã giảm giá
- Xem 4 mã mặc định (bảo vệ, không xóa được)
- **Thêm mã tùy chỉnh**: giảm % (có trần), giảm cố định, miễn phí ship + điều kiện đơn tối thiểu
- Mã admin tạo dùng được ngay trên cửa hàng

### ⚙️ Cài đặt
- Đổi mật khẩu quản trị
- ⚠️ Reset toàn bộ dữ liệu cửa hàng

---

## 🚀 Chạy project

```bash
# Yêu cầu: Node.js 20.19+ (hoặc 22.12+)
npm install
npm run dev        # http://localhost:5173
```

Build production:
```bash
npm run build      # output: dist/
npm run preview    # xem build
```

> **Lưu ý tunnel:** nếu truy cập qua tunnel (ngrok, pinggy...), config đã bật
> `server.allowedHosts: true` trong `vite.config.js` nên hoạt động ngay.

## 📁 Cấu trúc

```
shop-react/
├── index.html
├── vite.config.js
├── package.json
├── README.md
├── public/
│   └── images/               # 16 ảnh sản phẩm thật (đã nén)
└── src/
    ├── main.jsx
    ├── App.jsx               # điều hướng + lọc/sắp xếp + xem gần đây
    ├── index.css             # theme Liquid Glass (light + dark) + admin
    ├── data/
    │   ├── products.js       # 16 sản phẩm (tồn kho, flash sale)
    │   └── coupons.js        # mã giảm giá (dạng serializable)
    ├── utils/
    │   ├── format.js         # format tiền VND
    │   └── orderStatus.js    # 6 trạng thái đơn hàng
    ├── context/
    │   ├── ThemeContext.jsx  # dark mode
    │   ├── ToastContext.jsx  # thông báo
    │   ├── AuthContext.jsx   # user, ví, điểm, đơn hàng
    │   ├── StoreContext.jsx  # wishlist, review, tồn kho, xem gần đây
    │   ├── CartContext.jsx   # giỏ, mã giảm giá, quà
    │   └── AdminContext.jsx  # đăng nhập admin + API quản trị
    ├── components/
    │   ├── Ic.jsx            # emoji → icon SVG (Lucide) + Stars
    │   ├── Emj.jsx           # render emoji trong text thành icon
    │   ├── ProductImg.jsx    # ảnh thật + fallback
    │   ├── Navbar.jsx
    │   ├── ProductCard.jsx
    │   ├── ProductModal.jsx
    │   ├── CartDrawer.jsx
    │   ├── CheckoutModal.jsx
    │   ├── FlashSale.jsx
    │   ├── ChatBot.jsx
    │   └── Footer.jsx
    └── pages/
        ├── AuthPage.jsx      # đăng nhập / đăng ký
        ├── WalletPage.jsx    # ví + nạp tiền
        ├── ProfilePage.jsx   # hồ sơ + đơn hàng + theo dõi
        ├── WishlistPage.jsx
        └── admin/
            ├── AdminLogin.jsx    # đăng nhập quản trị
            ├── AdminLayout.jsx   # sidebar 6 tab
            ├── Dashboard.jsx     # thống kê tổng quan
            ├── OrdersAdmin.jsx   # quản lý đơn hàng
            ├── ProductsAdmin.jsx # thêm/sửa/xóa sản phẩm
            ├── UsersAdmin.jsx    # quản lý khách hàng
            ├── CouponsAdmin.jsx  # quản lý mã giảm giá
            └── SettingsAdmin.jsx # đổi mật khẩu + reset
```

## 🧪 Kiểm thử

Test tự động bằng **Playwright + Chromium** — **105/105 assertions PASS, 0 console error**
ở cả dev server lẫn production build:

| Bộ test | Phóng | Assertions |
|---------|-------|:---:|
| Storefront | 13 phase: lọc, tìm, review, wishlist, giỏ, mã giảm giá, checkout 3 phương thức, ví, điểm, đơn hàng, chatbot, dark mode, persistence | 61 |
| Admin | 8 phase: đăng nhập, dashboard, đơn hàng, sản phẩm, khách hàng, mã giảm giá, cài đặt + tích hợp storefront | 44 |

## 🛠️ Stack & phiên bản

| Package | Version |
|---------|---------|
| react / react-dom | 19.2.8 |
| vite | 8.2.1 (Rolldown) |
| @vitejs/plugin-react | 6.0.5 (Oxc) |
| lucide-react | 1.31.0 |

## 📝 Ghi chú

- Dữ liệu (tài khoản, giỏ, wishlist, review, tồn kho, điểm, đơn, mã tùy chỉnh, override sản phẩm) lưu **localStorage** — xóa cache là reset.
- Phiên admin + trang hiện tại lưu **sessionStorage** (giữ khi reload tab).
- Ảnh sản phẩm: Wikimedia Commons (license tự do).
- Icon: Lucide (ISC license) — toàn bộ emoji UI đã thay bằng SVG.
