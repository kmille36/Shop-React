export const ORDER_STATUS = {
  cod:        { label: 'Chờ xử lý',   cls: 'cod' },
  paid:       { label: 'Đã thanh toán', cls: 'paid' },
  processing: { label: 'Đang xử lý',  cls: 'processing' },
  shipped:    { label: 'Đang giao',   cls: 'shipped' },
  delivered:  { label: 'Hoàn thành',  cls: 'delivered' },
  cancelled:  { label: 'Đã hủy',      cls: 'cancelled' },
}

// statuses that count as "money received" for revenue
export const PAID_STATUSES = ['paid', 'processing', 'shipped', 'delivered']
