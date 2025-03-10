const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all approvals
router.get('/', (req, res) => {
    db.query('SELECT * FROM Approval', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        res.json(results);
    });
});

// Get approval by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM Approval WHERE ID_Approval = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: "Approval tidak ditemukan" });
        }
        res.json(result[0]);
    });
});

// Create new approval
router.post('/', (req, res) => {
    const { ID_Nota, ID_Admin, Status_Approval, Tanggal_Approval, Catatan } = req.body;
    
    if (!ID_Nota || !ID_Admin || !Status_Approval || !Tanggal_Approval) {
        return res.status(400).json({ error: 'ID Nota, ID Admin, Status Approval, dan Tanggal Approval wajib diisi' });
    }

    // Validasi Status_Approval
    if (!['Approved', 'Rejected'].includes(Status_Approval)) {
        return res.status(400).json({ error: 'Status Approval harus Approved atau Rejected' });
    }

    // Cek apakah Nota exists
    db.query('SELECT * FROM Nota WHERE ID_Nota = ?', [ID_Nota], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Nota tidak ditemukan' });
        }

        // Cek apakah Admin exists dan rolenya Admin
        db.query('SELECT * FROM User WHERE ID_User = ? AND Role = "Admin"', [ID_Admin], (err, result) => {
            if (err) return res.status(500).json({ error: 'Database query error', details: err });
            if (result.length === 0) {
                return res.status(404).json({ error: 'Admin tidak ditemukan atau user bukan admin' });
            }

            db.query(
                'INSERT INTO Approval (ID_Nota, ID_Admin, Status_Approval, Tanggal_Approval, Catatan) VALUES (?, ?, ?, ?, ?)',
                [ID_Nota, ID_Admin, Status_Approval, Tanggal_Approval, Catatan],
                (err, result) => {
                    if (err) return res.status(500).json({ error: 'Database insertion error', details: err });
                    
                    // Update status verifikasi nota
                    db.query(
                        'UPDATE Nota SET Status_Verifikasi = ?, Tanggal_Verifikasi = ? WHERE ID_Nota = ?',
                        [Status_Approval, Tanggal_Approval, ID_Nota],
                        (err) => {
                            if (err) return res.status(500).json({ error: 'Database update error', details: err });
                            res.json({ message: 'Approval berhasil dibuat', approvalId: result.insertId });
                        }
                    );
                }
            );
        });
    });
});

// Update approval
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { Status_Approval, Catatan } = req.body;

    if (Status_Approval && !['Approved', 'Rejected'].includes(Status_Approval)) {
        return res.status(400).json({ error: 'Status Approval harus Approved atau Rejected' });
    }

    db.query('SELECT * FROM Approval WHERE ID_Approval = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Approval tidak ditemukan' });
        }

        const oldData = result[0];
        const updatedData = {
            Status_Approval: Status_Approval || oldData.Status_Approval,
            Catatan: Catatan !== undefined ? Catatan : oldData.Catatan
        };

        db.query(
            'UPDATE Approval SET ? WHERE ID_Approval = ?',
            [updatedData, id],
            (err, result) => {
                if (err) return res.status(500).json({ error: 'Database update error', details: err });
                
                // Update status verifikasi nota jika status approval berubah
                if (Status_Approval) {
                    db.query(
                        'UPDATE Nota SET Status_Verifikasi = ? WHERE ID_Nota = ?',
                        [Status_Approval, oldData.ID_Nota],
                        (err) => {
                            if (err) return res.status(500).json({ error: 'Database update error', details: err });
                            res.json({ message: 'Approval berhasil diupdate' });
                        }
                    );
                } else {
                    res.json({ message: 'Approval berhasil diupdate' });
                }
            }
        );
    });
});

// Delete approval
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    
    db.query('DELETE FROM Approval WHERE ID_Approval = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database deletion error', details: err });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Approval tidak ditemukan' });
        }
        res.json({ message: 'Approval berhasil dihapus' });
    });
});

module.exports = router;