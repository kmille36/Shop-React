import { detailImage } from '../utils/imggen'

export const seedBlog = [
  {
    id: 1,
    title: 'Cách chọn laptop phù hợp nhu cầu 2026',
    image: detailImage('Laptop Guide', 210, 'MẸO MUA SẮM'),
    excerpt: 'Từ chip, RAM đến pin — những yếu tố quan trọng nhất khi chọn laptop cho học tập và công việc.',
    content: 'Khi chọn laptop, hãy bắt đầu từ nhu cầu. Nếu bạn chỉ văn phòng và lướt web, chip Intel i5 hoặc Apple M2 với 8GB RAM là đủ. Designer và lập trình viên nên chọn 16GB RAM và SSD 512GB trở lên. Đừng quên pin: nếu hay di chuyển, ưu tiên máy 8 tiếng pin. Cuối cùng, màn hình 2.5K trở lên giúp mắt đỡ mỏi khi làm việc lâu. Tại ShopReact, tất cả laptop đều bảo hành 12 tháng và đổi trả 7 ngày.',
    date: Date.now() - 86400000 * 2,
  },
  {
    id: 2,
    title: 'iPhone 15 Pro Max hay Galaxy S24 Ultra?',
    image: detailImage('iPhone vs Galaxy', 340, 'SO SÁNH'),
    excerpt: 'Cuộc đối đầu giữa hai flagship hàng đầu — đâu là lựa chọn xứng đáng với đồng tiền?',
    content: 'iPhone 15 Pro Max thắng về hệ sinh thái, chip A17 Pro và khả năng giữ giá. Galaxy S24 Ultra vượt trội với S-Pen, màn hình 6.8 inch và Galaxy AI. Nếu bạn đã dùng iPhone, nâng cấp lên 15 Pro Max là hợp lý. Nếu thích tùy biến và bút vẽ, S24 Ultra là lựa chọn. Cả hai đều có tại ShopReact với giá tốt và bảo hành chính hãng.',
    date: Date.now() - 86400000 * 5,
  },
  {
    id: 3,
    title: 'Mẹo tiết kiệm khi mua công nghệ',
    image: detailImage('Save Money', 150, 'TIẾT KIỆM'),
    excerpt: 'Flash sale, mã giảm giá, tích điểm — cách mua công nghệ rẻ hơn mà vẫn chất lượng.',
    content: 'Theo dõi mục Flash Sale để bắt giá tốt nhất trong ngày. Dùng mã GIAM10 (giảm 10%) cho đơn từ 500K, hoặc FREESHIP để miễn phí vận chuyển. Đăng ký tài khoản để nhận 50K và 100 điểm, mỗi 10.000đ mua hàng tích 1 điểm. Mua 2 sản phẩm cùng danh mục được giảm thêm 5% (combo). Kết hợp tất cả để tiết kiệm tới 20% mỗi đơn hàng.',
    date: Date.now() - 86400000 * 9,
  },
]
