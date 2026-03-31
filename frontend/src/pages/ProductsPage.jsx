import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Compressor from 'compressorjs'
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react'
import api from '../lib/api'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import SearchInput from '../components/SearchInput'
import useDebounce from '../hooks/useDebounce'

const init = { id: null, name: '', price: '', stock: '', description: '', image: null }
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'https://api.isavralabel.com'

const toImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`
}

export default function ProductsPage() {
  const [list, setList] = useState([])
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ total_pages: 1 })
  const [form, setForm] = useState(init)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 1000)
  const selectedImagePreview = useMemo(
    () => (form.image instanceof Blob ? URL.createObjectURL(form.image) : ''),
    [form.image],
  )

  useEffect(() => {
    return () => {
      if (selectedImagePreview) URL.revokeObjectURL(selectedImagePreview)
    }
  }, [selectedImagePreview])

  const load = useCallback(() => {
    const query = new URLSearchParams({ page: String(page), limit: '10', q: debouncedSearch }).toString()
    return api.get(`/products.php?${query}`).then((r) => {
      setList(r.data.data)
      setMeta(r.data.meta)
    })
  }, [page, debouncedSearch])
  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [debouncedSearch])

  const onFile = (file) =>
    new Compressor(file, {
      quality: 0.8,
      maxWidth: 1200,
      success(result) {
        if (result.size > 500 * 1024) return toast.error('Maksimal 500kb')
        setForm((s) => ({ ...s, image: result }))
      },
      error() { toast.error('Gagal compress image') },
    })

  const submit = async (e) => {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v))
    await api.post('/products_save.php', fd)
    toast.success(form.id ? 'Produk diupdate' : 'Produk ditambah')
    setForm(init)
    setOpen(false)
    load()
  }

  const openAdd = () => {
    setForm(init)
    setOpen(true)
  }
  const edit = (p) => {
    setForm({ ...init, ...p })
    setOpen(true)
  }
  const remove = (id) => {
    toast((t) => (
      <div className="flex items-center gap-2">
        <span>Hapus produk ini?</span>
        <button className="rounded bg-rose-600 px-2 py-1 text-white" onClick={async () => { await api.post('/products_delete.php', { id }); toast.dismiss(t.id); toast.success('Terhapus'); load() }}>Ya</button>
      </div>
    ))
  }

  return (
    <div className="card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-800">Manajemen Produk</h2>
        <SearchInput value={search} onChange={setSearch} placeholder="Cari nama/deskripsi produk..." />
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <Plus size={16} /> Tambah Produk
        </button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Daftar Produk</h3>
        <div className="space-y-2">
          {list.map((p, idx) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 text-sm font-semibold text-slate-400">
                  {(page - 1) * 10 + idx + 1}.
                </div>
                {p.image_path ? (
                  <img
                    src={toImageUrl(p.image_path)}
                    alt={p.name}
                    className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="rounded-lg bg-slate-100 p-2 text-slate-500"><ImageIcon size={16} /></div>
                )}
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-slate-500">Rp {Number(p.price).toLocaleString('id-ID')} | Stok {p.stock}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="rounded-lg bg-amber-500 p-2 text-white" onClick={() => edit(p)}><Pencil size={16} /></button>
                <button className="rounded-lg bg-rose-600 p-2 text-white" onClick={() => remove(p.id)}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
        <Pagination page={page} totalPages={meta.total_pages || 1} onChange={setPage} />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'Edit Produk' : 'Tambah Produk'}>
        <form onSubmit={submit}>
          <label className="mb-1 block text-sm font-medium text-slate-700">Nama Produk</label>
          <input className="mb-2 w-full rounded-lg border border-slate-300 p-2" placeholder="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label className="mb-1 block text-sm font-medium text-slate-700">Harga</label>
          <input className="mb-2 w-full rounded-lg border border-slate-300 p-2" placeholder="Harga" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <label className="mb-1 block text-sm font-medium text-slate-700">Stok</label>
          <input className="mb-2 w-full rounded-lg border border-slate-300 p-2" placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          <label className="mb-1 block text-sm font-medium text-slate-700">Deskripsi</label>
          <textarea className="mb-2 w-full rounded-lg border border-slate-300 p-2" placeholder="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          {form.id && form.image_path && !selectedImagePreview && (
            <div className="mb-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Image saat ini</p>
              <img src={toImageUrl(form.image_path)} alt={form.name || 'Product'} className="h-24 w-24 rounded-lg border border-slate-200 object-cover" />
            </div>
          )}
          {selectedImagePreview && (
            <div className="mb-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Preview image baru</p>
              <img src={selectedImagePreview} alt="Preview baru" className="h-24 w-24 rounded-lg border border-slate-200 object-cover" />
            </div>
          )}
          <label className="mb-1 block text-sm font-medium text-slate-700">Gambar Produk</label>
          <input className="mb-4 w-full rounded-lg border border-slate-300 p-2" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700">Batal</button>
            <button className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white">Simpan</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
