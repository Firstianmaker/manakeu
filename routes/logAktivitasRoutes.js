const express = require('express'); // Mengimport Express.js
const router = express.Router(); // Membuat router baru
const db = require('../config/database'); // Mengimport koneksi basis data

// Menangani request GET untuk mendapatkan semua log aktivitas
router.get('/', (req, res) => {
    db.query('SELECT * FROM Log_Aktivitas ORDER BY Tanggal_Aksi DESC', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        res.json(results); // Mengembalikan hasil query
    });
});

// Menangani request GET untuk mendapatkan log aktivitas berdasarkan ID
router.get('/:id', (req, res) => {
    const { id } = req.params; // Mengambil ID dari parameter
    db.query('SELECT * FROM Log_Aktivitas WHERE ID_Log = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        if (result.length === 0) {
            return res.status(404).json({ error: "Log tidak ditemukan" }); // Mengembalikan error jika log tidak ditemukan
        }
        res.json(result[0]); // Mengembalikan detail log
    });
});

// Menangani request POST untuk membuat log aktivitas baru
router.post('/', (req, res) => {
    const { ID_User, Aksi } = req.body; // Mengambil data dari body
    
    if (!ID_User || !Aksi) {
        return res.status(400).json({ error: 'ID User dan Aksi wajib diisi' }); // Mengembalikan error jika data wajib tidak diisi
    }

    // Cek apakah User exists
    db.query('SELECT * FROM User WHERE ID_User = ?', [ID_User], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        if (result.length === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan' }); // Mengembalikan error jika user tidak ditemukan
        }

        db.query(
            'INSERT INTO Log_Aktivitas (ID_User, Aksi) VALUES (?, ?)',
            [ID_User, Aksi],
            (err, result) => {
                if (err) return res.status(500).json({ error: 'Database insertion error', details: err }); // Menangani error basis data
                res.json({ message: 'Log berhasil dibuat', logId: result.insertId }); // Mengembalikan pesan sukses
            }
        );
    });
});

// Menangani request DELETE untuk menghapus log (opsional, biasanya log tidak dihapus)
router.delete('/:id', (req, res) => {
    const { id } = req.params; // Mengambil ID dari parameter
    
    db.query('DELETE FROM Log_Aktivitas WHERE ID_Log = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database deletion error', details: err }); // Menangani error basis data
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Log tidak ditemukan' }); // Mengembalikan error jika log tidak ditemukan
        }
        res.json({ message: 'Log berhasil dihapus' }); // Mengembalikan pesan sukses
    });
});

module.exports = router;