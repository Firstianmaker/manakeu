const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all projects
router.get('/', (req, res) => {
    db.query('SELECT * FROM Project', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        res.json(results);
    });
});

// Get project by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM Project WHERE ID_Project = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: "Project not found" });
        }
        res.json(result[0]);
    });
});

// Create new project
router.post('/', (req, res) => {
    const { Nama_Project, Deskripsi, Tanggal_Mulai, Tanggal_Selesai, Status } = req.body;
    
    if (!Nama_Project || !Status) {
        return res.status(400).json({ error: 'Nama Project dan Status wajib diisi' });
    }

    db.query(
        'INSERT INTO Project (Nama_Project, Deskripsi, Tanggal_Mulai, Tanggal_Selesai, Status) VALUES (?, ?, ?, ?, ?)',
        [Nama_Project, Deskripsi, Tanggal_Mulai, Tanggal_Selesai, Status],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Database insertion error', details: err });
            res.json({ message: 'Project berhasil dibuat', projectId: result.insertId });
        }
    );
});

// Update project
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { Nama_Project, Deskripsi, Tanggal_Mulai, Tanggal_Selesai, Status } = req.body;

    db.query('SELECT * FROM Project WHERE ID_Project = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Project tidak ditemukan' });
        }

        const oldData = result[0];
        
        const updatedData = {
            Nama_Project: Nama_Project || oldData.Nama_Project,
            Deskripsi: Deskripsi !== undefined ? Deskripsi : oldData.Deskripsi,
            Tanggal_Mulai: Tanggal_Mulai || oldData.Tanggal_Mulai,
            Tanggal_Selesai: Tanggal_Selesai || oldData.Tanggal_Selesai,
            Status: Status || oldData.Status
        };

        db.query(
            'UPDATE Project SET ? WHERE ID_Project = ?',
            [updatedData, id],
            (err, result) => {
                if (err) return res.status(500).json({ error: 'Database update error', details: err });
                res.json({ message: 'Project berhasil diupdate' });
            }
        );
    });
});

// Delete project
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    
    db.query('DELETE FROM Project WHERE ID_Project = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database deletion error', details: err });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Project tidak ditemukan' });
        }
        res.json({ message: 'Project berhasil dihapus' });
    });
});

module.exports = router;