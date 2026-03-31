import { useCallback, useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import toast from 'react-hot-toast'
import Select from 'react-select'
import { Download, FileText } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import api from '../lib/api'
import Pagination from '../components/Pagination'

export default function ReportsPage() {
  const [yearDate, setYearDate] = useState(new Date())
  const [rows, setRows] = useState([])
  const [resellers, setResellers] = useState([])
  const [resellerId, setResellerId] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total_pages: 1, total: 0 })

  useEffect(() => {
    api.get('/resellers.php?page=1&limit=100').then((r) => setResellers(r.data.data))
  }, [])

  const resellerOptions = useMemo(
    () => resellers.map((r) => ({ value: String(r.id), label: r.name })),
    [resellers],
  )

  const getReport = useCallback(async (targetPage = page) => {
    const selectedYear = yearDate.getFullYear()
    const params = new URLSearchParams({
      year: String(selectedYear),
      reseller_id: resellerId,
      page: String(targetPage),
      limit: '500',
    }).toString()
    const { data } = await api.get(`/reports.php?${params}`)
    setRows(data.data)
    setMeta(data.meta || { total_pages: 1, total: 0 })
  }, [page, resellerId, yearDate])
  useEffect(() => { getReport(1) }, [getReport])

  const fetchAllRows = async () => {
    const selectedYear = yearDate.getFullYear()
    let current = 1
    const all = []
    while (true) {
      const params = new URLSearchParams({
        year: String(selectedYear),
        reseller_id: resellerId,
        page: String(current),
        limit: '500',
      }).toString()
      const { data } = await api.get(`/reports.php?${params}`)
      all.push(...(data.data || []))
      const totalPages = Number(data.meta?.total_pages || 1)
      if (current >= totalPages) break
      current += 1
    }
    return all
  }

  const exportCsv = async () => {
    const allRows = await fetchAllRows()
    if (!allRows.length) return toast.error('Data laporan kosong')
    const header = ['No', 'Tanggal', 'Customer', 'Reseller', 'Total', 'Status']
    const body = allRows.map((r, idx) => [
      idx + 1,
      r.order_date,
      r.customer_name,
      r.reseller_name || '-',
      Number(r.total_amount),
      r.payment_status === 'lunas' ? 'Lunas' : 'Belum Lunas',
    ])
    const csvRows = [header, ...body].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `laporan-order-${yearDate.getFullYear()}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const exportPdf = async () => {
    const allRows = await fetchAllRows()
    if (!allRows.length) return toast.error('Data laporan kosong')
    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(14)
    doc.text('Laporan Order Paket Ramadhan', 14, 14)
    doc.setFontSize(10)
    doc.text(`Tahun: ${yearDate.getFullYear()}`, 14, 20)
    autoTable(doc, {
      startY: 24,
      head: [['No', 'Tanggal', 'Customer', 'Reseller', 'Total', 'Status']],
      body: allRows.map((r, idx) => [
        idx + 1,
        r.order_date,
        r.customer_name,
        r.reseller_name || '-',
        `Rp ${Number(r.total_amount).toLocaleString('id-ID')}`,
        r.payment_status === 'lunas' ? 'Lunas' : 'Belum Lunas',
      ]),
      styles: { fontSize: 9 },
    })
    doc.save(`laporan-order-${yearDate.getFullYear()}.pdf`)
  }

  return (
    <div className="card">
      <h1 className="mb-4 text-xl font-bold">Laporan Order</h1>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <p className="mb-1 text-sm">Tahun</p>
          <DatePicker
            selected={yearDate}
            onChange={(value) => setYearDate(value)}
            showYearPicker
            dateFormat="yyyy"
            className="rounded border p-2"
          />
        </div>
        <div className="w-full max-w-xs">
          <p className="mb-1 text-sm">Reseller</p>
          <Select
            isClearable
            isSearchable
            placeholder="Semua reseller"
            options={resellerOptions}
            value={resellerOptions.find((opt) => opt.value === resellerId) || null}
            onChange={(selected) => setResellerId(selected?.value || '')}
          />
        </div>
        <button className="rounded bg-brand-600 px-4 py-2 text-white" onClick={() => { setPage(1); getReport(1) }}>Filter</button>
        <button className="inline-flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 text-white" onClick={exportCsv}><Download size={16} /> CSV</button>
        <button className="inline-flex items-center gap-2 rounded bg-rose-600 px-4 py-2 text-white" onClick={exportPdf}><FileText size={16} /> PDF</button>
      </div>
      <div className="space-y-2">
        {rows.map((r, idx) => (
          <div key={r.id} className="rounded border p-3">
            <p className="font-semibold">{(page - 1) * 500 + idx + 1}. {r.customer_name}</p>
            <p className="text-sm text-slate-500">{r.order_date}</p>
            <p className="text-sm">Total Rp {Number(r.total_amount).toLocaleString('id-ID')}</p>
            <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${r.payment_status === 'lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {r.payment_status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
            </span>
          </div>
        ))}
      </div>
      <Pagination
        page={page}
        totalPages={meta.total_pages || 1}
        onChange={(nextPage) => {
          setPage(nextPage)
          getReport(nextPage)
        }}
      />
    </div>
  )
}
