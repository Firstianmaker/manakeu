# Manakeu – Web Manajemen Keuangan Perusahaan

*Manakeu* adalah sebuah aplikasi web yang dibuat untuk membantu perusahaan dalam mengelola keuangan secara lebih mudah, rapi, dan efisien. Dengan menggunakan Manakeu, pengguna dapat mencatat semua pemasukan dan pengeluaran, memantau transaksi yang telah dilakukan, serta merencanakan anggaran keuangan perusahaan. Aplikasi ini juga mendukung pengelolaan keuangan berdasarkan proyek, sehingga setiap proyek dapat dipantau dari sisi keuangannya secara terpisah. Selain itu, Manakeu menyediakan ringkasan total kondisi keuangan perusahaan dan memungkinkan data keuangan diekspor ke dalam bentuk file Excel untuk keperluan laporan atau dokumentasi. Aplikasi ini juga sudah dilengkapi dengan sistem login yang aman, termasuk opsi masuk menggunakan akun Google, sehingga pengguna dapat mengakses sistem dengan mudah dan tetap terjaga keamanannya. Secara keseluruhan, Manakeu hadir sebagai solusi sederhana namun lengkap untuk perusahaan yang ingin mengatur keuangan secara lebih teratur dan profesional.

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

### 1. Clone Repository
```bash
git clone https://github.com/Firstianmaker/manakeu.git
cd manakeu
```

### 2. Instalasi Utama
```bash
npm install
```

### 3. Instalasi Tambahan
```bash
npm install jsonwebtoken bcryptjs passport passport-google-oauth20 express-session express-rate-limit cors dotenv
```

### Catatan
1. Fitur masih dalam tahap pengembangan
2. Pastikan konfigurasi OAuth sudah di-setup (Google Developer Console)
3. Tambahkan file .env untuk menyimpan JWT_SECRET, GOOGLE_CLIENT_ID, dan GOOGLE_CLIENT_SECRET
