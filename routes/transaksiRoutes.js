const express = require('express'); // Mengimport Express.js
const router = express.Router(); // Membuat router baru
const db = require('../config/database'); // Mengimport koneksi basis data
const { transactionThrottler } = require('../middleware/throttler');

// Menangani request GET untuk mendapatkan semua transaksi
router.get('/', (req, res) => {
    db.query('SELECT * FROM Transaksi', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        res.json(results); // Mengembalikan hasil query
    });
});

// Menangani request GET untuk mendapatkan transaksi berdasarkan ID
router.get('/:id', (req, res) => {
    const { id } = req.params; // Mengambil ID dari parameter
    db.query('SELECT * FROM Transaksi WHERE ID_Transaksi = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        if (result.length === 0) {
            return res.status(404).json({ error: "Transaksi tidak ditemukan" }); // Mengembalikan error jika transaksi tidak ditemukan
        }
        res.json(result[0]); // Mengembalikan detail transaksi
    });
});

// Menangani request POST untuk membuat transaksi baru
router.post('/', transactionThrottler, async (req, res) => {
    const { ID_Project, Jenis_Transaksi, Jumlah, Tanggal_Transaksi, Keterangan } = req.body;
    
    // Validasi field yang wajib
    if (!ID_Project || !Jenis_Transaksi || !Jumlah || !Tanggal_Transaksi) {
        return res.status(400).json({ error: 'ID Project, Jenis Transaksi, Jumlah, dan Tanggal Transaksi wajib diisi' }); // Mengembalikan error jika data wajib tidak diisi
    }

    // Validasi Jenis_Transaksi harus 'Pemasukan' atau 'Pengeluaran'
    if (!['Pemasukan', 'Pengeluaran'].includes(Jenis_Transaksi)) {
        return res.status(400).json({ error: 'Jenis Transaksi harus Pemasukan atau Pengeluaran' }); // Mengembalikan error jika Jenis Transaksi tidak valid
    }

    // Cek apakah Project exists
    db.query('SELECT * FROM Project WHERE ID_Project = ?', [ID_Project], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        if (result.length === 0) {
            return res.status(404).json({ error: 'Project tidak ditemukan' }); // Mengembalikan error jika project tidak ditemukan
        }

        // Insert transaksi
        db.query(
            'INSERT INTO Transaksi (ID_Project, Jenis_Transaksi, Jumlah, Tanggal_Transaksi, Keterangan) VALUES (?, ?, ?, ?, ?)',
            [ID_Project, Jenis_Transaksi, Jumlah, Tanggal_Transaksi, Keterangan],
            (err, result) => {
                if (err) return res.status(500).json({ error: 'Database insertion error', details: err }); // Menangani error basis data
                res.json({ message: 'Transaksi berhasil dibuat', transaksiId: result.insertId }); // Mengembalikan pesan sukses
            }
        );
    });
});

// Menangani request PUT untuk mengupdate transaksi
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { ID_Project, Jenis_Transaksi, Jumlah, Tanggal_Transaksi, Keterangan } = req.body;

    // Validasi Jenis_Transaksi jika ada
    if (Jenis_Transaksi && !['Pemasukan', 'Pengeluaran'].includes(Jenis_Transaksi)) {
        return res.status(400).json({ error: 'Jenis Transaksi harus Pemasukan atau Pengeluaran' }); // Mengembalikan error jika Jenis Transaksi tidak valid
    }

    db.query('SELECT * FROM Transaksi WHERE ID_Transaksi = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        if (result.length === 0) {
            return res.status(404).json({ error: 'Transaksi tidak ditemukan' }); // Mengembalikan error jika transaksi tidak ditemukan
        }

        const oldData = result[0];
        
        // Jika ada ID_Project baru, cek dulu projectnya ada atau tidak
        if (ID_Project && ID_Project !== oldData.ID_Project) {
            db.query('SELECT * FROM Project WHERE ID_Project = ?', [ID_Project], (err, result) => {
                if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
                if (result.length === 0) {
                    return res.status(404).json({ error: 'Project tidak ditemukan' }); // Mengembalikan error jika project tidak ditemukan
                }
                updateTransaksi(); // Memanggil fungsi updateTransaksi
            });
        } else {
            updateTransaksi(); // Memanggil fungsi updateTransaksi
        }

        function updateTransaksi() {
            const updatedData = {
                ID_Project: ID_Project || oldData.ID_Project,
                Jenis_Transaksi: Jenis_Transaksi || oldData.Jenis_Transaksi,
                Jumlah: Jumlah || oldData.Jumlah,
                Tanggal_Transaksi: Tanggal_Transaksi || oldData.Tanggal_Transaksi,
                Keterangan: Keterangan !== undefined ? Keterangan : oldData.Keterangan
            };

            db.query(
                'UPDATE Transaksi SET ? WHERE ID_Transaksi = ?',
                [updatedData, id],
                (err, result) => {
                    if (err) return res.status(500).json({ error: 'Database update error', details: err }); // Menangani error basis data
                    res.json({ message: 'Transaksi berhasil diupdate' }); // Mengembalikan pesan sukses
                }
            );
        }
    });
});

// Menangani request DELETE untuk menghapus transaksi
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    
    db.query('DELETE FROM Transaksi WHERE ID_Transaksi = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database deletion error', details: err }); // Menangani error basis data
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Transaksi tidak ditemukan' }); // Mengembalikan error jika transaksi tidak ditemukan
        }
        res.json({ message: 'Transaksi berhasil dihapus' }); // Mengembalikan pesan sukses
    });
});

module.exports = router;