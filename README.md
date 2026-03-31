# Management Order Paket Ramadhan

Stack:
- Frontend: React (Vite, JSX), TailwindCSS, React Hot Toast, React Datepicker, CompressorJS
- Backend: PHP Native (REST API)
- Database: MySQL

## Fitur
- Login admin
- Dashboard statistik
- Manajemen produk (CRUD + upload/compress image max 500kb + pagination API 10 data)
- Manajemen reseller (CRUD + pagination API 10 data)
- Manajemen order (pelanggan langsung dan pelanggan reseller, 1 order bisa banyak produk, pagination API 10 data)
- Manajemen laporan (filter rentang tanggal max 1 bulan dengan datepicker)
- Saat edit/hapus produk, image lama yang tidak dipakai otomatis di-unlink

## Setup Backend (PHP + MySQL)
1. Buat database dan table:
   - import file: `backend/database/schema.sql`
2. Atur koneksi DB di:
   - `backend/config/env.php`
3. Jalankan server PHP:
   - `php -S localhost:8000 -t backend/public`

Default login:
- username: `admin`
- password: `admin123`

## Setup Frontend
1. Masuk folder frontend:
   - `cd frontend`
2. Install dependency:
   - `npm install`
3. Jalankan:
   - `npm run dev`

Frontend akan proxy ke API `http://localhost:8000` melalui path `/api`.
# management-parcel
