// CSV export helper (BOM for Excel UTF-8 Vietnamese)
export function downloadCSV(filename, rows) {
  const esc = (c) => '"' + String(c ?? '').replace(/"/g, '""') + '"'
  const csv = rows.map(r => r.map(esc).join(',')).join('\r\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 500)
}
