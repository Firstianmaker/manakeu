const express = require('express'); // Mengimport Express.js
const router = express.Router(); // Membuat router baru
const db = require('../config/database'); // Mengimport koneksi basis data
const { approvalThrottler } = require('../middleware/throttler');

/**
 * @swagger
 * components:
 *   schemas:
 *     Approval:
 *       type: object
 *       required:
 *         - ID_Nota
 *         - ID_Admin
 *         - Status_Approval
 *         - Tanggal_Approval
 *       properties:
 *         ID_Approval:
 *           type: integer
 *           description: The auto-generated id of the approval
 *         ID_Nota:
 *           type: integer
 *           description: The ID of the associated nota
 *         ID_Admin:
 *           type: integer
 *           description: The ID of the admin who approved/rejected
 *         Status_Approval:
 *           type: string
 *           enum: [Approved, Rejected]
 *           description: The approval status
 *         Tanggal_Approval:
 *           type: string
 *           format: date
 *           description: The date of approval/rejection
 *         Catatan:
 *           type: string
 *           description: Additional notes for the approval
 */

/**
 * @swagger
 * /api/approval:
 *   get:
 *     summary: Returns all approvals
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of approvals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Approval'
 *       500:
 *         description: Database query error
 */
// Menangani request GET untuk mendapatkan semua approval
router.get('/', (req, res) => {
    db.query('SELECT * FROM Approval', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        res.json(results); // Mengembalikan hasil query
    });
});

/**
 * @swagger
 * /api/approval/{id}:
 *   get:
 *     summary: Get approval by ID
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Approval ID
 *     responses:
 *       200:
 *         description: Approval details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Approval'
 *       404:
 *         description: Approval not found
 *       500:
 *         description: Database query error
 */
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

/**
 * @swagger
 * /api/approval/approve:
 *   post:
 *     summary: Create a new approval
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ID_Nota
 *               - ID_Admin
 *               - Status_Approval
 *               - Tanggal_Approval
 *             properties:
 *               ID_Nota:
 *                 type: integer
 *               ID_Admin:
 *                 type: integer
 *               Status_Approval:
 *                 type: string
 *                 enum: [Approved, Rejected]
 *               Tanggal_Approval:
 *                 type: string
 *                 format: date
 *               Catatan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Approval created successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Nota or Admin not found
 *       500:
 *         description: Database error
 */
// Menangani request POST untuk membuat approval baru
router.post('/approve', approvalThrottler, async (req, res) => {
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

/**
 * @swagger
 * /api/approval/{id}:
 *   put:
 *     summary: Update approval by ID
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Approval ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Status_Approval:
 *                 type: string
 *                 enum: [Approved, Rejected]
 *               Catatan:
 *                 type: string
 *     responses:
 *       200:
 *         description: Approval updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Approval not found
 *       500:
 *         description: Database error
 */
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

/**
 * @swagger
 * /api/approval/{id}:
 *   delete:
 *     summary: Delete approval by ID
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Approval ID
 *     responses:
 *       200:
 *         description: Approval deleted successfully
 *       404:
 *         description: Approval not found
 *       500:
 *         description: Database deletion error
 */
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