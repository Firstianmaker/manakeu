# Manakeu – Web Manajemen Keuangan Perusahaan

**Manakeu** adalah aplikasi web sederhana untuk mengelola keuangan perusahaan secara efisien. Dibangun dengan **Express.js** dan sudah mendukung autentikasi menggunakan **JWT** dan **Google OAuth**.

## ✨ Fitur Sementara

- 🔐 Login dan Register (dengan Google OAuth & JWT)
- 💰 Pendapatan dan Pengeluaran
- 🧾 Transaksi dan Riwayat Keuangan
- 📊 Budgeting
- 📌 Manajemen Proyek
- 📈 Total Keuangan Perusahaan
- 📤 Export data ke Excel

## 🛠️ Teknologi

- **Backend**: Node.js + Express.js
- **Authentication**: JWT, Google OAuth 2.0 (`passport.js`)
- **Database**: MySQL / MongoDB
- **Middleware**: `express-session`, `passport`

## 📦 Instalasi

Clone repo dan install dependensi:
Instalasi utama:

Instalasi Tambahan:


### Catatan
1. Fitur masih dalam tahap pengembangan
2. Pastikan konfigurasi OAuth sudah di-setup (Google Developer Console)
3. Tambahkan file .env untuk menyimpan JWT_SECRET, GOOGLE_CLIENT_ID, dan GOOGLE_CLIENT_SECRET
