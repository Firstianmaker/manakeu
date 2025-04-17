// Import library mysql2 untuk koneksi ke basis data MySQL
const mysql = require('mysql2');
const Encryption = require('../utils/encryption');
// Mengatur variabel lingkungan menggunakan dotenv
require('dotenv').config();

// Membuat koneksi ke basis data menggunakan konfigurasi dari variabel lingkungan
const connection = mysql.createConnection({
    host: process.env.DB_HOST, // Alamat basis data
    user: process.env.DB_USER, // Nama pengguna basis data
    password: process.env.DB_PASSWORD, // Kata sandi basis data
    database: process.env.DB_NAME // Nama basis data
});

// Mencoba menghubungkan ke basis data
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err); // Menampilkan error jika gagal terhubung
        return;
    }
    console.log('Connected to database'); // Menampilkan pesan jika berhasil terhubung
});

// Mengekspor koneksi basis data untuk digunakan di file lain
module.exports = connection;