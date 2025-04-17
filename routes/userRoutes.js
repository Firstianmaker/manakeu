const express = require('express'); // Mengimport Express.js
const router = express.Router(); // Membuat router baru
const db = require('../config/database'); // Mengimport koneksi basis data
const { updateThrottler } = require('../middleware/throttler');

// Menangani request GET untuk mendapatkan semua user
router.get('/', (req, res) => {
    db.query('SELECT * FROM User', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        res.json(results); // Mengembalikan hasil query
    });
});

// Menangani request GET untuk mendapatkan user berdasarkan ID
router.get('/:id', (req, res) => {
    const { id } = req.params; // Mengambil ID dari parameter
    db.query('SELECT * FROM User WHERE ID_User = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        if (result.length === 0) {
            return res.status(404).json({ error: "User tidak ditemukan" }); // Mengembalikan error jika user tidak ditemukan
        }
        res.json(result[0]); // Mengembalikan detail user
    });
});

// Menangani request POST untuk membuat user baru
router.post('/:id', updateThrottler, async (req, res) => {
    const { Nama, Email, Role } = req.body;
    
    if (!Nama || !Email || !Role) {
        return res.status(400).json({ error: 'Nama, Email, dan Role wajib diisi' }); // Mengembalikan error jika data wajib tidak diisi
    }

    if (!['Admin', 'User'].includes(Role)) {
        return res.status(400).json({ error: 'Role harus Admin atau User' }); // Mengembalikan error jika Role tidak valid
    }

    db.query(
        'INSERT INTO User (Nama, Email, Role) VALUES (?, ?, ?)',
        [Nama, Email, Role],
        (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Email sudah terdaftar' }); // Mengembalikan error jika email sudah terdaftar
                }
                return res.status(500).json({ error: 'Database insertion error', details: err }); // Menangani error basis data
            }
            res.json({ message: 'User berhasil dibuat', userId: result.insertId }); // Mengembalikan pesan sukses
        }
    );
});

// Menangani request PUT untuk mengupdate user
router.put('/:id', (req, res) => {
    const { id } = req.params; // Mengambil ID dari parameter
    const { Nama, Email, Role } = req.body;

    if (Role && !['Admin', 'User'].includes(Role)) {
        return res.status(400).json({ error: 'Role harus Admin atau User' }); // Mengembalikan error jika Role tidak valid
    }

    db.query('SELECT * FROM User WHERE ID_User = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        if (result.length === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan' }); // Mengembalikan error jika user tidak ditemukan
        }

        const oldData = result[0]; // Mengambil data lama

        const updatedData = {
            Nama: Nama || oldData.Nama,
            Email: Email || oldData.Email,
            Role: Role || oldData.Role
        };

        db.query(
            'UPDATE User SET ? WHERE ID_User = ?',
            [updatedData, id],
            (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ error: 'Email sudah terdaftar' }); // Mengembalikan error jika email sudah terdaftar
                    }
                    return res.status(500).json({ error: 'Database update error', details: err }); // Menangani error basis data
                }
                res.json({ message: 'User berhasil diupdate' }); // Mengembalikan pesan sukses
            }
        );
    });
});

// Menangani request DELETE untuk menghapus user
router.delete('/:id', (req, res) => {
    const { id } = req.params; // Mengambil ID dari parameter
    
    db.query('DELETE FROM User WHERE ID_User = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database deletion error', details: err }); // Menangani error basis data
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan' }); // Mengembalikan error jika user tidak ditemukan
        }
        res.json({ message: 'User berhasil dihapus' }); // Mengembalikan pesan sukses
    });
});

module.exports = router;