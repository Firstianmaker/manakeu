const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all users
router.get('/', (req, res) => {
    db.query('SELECT * FROM User', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        res.json(results);
    });
});

// Get user by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM User WHERE ID_User = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: "User tidak ditemukan" });
        }
        res.json(result[0]);
    });
});

// Create new user
router.post('/', (req, res) => {
    const { Nama, Email, Role } = req.body;
    
    if (!Nama || !Email || !Role) {
        return res.status(400).json({ error: 'Nama, Email, dan Role wajib diisi' });
    }

    if (!['Admin', 'User'].includes(Role)) {
        return res.status(400).json({ error: 'Role harus Admin atau User' });
    }

    db.query(
        'INSERT INTO User (Nama, Email, Role) VALUES (?, ?, ?)',
        [Nama, Email, Role],
        (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Email sudah terdaftar' });
                }
                return res.status(500).json({ error: 'Database insertion error', details: err });
            }
            res.json({ message: 'User berhasil dibuat', userId: result.insertId });
        }
    );
});

// Update user
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { Nama, Email, Role } = req.body;

    if (Role && !['Admin', 'User'].includes(Role)) {
        return res.status(400).json({ error: 'Role harus Admin atau User' });
    }

    db.query('SELECT * FROM User WHERE ID_User = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }

        const oldData = result[0];
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
                        return res.status(400).json({ error: 'Email sudah terdaftar' });
                    }
                    return res.status(500).json({ error: 'Database update error', details: err });
                }
                res.json({ message: 'User berhasil diupdate' });
            }
        );
    });
});

// Delete user
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    
    db.query('DELETE FROM User WHERE ID_User = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database deletion error', details: err });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }
        res.json({ message: 'User berhasil dihapus' });
    });
});

module.exports = router;