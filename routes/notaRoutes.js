const express = require('express'); // Mengimport Express.js
const router = express.Router(); // Membuat router baru
const db = require('../config/database'); // Mengimport koneksi basis data

// Menangani request GET untuk mendapatkan semua nota
router.get('/', (req, res) => {
    db.query('SELECT * FROM Nota', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        res.json(results); // Mengembalikan hasil query
    });
});

// Menangani request GET untuk mendapatkan nota berdasarkan ID
router.get('/:id', (req, res) => {
    const { id } = req.params; // Mengambil ID dari parameter
    db.query('SELECT * FROM Nota WHERE ID_Nota = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        if (result.length === 0) {
            return res.status(404).json({ error: "Nota tidak ditemukan" }); // Mengembalikan error jika nota tidak ditemukan
        }
        res.json(result[0]); // Mengembalikan detail nota
    });
});

// Menangani request POST untuk membuat nota baru
router.post('/', (req, res) => {
    const { ID_Transaksi, File_Nota, Status_Verifikasi, Tanggal_Unggah, Tanggal_Verifikasi } = req.body;
    
    if (!ID_Transaksi || !File_Nota || !Tanggal_Unggah) {
        return res.status(400).json({ error: 'ID Transaksi, File Nota, dan Tanggal Unggah wajib diisi' }); // Mengembalikan error jika data wajib tidak diisi
    }

    // Validasi Status_Verifikasi
    const validStatus = ['Pending', 'Approved', 'Rejected'];
    const status = Status_Verifikasi || 'Pending';
    if (!validStatus.includes(status)) {
        return res.status(400).json({ error: 'Status Verifikasi tidak valid' }); // Mengembalikan error jika status tidak valid
    }

    // Cek apakah Transaksi exists
    db.query('SELECT * FROM Transaksi WHERE ID_Transaksi = ?', [ID_Transaksi], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        if (result.length === 0) {
            return res.status(404).json({ error: 'Transaksi tidak ditemukan' }); // Mengembalikan error jika transaksi tidak ditemukan
        }

        db.query(
            'INSERT INTO Nota (ID_Transaksi, File_Nota, Status_Verifikasi, Tanggal_Unggah, Tanggal_Verifikasi) VALUES (?, ?, ?, ?, ?)',
            [ID_Transaksi, File_Nota, status, Tanggal_Unggah, Tanggal_Verifikasi],
            (err, result) => {
                if (err) return res.status(500).json({ error: 'Database insertion error', details: err }); // Menangani error basis data
                res.json({ message: 'Nota berhasil dibuat', notaId: result.insertId }); // Mengembalikan pesan sukses
            }
        );
    });
});

// Menangani request PUT untuk mengupdate nota
router.put('/:id', (req, res) => {
    const { id } = req.params; // Mengambil ID dari parameter
    const { ID_Transaksi, File_Nota, Status_Verifikasi, Tanggal_Unggah, Tanggal_Verifikasi } = req.body;

    // Validasi Status_Verifikasi jika ada
    if (Status_Verifikasi && !['Pending', 'Approved', 'Rejected'].includes(Status_Verifikasi)) {
        return res.status(400).json({ error: 'Status Verifikasi tidak valid' }); // Mengembalikan error jika status tidak valid
    }

    db.query('SELECT * FROM Nota WHERE ID_Nota = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        if (result.length === 0) {
            return res.status(404).json({ error: 'Nota tidak ditemukan' }); // Mengembalikan error jika nota tidak ditemukan
        }

        const oldData = result[0]; // Mengambil data lama

        // Jika ada ID_Transaksi baru, cek dulu transaksinya ada atau tidak
        if (ID_Transaksi && ID_Transaksi !== oldData.ID_Transaksi) {
            db.query('SELECT * FROM Transaksi WHERE ID_Transaksi = ?', [ID_Transaksi], (err, result) => {
                if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
                if (result.length === 0) {
                    return res.status(404).json({ error: 'Transaksi tidak ditemukan' }); // Mengembalikan error jika transaksi tidak ditemukan
                }
                updateNota(); // Memanggil fungsi updateNota
            });
        } else {
            updateNota(); // Memanggil fungsi updateNota
        }

        function updateNota() {
            const updatedData = {
                ID_Transaksi: ID_Transaksi || oldData.ID_Transaksi,
                File_Nota: File_Nota || oldData.File_Nota,
                Status_Verifikasi: Status_Verifikasi || oldData.Status_Verifikasi,
                Tanggal_Unggah: Tanggal_Unggah || oldData.Tanggal_Unggah,
                Tanggal_Verifikasi: Tanggal_Verifikasi !== undefined ? Tanggal_Verifikasi : oldData.Tanggal_Verifikasi
            };

            db.query(
                'UPDATE Nota SET ? WHERE ID_Nota = ?',
                [updatedData, id],
                (err, result) => {
                    if (err) return res.status(500).json({ error: 'Database update error', details: err }); // Menangani error basis data
                    res.json({ message: 'Nota berhasil diupdate' }); // Mengembalikan pesan sukses
                }
            );
        }
    });
});

// Menangani request DELETE untuk menghapus nota
router.delete('/:id', (req, res) => {
    const { id } = req.params; // Mengambil ID dari parameter
    
    db.query('DELETE FROM Nota WHERE ID_Nota = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database deletion error', details: err }); // Menangani error basis data
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Nota tidak ditemukan' }); // Mengembalikan error jika nota tidak ditemukan
        }
        res.json({ message: 'Nota berhasil dihapus' }); // Mengembalikan pesan sukses
    });
});

module.exports = router;