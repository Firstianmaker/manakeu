const express = require('express'); // Mengimport Express.js
const router = express.Router(); // Membuat router baru
const db = require('../config/database'); // Mengimport koneksi basis data

/**
 * @swagger
 * components:
 *   schemas:
 *     Nota:
 *       type: object
 *       required:
 *         - ID_Transaksi
 *         - File_Nota
 *         - Tanggal_Unggah
 *       properties:
 *         ID_Nota:
 *           type: integer
 *           description: The auto-generated id of the nota
 *         ID_Transaksi:
 *           type: integer
 *           description: The ID of the associated transaction
 *         File_Nota:
 *           type: string
 *           description: The file path or URL of the nota document
 *         Status_Verifikasi:
 *           type: string
 *           enum: [Pending, Approved, Rejected]
 *           description: The verification status of the nota
 *         Tanggal_Unggah:
 *           type: string
 *           format: date
 *           description: The upload date of the nota
 *         Tanggal_Verifikasi:
 *           type: string
 *           format: date
 *           description: The verification date of the nota
 */

/**
 * @swagger
 * /api/nota:
 *   get:
 *     summary: Returns all notas
 *     tags: [Nota]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of notas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Nota'
 *       500:
 *         description: Database query error
 */
// Menangani request GET untuk mendapatkan semua nota
router.get('/', (req, res) => {
    db.query('SELECT * FROM Nota', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        res.json(results); // Mengembalikan hasil query
    });
});

/**
 * @swagger
 * /api/nota/{id}:
 *   get:
 *     summary: Get nota by ID
 *     tags: [Nota]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Nota ID
 *     responses:
 *       200:
 *         description: Nota details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Nota'
 *       404:
 *         description: Nota not found
 *       500:
 *         description: Database query error
 */
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

/**
 * @swagger
 * /api/nota:
 *   post:
 *     summary: Create a new nota
 *     tags: [Nota]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ID_Transaksi
 *               - File_Nota
 *               - Tanggal_Unggah
 *             properties:
 *               ID_Transaksi:
 *                 type: integer
 *               File_Nota:
 *                 type: string
 *               Status_Verifikasi:
 *                 type: string
 *                 enum: [Pending, Approved, Rejected]
 *               Tanggal_Unggah:
 *                 type: string
 *                 format: date
 *               Tanggal_Verifikasi:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Nota created successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Database insertion error
 */
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

/**
 * @swagger
 * /api/nota/{id}:
 *   put:
 *     summary: Update nota by ID
 *     tags: [Nota]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Nota ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ID_Transaksi:
 *                 type: integer
 *               File_Nota:
 *                 type: string
 *               Status_Verifikasi:
 *                 type: string
 *                 enum: [Pending, Approved, Rejected]
 *               Tanggal_Unggah:
 *                 type: string
 *                 format: date
 *               Tanggal_Verifikasi:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Nota updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Nota or Transaction not found
 *       500:
 *         description: Database update error
 */
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

/**
 * @swagger
 * /api/nota/{id}:
 *   delete:
 *     summary: Delete nota by ID
 *     tags: [Nota]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Nota ID
 *     responses:
 *       200:
 *         description: Nota deleted successfully
 *       404:
 *         description: Nota not found
 *       500:
 *         description: Database deletion error
 */
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