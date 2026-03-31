import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, PackagePlus, Pencil, Trash2, Eye } from 'lucide-react'
import Select from 'react-select'
import api from '../lib/api'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import SearchInput from '../components/SearchInput'
import useDebounce from '../hooks/useDebounce'

const initForm = {
  id: null,
  customer_name: '',
  customer_phone: '',
  reseller_id: '',
  payment_status: 'belum_lunas',
  payment_days_total: 0,
  amount_paid: 0,
  items: [{ product_id: '', qty: 1 }],
}

const toNumberOrEmpty = (value) => (value === '' ? '' : Number(value))

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [resellers, setResellers] = useState([])
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total_pages: 1 })
  const [form, setForm] = useState(initForm)
  const [openForm, setOpenForm] = useState(false)
  const [openDetail, setOpenDetail] = useState(false)
  const [detailOrder, setDetailOrder] = useState(null)
  const [mode, setMode] = useState('create')
  const [search, setSearch] = useState('')
  const [filterResellerId, setFilterResellerId] = useState('')
  const debouncedSearch = useDebounce(search, 1000)

  const load = useCallback(() => {
    const query = new URLSearchParams({
      page: String(page),
      limit: '10',
      q: debouncedSearch,
      reseller_id: filterResellerId,
    }).toString()
    return api.get(`/orders.php?${query}`).then((r) => {
      setOrders(r.data.data)
      setMeta(r.data.meta)
    })
  }, [page, debouncedSearch, filterResellerId])
  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [debouncedSearch])
  useEffect(() => {
    api.get('/products.php?page=1&limit=100').then((r) => setProducts(r.data.data))
    api.get('/resellers.php?page=1&limit=100').then((r) => setResellers(r.data.data))
  }, [])

  const save = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      payment_days_total: Number(form.payment_days_total || 0),
      amount_paid: Number(form.amount_paid || 0),
      items: form.items.map((item) => ({
        ...item,
        qty: Math.max(1, Number(item.qty || 1)),
      })),
    }
    await api.post('/orders_save.php', payload)
    toast.success(mode === 'edit' ? 'Order diupdate' : 'Order tersimpan')
    setForm(initForm)
    setOpenForm(false)
    setMode('create')
    load()
  }
  const openAdd = () => {
    setForm(initForm)
    setMode('create')
    setOpenForm(true)
  }
  const openEdit = async (id) => {
    const { data } = await api.get(`/orders_detail.php?id=${id}`)
    const d = data.data
    setForm({
      id: d.id,
      customer_name: d.customer_name || '',
      customer_phone: d.customer_phone || '',
      reseller_id: d.reseller_id ? String(d.reseller_id) : '',
      payment_status: d.payment_status || 'belum_lunas',
      payment_days_total: Number(d.payment_days_total || 0),
      amount_paid: Number(d.amount_paid || 0),
      items: (d.items || []).map((it) => ({ product_id: String(it.product_id), qty: Number(it.qty) })),
    })
    setMode('edit')
    setOpenForm(true)
  }
  const openView = async (id) => {
    const { data } = await api.get(`/orders_detail.php?id=${id}`)
    setDetailOrder(data.data)
    setOpenDetail(true)
  }
  const remove = (id) => {
    toast((t) => (
      <div className="flex items-center gap-2">
        <span>Hapus order ini?</span>
        <button
          className="rounded bg-rose-600 px-2 py-1 text-white"
          onClick={async () => {
            await api.post('/orders_delete.php', { id })
            toast.dismiss(t.id)
            toast.success('Order dihapus')
            load()
          }}
        >
          Ya
        </button>
      </div>
    ))
  }
  const resellerOptions = resellers.map((r) => ({ value: String(r.id), label: r.name }))
  const productOptions = products.map((p) => ({ value: String(p.id), label: p.name }))

  return (
    <div className="card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-800">Manajemen Order</h2>
        <div className="w-64">
          <Select
            isClearable
            isSearchable
            placeholder="Filter reseller..."
            options={resellerOptions}
            value={resellerOptions.find((opt) => opt.value === String(filterResellerId)) || null}
            onChange={(selected) => setFilterResellerId(selected?.value || '')}
          />
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Cari customer/reseller/tanggal order..." />
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <Plus size={16} /> Input Order
        </button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Daftar Order</h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3">No</th>
                <th className="px-3 py-3">Pelanggan</th>
                <th className="px-3 py-3">Reseller</th>
                <th className="px-3 py-3">Tanggal</th>
                <th className="px-3 py-3">Total</th>
                <th className="px-3 py-3">Progress Bayar</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o, idx) => (
                <tr key={o.id} className="border-t border-slate-200">
                  <td className="px-3 py-3 font-semibold text-slate-500">{(page - 1) * 10 + idx + 1}</td>
                  <td className="px-3 py-3 font-semibold text-slate-800">{o.customer_name}</td>
                  <td className="px-3 py-3 text-slate-600">{o.reseller_name || '-'}</td>
                  <td className="px-3 py-3 text-slate-600">{o.order_date}</td>
                  <td className="px-3 py-3 font-semibold text-slate-800">Rp {Number(o.total_amount).toLocaleString('id-ID')}</td>
                  <td className="px-3 py-3 text-slate-600">
                    {o.payment_status === 'belum_lunas'
                      ? `Dibayar Rp ${Number(o.amount_paid || 0).toLocaleString('id-ID')} | Hari ${o.payment_days_total || 0} | Sisa Rp ${Number(o.remaining_amount || 0).toLocaleString('id-ID')}`
                      : 'Lunas'}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${o.payment_status === 'lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {o.payment_status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="rounded-lg bg-sky-600 p-2 text-white" onClick={() => openView(o.id)}><Eye size={16} /></button>
                      <button className="rounded-lg bg-amber-500 p-2 text-white" onClick={() => openEdit(o.id)}><Pencil size={16} /></button>
                      <button className="rounded-lg bg-rose-600 p-2 text-white" onClick={() => remove(o.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-slate-500">Data order tidak ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={meta.total_pages || 1} onChange={setPage} />
      </div>

      <Modal open={openForm} onClose={() => setOpenForm(false)} title={mode === 'edit' ? 'Edit Order' : 'Input Order Baru'}>
        <form onSubmit={save}>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nama Pelanggan</label>
          <input className="mb-2 w-full rounded-lg border border-slate-300 p-2" placeholder="Nama Pelanggan" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
          <label className="mb-1 block text-sm font-medium text-slate-700">No HP Pelanggan</label>
          <input className="mb-2 w-full rounded-lg border border-slate-300 p-2" placeholder="No HP Pelanggan" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
          <div className="mb-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Reseller</label>
            <Select
              isClearable
              isSearchable
              placeholder="Pilih reseller (opsional)"
              options={resellerOptions}
              value={resellerOptions.find((opt) => opt.value === String(form.reseller_id)) || null}
              onChange={(selected) => setForm({ ...form, reseller_id: selected?.value || '' })}
              classNamePrefix="react-select"
            />
            <p className="mt-1 text-xs text-slate-500">Kosongkan untuk pelanggan langsung (tanpa reseller)</p>
          </div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Status Pembayaran</label>
          <select className="mb-2 w-full rounded-lg border border-slate-300 p-2" value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value })}>
            <option value="belum_lunas">Belum Lunas</option>
            <option value="lunas">Lunas</option>
          </select>
          {form.payment_status === 'belum_lunas' && (
            <>
              <label className="mb-1 block text-sm font-medium text-slate-700">Total Jumlah Hari Bayar</label>
              <input
                type="number"
                min="0"
                className="mb-2 w-full rounded-lg border border-slate-300 p-2"
                placeholder="Total Jumlah Hari Bayar"
                value={form.payment_days_total}
                onChange={(e) => setForm({ ...form, payment_days_total: toNumberOrEmpty(e.target.value) })}
              />
              <label className="mb-1 block text-sm font-medium text-slate-700">Total Uang Yang Dibayarkan</label>
              <input
                type="number"
                min="0"
                className="mb-2 w-full rounded-lg border border-slate-300 p-2"
                placeholder="Total Uang Yang Dibayarkan"
                value={form.amount_paid}
                onChange={(e) => setForm({ ...form, amount_paid: toNumberOrEmpty(e.target.value) })}
              />
            </>
          )}
          {form.items.map((it, idx) => (
            <div key={idx} className="mb-2 rounded-lg border border-slate-200 p-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Produk #{idx + 1}</label>
              <Select
                isClearable
                isSearchable
                placeholder="Pilih Produk"
                options={productOptions}
                value={productOptions.find((opt) => opt.value === String(it.product_id)) || null}
                onChange={(selected) => {
                  const next = [...form.items]
                  next[idx].product_id = selected?.value || ''
                  setForm({ ...form, items: next })
                }}
                classNamePrefix="react-select"
              />
              <label className="mb-1 block text-sm font-medium text-slate-700">Jumlah (Qty)</label>
              <input type="number" min="1" className="w-full rounded-lg border border-slate-300 p-2" value={it.qty} onChange={(e) => {
                const next = [...form.items]
                next[idx].qty = toNumberOrEmpty(e.target.value)
                setForm({ ...form, items: next })
              }} />
            </div>
          ))}
          <button
            type="button"
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
            onClick={() => setForm({ ...form, items: [...form.items, { product_id: '', qty: 1 }] })}
          >
            <PackagePlus size={16} /> Tambah Produk
          </button>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpenForm(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700">Batal</button>
            <button className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white">{mode === 'edit' ? 'Update Order' : 'Simpan Order'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={openDetail} onClose={() => setOpenDetail(false)} title="Detail Order">
        {!detailOrder ? null : (
          <div>
            <p className="font-semibold">{detailOrder.customer_name} {detailOrder.reseller_name ? `- via ${detailOrder.reseller_name}` : ''}</p>
            <p className="text-sm text-slate-500">{detailOrder.order_date}</p>
            <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${detailOrder.payment_status === 'lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {detailOrder.payment_status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
            </span>
            {detailOrder.payment_status === 'belum_lunas' && (
              <div className="mt-2 rounded-lg bg-amber-50 p-3 text-sm">
                <p>Total Harga Barang: Rp {Number(detailOrder.total_amount).toLocaleString('id-ID')}</p>
                <p>Jumlah Hari Bayar: {detailOrder.payment_days_total || 0} hari</p>
                <p>Jumlah Baru Dibayarkan: Rp {Number(detailOrder.amount_paid || 0).toLocaleString('id-ID')}</p>
                <p className="font-semibold">Total Belum Dibayar: Rp {Number(detailOrder.remaining_amount || 0).toLocaleString('id-ID')}</p>
              </div>
            )}
            <div className="mt-4 space-y-2">
              {detailOrder.items?.map((item, idx) => (
                <div key={item.id || idx} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-semibold">{idx + 1}. {item.product_name}</p>
                  <p className="text-sm text-slate-500">Qty {item.qty} x Rp {Number(item.price).toLocaleString('id-ID')}</p>
                  <p className="text-sm font-semibold">Subtotal Rp {Number(item.subtotal).toLocaleString('id-ID')}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-right text-base font-bold">Total Rp {Number(detailOrder.total_amount).toLocaleString('id-ID')}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
