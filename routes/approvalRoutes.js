const express = require('express'); // Mengimport Express.js
const router = express.Router(); // Membuat router baru
const db = require('../config/database'); // Mengimport koneksi basis data

// Menangani request GET untuk mendapatkan semua approval
router.get('/', (req, res) => {
    db.query('SELECT * FROM Approval', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        res.json(results); // Mengembalikan hasil query
    });
});

// Menangani request GET untuk mendapatkan approval berdasarkan ID
router.get('/:id', (req, res) => {
    const { id } = req.params; // Mengambil ID dari parameter
    db.query('SELECT * FROM Approval WHERE ID_Approval = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        if (result.length === 0) {
            return res.status(404).json({ error: "Approval tidak ditemukan" }); // Mengembalikan error jika approval tidak ditemukan
        }
        res.json(result[0]); // Mengembalikan detail approval
    });
});

// Menangani request POST untuk membuat approval baru
router.post('/', (req, res) => {
    const { ID_Nota, ID_Admin, Status_Approval, Tanggal_Approval, Catatan } = req.body; // Mengambil data dari body
    
    if (!ID_Nota || !ID_Admin || !Status_Approval || !Tanggal_Approval) {
        return res.status(400).json({ error: 'ID Nota, ID Admin, Status Approval, dan Tanggal Approval wajib diisi' }); // Mengembalikan error jika data wajib tidak diisi
    }

    // Validasi Status_Approval
    if (!['Approved', 'Rejected'].includes(Status_Approval)) {
        return res.status(400).json({ error: 'Status Approval harus Approved atau Rejected' }); // Mengembalikan error jika status tidak valid
    }

    // Cek apakah Nota exists
    db.query('SELECT * FROM Nota WHERE ID_Nota = ?', [ID_Nota], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        if (result.length === 0) {
            return res.status(404).json({ error: 'Nota tidak ditemukan' }); // Mengembalikan error jika nota tidak ditemukan
        }

        // Cek apakah Admin exists dan rolenya Admin
        db.query('SELECT * FROM User WHERE ID_User = ? AND Role = "Admin"', [ID_Admin], (err, result) => {
            if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
            if (result.length === 0) {
                return res.status(404).json({ error: 'Admin tidak ditemukan atau user bukan admin' }); // Mengembalikan error jika admin tidak ditemukan atau bukan admin
            }

            db.query(
                'INSERT INTO Approval (ID_Nota, ID_Admin, Status_Approval, Tanggal_Approval, Catatan) VALUES (?, ?, ?, ?, ?)',
                [ID_Nota, ID_Admin, Status_Approval, Tanggal_Approval, Catatan],
                (err, result) => {
                    if (err) return res.status(500).json({ error: 'Database insertion error', details: err }); // Menangani error basis data
                    
                    // Update status verifikasi nota
                    db.query(
                        'UPDATE Nota SET Status_Verifikasi = ?, Tanggal_Verifikasi = ? WHERE ID_Nota = ?',
                        [Status_Approval, Tanggal_Approval, ID_Nota],
                        (err) => {
                            if (err) return res.status(500).json({ error: 'Database update error', details: err }); // Menangani error basis data
                            res.json({ message: 'Approval berhasil dibuat', approvalId: result.insertId }); // Mengembalikan pesan sukses
                        }
                    );
                }
            );
        });
    });
});

// Menangani request PUT untuk mengupdate approval
router.put('/:id', (req, res) => {
    const { id } = req.params; // Mengambil ID dari parameter
    const { Status_Approval, Catatan } = req.body; // Mengambil data dari body

    if (Status_Approval && !['Approved', 'Rejected'].includes(Status_Approval)) {
        return res.status(400).json({ error: 'Status Approval harus Approved atau Rejected' }); // Mengembalikan error jika status tidak valid
    }

    db.query('SELECT * FROM Approval WHERE ID_Approval = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        if (result.length === 0) {
            return res.status(404).json({ error: 'Approval tidak ditemukan' }); // Mengembalikan error jika approval tidak ditemukan
        }

        const oldData = result[0]; // Mengambil data lama
        const updatedData = {
            Status_Approval: Status_Approval || oldData.Status_Approval, // Mengupdate status approval jika ada
            Catatan: Catatan !== undefined ? Catatan : oldData.Catatan // Mengupdate catatan jika ada
        };

        db.query(
            'UPDATE Approval SET ? WHERE ID_Approval = ?',
            [updatedData, id],
            (err, result) => {
                if (err) return res.status(500).json({ error: 'Database update error', details: err }); // Menangani error basis data
                
                // Update status verifikasi nota jika status approval berubah
                if (Status_Approval) {
                    db.query(
                        'UPDATE Nota SET Status_Verifikasi = ? WHERE ID_Nota = ?',
                        [Status_Approval, oldData.ID_Nota],
                        (err) => {
                            if (err) return res.status(500).json({ error: 'Database update error', details: err }); // Menangani error basis data
                            res.json({ message: 'Approval berhasil diupdate' }); // Mengembalikan pesan sukses
                        }
                    );
                } else {
                    res.json({ message: 'Approval berhasil diupdate' }); // Mengembalikan pesan sukses jika tidak ada perubahan status
                }
            }
        );
    });
});

// Menangani request DELETE untuk menghapus approval
router.delete('/:id', (req, res) => {
    const { id } = req.params; // Mengambil ID dari parameter
    
    db.query('DELETE FROM Approval WHERE ID_Approval = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database deletion error', details: err }); // Menangani error basis data
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Approval tidak ditemukan' }); // Mengembalikan error jika approval tidak ditemukan
        }
        res.json({ message: 'Approval berhasil dihapus' }); // Mengembalikan pesan sukses
    });
});

module.exports = router;