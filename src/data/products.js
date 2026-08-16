export const products = [
  { id: 1, image: "/images/iphone15promax.jpg", name: "iPhone 15 Pro Max", stock: 12, flash: false, category: "Điện thoại", price: 32990000, oldPrice: 35990000, rating: 4.9, desc: "Chip A17 Pro, camera 48MP, titan nguyên khối", variants: [{ label: "256GB", priceDelta: 0 }, { label: "512GB", priceDelta: 3000000 }, { label: "1TB", priceDelta: 6000000 }] },
  { id: 2, image: "/images/galaxys24.jpg", name: "Samsung Galaxy S24 Ultra", stock: 20, flash: false, category: "Điện thoại", price: 28990000, oldPrice: 31990000, rating: 4.8, desc: "Galaxy AI, bút S-Pen, màn hình 6.8 inch" },
  { id: 3, image: "/images/macbookpro.jpg", name: "MacBook Pro 14 M3", stock: 8, flash: true, category: "Laptop", price: 42990000, oldPrice: 45990000, rating: 4.9, desc: "Chip M3 Pro, RAM 18GB, SSD 1TB", variants: [{ label: "18GB / 512GB", priceDelta: -3000000 }, { label: "18GB / 1TB", priceDelta: 0 }, { label: "36GB / 1TB", priceDelta: 5000000 }] },
  { id: 4, image: "/images/dellxps.jpg", name: "Dell XPS 13 Plus", stock: 15, flash: false, category: "Laptop", price: 33990000, oldPrice: null, rating: 4.6, desc: "Mỏng nhẹ, màn OLED, Intel Core i7" },
  { id: 5, image: "/images/airpodspro.jpg", name: "AirPods Pro 2", stock: 45, flash: true, category: "Phụ kiện", price: 4990000, oldPrice: 5990000, rating: 4.8, desc: "Chống ồn chủ động, sạc USB-C", variants: [{ label: "Sạc USB-C", priceDelta: 0 }, { label: "Sạc Lightning", priceDelta: -200000 }] },
  { id: 6, image: "/images/watchultra.jpg", name: "Apple Watch Ultra 2", stock: 18, flash: false, category: "Phụ kiện", price: 18990000, oldPrice: 20990000, rating: 4.7, desc: "Màn hình sáng nhất, GPS chính xác kép" },
  { id: 7, image: "/images/ipadair.jpg", name: "iPad Air M2", stock: 25, flash: false, category: "Tablet", price: 16990000, oldPrice: 18490000, rating: 4.7, desc: "Chip M2, hỗ trợ Apple Pencil Pro" },
  { id: 8, image: "/images/sonyxm5.jpg", name: "Sony WH-1000XM5", stock: 30, flash: true, category: "Phụ kiện", price: 6990000, oldPrice: 8490000, rating: 4.8, desc: "Tai nghe chống ồn hàng đầu" },
  { id: 9, image: "/images/switch.jpg", name: "Nintendo Switch OLED", stock: 22, flash: false, category: "Game", price: 7990000, oldPrice: 8990000, rating: 4.6, desc: "Màn hình OLED 7 inch, màu đen" },
  { id: 10, image: "/images/ps5.jpg", name: "PlayStation 5 Slim", stock: 10, flash: true, category: "Game", price: 12990000, oldPrice: 13990000, rating: 4.9, desc: "SSD 1TB, tay cầm DualSense", variants: [{ label: "Bản đầy đủ", priceDelta: 0 }, { label: "Digital Edition", priceDelta: -1500000 }] },
  { id: 11, image: "/images/iphone15.jpg", name: "iPhone 15", stock: 35, flash: false, category: "Điện thoại", price: 19990000, oldPrice: 21990000, rating: 4.7, desc: "Cổng USB-C, Dynamic Island" },
  { id: 12, image: "/images/galaxytab.jpg", name: "Galaxy Tab S9", stock: 16, flash: false, category: "Tablet", price: 15990000, oldPrice: null, rating: 4.5, desc: "Màn AMOLED 120Hz, chống nước IP68" },
  { id: 13, image: "/images/logitechmx.jpg", name: "Logitech MX Master 3S", stock: 50, flash: false, category: "Phụ kiện", price: 2490000, oldPrice: 2990000, rating: 4.8, desc: "Chuột không dây cao cấp, 8K DPI" },
  { id: 14, image: "/images/lggram.jpg", name: "LG Gram 17", stock: 14, flash: false, category: "Laptop", price: 29990000, oldPrice: 32990000, rating: 4.5, desc: "Màn 17 inch siêu nhẹ 1.35kg" },
  { id: 15, image: "/images/metaquest3.jpg", name: "Meta Quest 3", stock: 19, flash: false, category: "Game", price: 9990000, oldPrice: 11490000, rating: 4.6, desc: "Kính thực tế hỗn hợp, chip Snapdragon XR2" },
  { id: 16, image: "/images/kindle.jpg", name: "Kindle Paperwhite", stock: 40, flash: false, category: "Tablet", price: 3990000, oldPrice: 4490000, rating: 4.4, desc: "Màn E-ink 6.8 inch, pin 10 tuần" },
]

export const categories = ["Tất cả", "Điện thoại", "Laptop", "Tablet", "Phụ kiện", "Game"]
