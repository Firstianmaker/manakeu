const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all logs
router.get('/', (req, res) => {
    db.query('SELECT * FROM Log_Aktivitas ORDER BY Tanggal_Aksi DESC', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        res.json(results);
    });
});

// Get log by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM Log_Aktivitas WHERE ID_Log = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: "Log tidak ditemukan" });
        }
        res.json(result[0]);
    });
});

// Create new log
router.post('/', (req, res) => {
    const { ID_User, Aksi } = req.body;
    
    if (!ID_User || !Aksi) {
        return res.status(400).json({ error: 'ID User dan Aksi wajib diisi' });
    }

    // Cek apakah User exists
    db.query('SELECT * FROM User WHERE ID_User = ?', [ID_User], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }

        db.query(
            'INSERT INTO Log_Aktivitas (ID_User, Aksi) VALUES (?, ?)',
            [ID_User, Aksi],
            (err, result) => {
                if (err) return res.status(500).json({ error: 'Database insertion error', details: err });
                res.json({ message: 'Log berhasil dibuat', logId: result.insertId });
            }
        );
    });
});

// Delete log (opsional, biasanya log tidak dihapus)
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    
    db.query('DELETE FROM Log_Aktivitas WHERE ID_Log = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database deletion error', details: err });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Log tidak ditemukan' });
        }
        res.json({ message: 'Log berhasil dihapus' });
    });
});

module.exports = router;