const express = require('express'); // Mengimport Express.js
const router = express.Router(); // Membuat router baru
const db = require('../config/database'); // Mengimport koneksi basis data

/**
 * @swagger
 * components:
 *   schemas:
 *     LogAktivitas:
 *       type: object
 *       required:
 *         - ID_User
 *         - Aksi
 *       properties:
 *         ID_Log:
 *           type: integer
 *           description: The auto-generated id of the activity log
 *         ID_User:
 *           type: integer
 *           description: The ID of the user who performed the action
 *         Aksi:
 *           type: string
 *           description: Description of the action performed
 *         Tanggal_Aksi:
 *           type: string
 *           format: date-time
 *           description: The timestamp of when the action was performed
 */

/**
 * @swagger
 * tags:
 *   name: Activity Logs
 *   description: User activity logging and tracking
 */

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Returns all activity logs
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of activity logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LogAktivitas'
 *       500:
 *         description: Database query error
 */
// Menangani request GET untuk mendapatkan semua log aktivitas
router.get('/', (req, res) => {
    db.query('SELECT * FROM Log_Aktivitas ORDER BY Tanggal_Aksi DESC', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        res.json(results); // Mengembalikan hasil query
    });
});

/**
 * @swagger
 * /api/logs/{id}:
 *   get:
 *     summary: Get activity log by ID
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Activity log ID
 *     responses:
 *       200:
 *         description: Activity log details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogAktivitas'
 *       404:
 *         description: Activity log not found
 *       500:
 *         description: Database query error
 */
// Menangani request GET untuk mendapatkan log aktivitas berdasarkan ID
router.get('/:id', (req, res) => {
    const { id } = req.params; // Mengambil ID dari parameter
    db.query('SELECT * FROM Log_Aktivitas WHERE ID_Log = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        if (result.length === 0) {
            return res.status(404).json({ error: "Log tidak ditemukan" }); // Mengembalikan error jika log tidak ditemukan
        }
        res.json(result[0]); // Mengembalikan detail log
    });
});

/**
 * @swagger
 * /api/logs:
 *   post:
 *     summary: Create a new activity log
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ID_User
 *               - Aksi
 *             properties:
 *               ID_User:
 *                 type: integer
 *                 description: The ID of the user performing the action
 *               Aksi:
 *                 type: string
 *                 description: Description of the action performed
 *     responses:
 *       200:
 *         description: Activity log created successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User not found
 *       500:
 *         description: Database error
 */
// Menangani request POST untuk membuat log aktivitas baru
router.post('/', (req, res) => {
    const { ID_User, Aksi } = req.body; // Mengambil data dari body
    
    if (!ID_User || !Aksi) {
        return res.status(400).json({ error: 'ID User dan Aksi wajib diisi' }); // Mengembalikan error jika data wajib tidak diisi
    }

    // Cek apakah User exists
    db.query('SELECT * FROM User WHERE ID_User = ?', [ID_User], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        if (result.length === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan' }); // Mengembalikan error jika user tidak ditemukan
        }

        db.query(
            'INSERT INTO Log_Aktivitas (ID_User, Aksi) VALUES (?, ?)',
            [ID_User, Aksi],
            (err, result) => {
                if (err) return res.status(500).json({ error: 'Database insertion error', details: err }); // Menangani error basis data
                res.json({ message: 'Log berhasil dibuat', logId: result.insertId }); // Mengembalikan pesan sukses
            }
        );
    });
});

/**
 * @swagger
 * /api/logs/{id}:
 *   delete:
 *     summary: Delete an activity log
 *     tags: [Activity Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Activity log ID
 *     responses:
 *       200:
 *         description: Activity log deleted successfully
 *       404:
 *         description: Activity log not found
 *       500:
 *         description: Database deletion error
 */
// Menangani request DELETE untuk menghapus log (opsional, biasanya log tidak dihapus)
router.delete('/:id', (req, res) => {
    const { id } = req.params; // Mengambil ID dari parameter
    
    db.query('DELETE FROM Log_Aktivitas WHERE ID_Log = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database deletion error', details: err }); // Menangani error basis data
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Log tidak ditemukan' }); // Mengembalikan error jika log tidak ditemukan
        }
        res.json({ message: 'Log berhasil dihapus' }); // Mengembalikan pesan sukses
    });
});

module.exports = router;