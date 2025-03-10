const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all nota
router.get('/', (req, res) => {
    db.query('SELECT * FROM Nota', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        res.json(results);
    });
});

// Get nota by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM Nota WHERE ID_Nota = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: "Nota tidak ditemukan" });
        }
        res.json(result[0]);
    });
});

// Create new nota
router.post('/', (req, res) => {
    const { ID_Transaksi, File_Nota, Status_Verifikasi, Tanggal_Unggah, Tanggal_Verifikasi } = req.body;
    
    if (!ID_Transaksi || !File_Nota || !Tanggal_Unggah) {
        return res.status(400).json({ error: 'ID Transaksi, File Nota, dan Tanggal Unggah wajib diisi' });
    }

    // Validasi Status_Verifikasi
    const validStatus = ['Pending', 'Approved', 'Rejected'];
    const status = Status_Verifikasi || 'Pending';
    if (!validStatus.includes(status)) {
        return res.status(400).json({ error: 'Status Verifikasi tidak valid' });
    }

    // Cek apakah Transaksi exists
    db.query('SELECT * FROM Transaksi WHERE ID_Transaksi = ?', [ID_Transaksi], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
        }

        db.query(
            'INSERT INTO Nota (ID_Transaksi, File_Nota, Status_Verifikasi, Tanggal_Unggah, Tanggal_Verifikasi) VALUES (?, ?, ?, ?, ?)',
            [ID_Transaksi, File_Nota, status, Tanggal_Unggah, Tanggal_Verifikasi],
            (err, result) => {
                if (err) return res.status(500).json({ error: 'Database insertion error', details: err });
                res.json({ message: 'Nota berhasil dibuat', notaId: result.insertId });
            }
        );
    });
});

// Update nota
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { ID_Transaksi, File_Nota, Status_Verifikasi, Tanggal_Unggah, Tanggal_Verifikasi } = req.body;

    // Validasi Status_Verifikasi jika ada
    if (Status_Verifikasi && !['Pending', 'Approved', 'Rejected'].includes(Status_Verifikasi)) {
        return res.status(400).json({ error: 'Status Verifikasi tidak valid' });
    }

    db.query('SELECT * FROM Nota WHERE ID_Nota = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Nota tidak ditemukan' });
        }

        const oldData = result[0];

        // Jika ada ID_Transaksi baru, cek dulu transaksinya ada atau tidak
        if (ID_Transaksi && ID_Transaksi !== oldData.ID_Transaksi) {
            db.query('SELECT * FROM Transaksi WHERE ID_Transaksi = ?', [ID_Transaksi], (err, result) => {
                if (err) return res.status(500).json({ error: 'Database query error', details: err });
                if (result.length === 0) {
                    return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
                }
                updateNota();
            });
        } else {
            updateNota();
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
                    if (err) return res.status(500).json({ error: 'Database update error', details: err });
                    res.json({ message: 'Nota berhasil diupdate' });
                }
            );
        }
    });
});

// Delete nota
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    
    db.query('DELETE FROM Nota WHERE ID_Nota = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database deletion error', details: err });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Nota tidak ditemukan' });
        }
        res.json({ message: 'Nota berhasil dihapus' });
    });
});

module.exports = router;