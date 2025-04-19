# 📊 Manakeu – Web Manajemen Keuangan Perusahaan

**Manakeu** adalah aplikasi web yang dirancang untuk membantu perusahaan dalam mencatat, mengelola, dan menganalisis keuangan secara terstruktur dan efisien. Aplikasi ini mendukung sistem proyek, laporan keuangan, integrasi WhatsApp, autentikasi aman, pencatatan aktivitas, caching, hingga pelaporan yang lengkap — menjadikannya solusi all-in-one untuk manajemen keuangan profesional.

---

## ✨ Fitur Utama

### 1. 💼 Manajemen Transaksi Kompleks
- Transaksi pemasukan dan pengeluaran
- Batch transaksi & persetujuan massal
- Statistik dan analisis verifikasi nota
- Riwayat & aktivitas pengguna
- Penyesuaian anggaran proyek
- Transfer kepemilikan proyek
- Timeline & laporan ringkasan proyek

### 2. 📦 Manajemen Cache (Redis)
- Cache dashboard pengguna
- Cache statistik & laporan keuangan
- Cache aktivitas & anggota proyek
- Counter notifikasi

### 3. 🕵️ Pencatatan Aktivitas (Logging)
- Pelacakan seluruh aktivitas pengguna
- Timestamp otomatis & tracking berdasarkan ID
- Asosiasi log dengan pengguna

### 4. 📲 Integrasi WhatsApp
- Kirim pesan otomatis
- Status koneksi WA
- Validasi nomor & handling error

### 5. 🔐 Fitur Keamanan
- JWT authentication
- Login via Google OAuth
- Role-based Access (Admin/User)
- Validasi input & error handling terstruktur

### 6. 🗃️ Manajemen Data & Proyek
- CRUD entitas keuangan & proyek
- Soft delete & transaksi database
- Validasi relasi antar data

### 7. 📈 Pelaporan & Analisis
- Laporan bulanan & ringkasan proyek
- Statistik persetujuan
- Analisis transaksi & aktivitas pengguna

### 8. 🔔 Notifikasi & Pemberitahuan
- Status persetujuan
- Notifikasi WhatsApp
- Revisi nota & status perubahan proyek

### 9. ⚙️ Optimasi Performa
- Redis caching
- Throttling request
- Indexing & batch processing

### 10. 📘 Dokumentasi API (Swagger)
- OpenAPI 3.0 dengan Swagger UI
- Dokumentasi endpoint lengkap
- Contoh request/response
- Skema validasi & error handling

### 11. 💬 Integrasi Message (Twilio)
- Kirim SMS: Kirim pesan teks.
- Buat Panggilan: Inisiasi panggilan suara.
- Lihat Log Pesan: Ambil riwayat SMS.

### 12. 💳 Integrasi Pembayaran (Midtrans)
- Memulai pembayaran.
- Mengecek status pembayaran.
- Menerima update status pembayaran.

---

## 🛠️ Teknologi

- **Backend**: Node.js + Express.js
- **Authentication**: JWT, Google OAuth 2.0 (`passport.js`)
- **Database**: MySQL
- **Cache**: Redis (dengan ioredis & memory-cache)
- **Security & Middleware**: Helmet, Rate Limit, Throttling, Express Validator
- **Messaging**: WhatsApp Web.js & Twilio
- **Payment**: Midtrans
- **Logging**: Winston & Morgan
- **Dokumentasi**: Swagger + swagger-jsdoc + swagger-ui-express

---

## 🚀 Instalasi

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
npm i express mysql2 dotenv cors passport passport-google-oauth20 jsonwebtoken bcryptjs helmet express-rate-limit redis ioredis memory-cache compression winston morgan performance-now express-validator validator xss multer crypto-js whatsapp-web.js qrcode-terminal nodemailer moment uuid lodash axios express-session connect-redis midtrans-client twilio
```
## 📄 Konfigurasi
Buat file .env di root direktori dan isi variabel berikut:

```bash
PORT=3000

JWT_SECRET=your_jwt_secret_min_32

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token

MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
```

## ⚠️ Catatan
- Aplikasi masih dalam tahap pengembangan aktif
- OAuth harus dikonfigurasi melalui Google Developer Console
- Pastikan koneksi WhatsApp aktif jika ingin menggunakan integrasi WA
- Midtrans Payment Gateway harus dikonfigurasikan melalui website midtrans
- Twilio harus dikonfigurasikan melalui website twilio

## 📫 Kontak & Dokumentasi
- Dokumentasi API: Swagger tersedia di endpoint /api-docs/#/
- Developer: @Firstianmaker @Auraja @alifnadn
- Lisensi: MIT License

Made with ❤️ for financial clarity and project transparency.
