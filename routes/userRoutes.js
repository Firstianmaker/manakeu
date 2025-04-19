const express = require('express'); // Mengimport Express.js
const router = express.Router(); // Membuat router baru
const db = require('../config/database'); // Mengimport koneksi basis data
const { updateThrottler } = require('../middleware/throttler');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - Nama
 *         - Email
 *         - Role
 *       properties:
 *         ID_User:
 *           type: integer
 *           description: The auto-generated id of the user
 *         Nama:
 *           type: string
 *           description: The name of the user
 *         Email:
 *           type: string
 *           description: The email of the user
 *         Role:
 *           type: string
 *           enum: [Admin, User]
 *           description: The role of the user
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Returns all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Database query error
 */
// Menangani request GET untuk mendapatkan semua user
router.get('/', (req, res) => {
    db.query('SELECT * FROM User', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        res.json(results); // Mengembalikan hasil query
    });
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Database query error
 */
// Menangani request GET untuk mendapatkan user berdasarkan ID
router.get('/:id', (req, res) => {
    const { id } = req.params; // Mengambil ID dari parameter
    db.query('SELECT * FROM User WHERE ID_User = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        if (result.length === 0) {
            return res.status(404).json({ error: "User tidak ditemukan" }); // Mengembalikan error jika user tidak ditemukan
        }
        res.json(result[0]); // Mengembalikan detail user
    });
});

/**
 * @swagger
 * /api/users/{id}:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Nama
 *               - Email
 *               - Role
 *             properties:
 *               Nama:
 *                 type: string
 *               Email:
 *                 type: string
 *               Role:
 *                 type: string
 *                 enum: [Admin, User]
 *     responses:
 *       200:
 *         description: User created successfully
 *       400:
 *         description: Invalid input or email already exists
 *       500:
 *         description: Database insertion error
 */
// Menangani request POST untuk membuat user baru
router.post('/:id', updateThrottler, async (req, res) => {
    const { Nama, Email, Role } = req.body;
    
    if (!Nama || !Email || !Role) {
        return res.status(400).json({ error: 'Nama, Email, dan Role wajib diisi' }); // Mengembalikan error jika data wajib tidak diisi
    }

    if (!['Admin', 'User'].includes(Role)) {
        return res.status(400).json({ error: 'Role harus Admin atau User' }); // Mengembalikan error jika Role tidak valid
    }

    db.query(
        'INSERT INTO User (Nama, Email, Role) VALUES (?, ?, ?)',
        [Nama, Email, Role],
        (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Email sudah terdaftar' }); // Mengembalikan error jika email sudah terdaftar
                }
                return res.status(500).json({ error: 'Database insertion error', details: err }); // Menangani error basis data
            }
            res.json({ message: 'User berhasil dibuat', userId: result.insertId }); // Mengembalikan pesan sukses
        }
    );
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Nama:
 *                 type: string
 *               Email:
 *                 type: string
 *               Role:
 *                 type: string
 *                 enum: [Admin, User]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input or email already exists
 *       404:
 *         description: User not found
 *       500:
 *         description: Database update error
 */
// Menangani request PUT untuk mengupdate user
router.put('/:id', (req, res) => {
    const { id } = req.params; // Mengambil ID dari parameter
    const { Nama, Email, Role } = req.body;

    if (Role && !['Admin', 'User'].includes(Role)) {
        return res.status(400).json({ error: 'Role harus Admin atau User' }); // Mengembalikan error jika Role tidak valid
    }

    db.query('SELECT * FROM User WHERE ID_User = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err }); // Menangani error basis data
        if (result.length === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan' }); // Mengembalikan error jika user tidak ditemukan
        }

        const oldData = result[0]; // Mengambil data lama

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
                        return res.status(400).json({ error: 'Email sudah terdaftar' }); // Mengembalikan error jika email sudah terdaftar
                    }
                    return res.status(500).json({ error: 'Database update error', details: err }); // Menangani error basis data
                }
                res.json({ message: 'User berhasil diupdate' }); // Mengembalikan pesan sukses
            }
        );
    });
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Database deletion error
 */
// Menangani request DELETE untuk menghapus user
router.delete('/:id', (req, res) => {
    const { id } = req.params; // Mengambil ID dari parameter
    
    db.query('DELETE FROM User WHERE ID_User = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database deletion error', details: err }); // Menangani error basis data
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan' }); // Mengembalikan error jika user tidak ditemukan
        }
        res.json({ message: 'User berhasil dihapus' }); // Mengembalikan pesan sukses
    });
});

module.exports = router;