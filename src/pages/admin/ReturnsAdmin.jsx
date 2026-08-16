import { useAdmin } from '../../context/AdminContext'
import { useToast } from '../../context/ToastContext'
import { formatPrice } from '../../utils/format'
import Ic from '../../components/Ic'

export default function ReturnsAdmin() {
  const { getReturns, setReturnStatus } = useAdmin()
  const { toast } = useToast()
  const returns = getReturns()

  const act = (r, status) => {
    setReturnStatus(r.userEmail, r.orderId, status)
    toast(status === 'approved' ? 'Đã duyệt — tiền hoàn vào ví khách' : 'Đã từ chối yêu cầu', status === 'approved' ? 'success' : 'info')
  }

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <span className="muted">{returns.length} yêu cầu đổi trả • {returns.filter(r => r.status === 'pending').length} chờ duyệt</span>
      </div>
      {returns.length === 0 ? (
        <div className="glass panel"><p className="panel-empty">Chưa có yêu cầu đổi trả nào</p></div>
      ) : (
        <div className="admin-table-wrap glass">
          <table className="admin-table">
            <thead><tr><th>Đơn</th><th>Khách</th><th>Số tiền</th><th>Lý do</th><th>Ngày</th><th>Trạng thái</th><th></th></tr></thead>
            <tbody>
              {returns.map(r => (
                <tr key={r.orderId}>
                  <td><strong>#{r.orderId.slice(-6).toUpperCase()}</strong></td>
                  <td><div>{r.userName}</div><small className="muted">{r.userEmail}</small></td>
                  <td><strong>{formatPrice(r.orderTotal)}</strong></td>
                  <td><small>{r.reason}</small></td>
                  <td><small>{new Date(r.date).toLocaleDateString('vi-VN')}</small></td>
                  <td>
                    <span className={`status-pill ${r.status === 'approved' ? 'paid' : r.status === 'rejected' ? 'cancelled' : 'processing'}`}>
                      {r.status === 'pending' ? '⏳ Chờ duyệt' : r.status === 'approved' ? '✅ Đã duyệt' : '🚫 Từ chối'}
                    </span>
                  </td>
                  <td className="row-actions">
                    {r.status === 'pending' && (
                      <>
                        <button className="ghost-btn small" onClick={() => act(r, 'approved')}><Ic e="✅" size={14} /> Duyệt</button>
                        <button className="ghost-btn small danger" onClick={() => act(r, 'rejected')}>Từ chối</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
