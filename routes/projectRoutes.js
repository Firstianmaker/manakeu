const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       required:
 *         - Nama_Project
 *         - Status
 *       properties:
 *         ID_Project:
 *           type: integer
 *           description: The auto-generated id of the project
 *         Nama_Project:
 *           type: string
 *           description: The name of the project
 *         Deskripsi:
 *           type: string
 *           description: Project description
 *         Tanggal_Mulai:
 *           type: string
 *           format: date
 *           description: Project start date
 *         Tanggal_Selesai:
 *           type: string
 *           format: date
 *           description: Project end date
 *         Status:
 *           type: string
 *           description: Current status of the project
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Returns all projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 *       500:
 *         description: Database query error
 */
// Menangani request GET untuk mendapatkan semua project
router.get('/', (req, res) => {
    db.query('SELECT * FROM Project', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        res.json(results);
    });
});

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       404:
 *         description: Project not found
 *       500:
 *         description: Database query error
 */
// Menangani request GET untuk mendapatkan project berdasarkan ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM Project WHERE ID_Project = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: "Project tidak ditemukan" });
        }
        res.json(result[0]);
    });
});

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Nama_Project
 *               - Status
 *             properties:
 *               Nama_Project:
 *                 type: string
 *               Deskripsi:
 *                 type: string
 *               Tanggal_Mulai:
 *                 type: string
 *                 format: date
 *               Tanggal_Selesai:
 *                 type: string
 *                 format: date
 *               Status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Database insertion error
 */
// Menangani request POST untuk membuat project baru
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

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Nama_Project:
 *                 type: string
 *               Deskripsi:
 *                 type: string
 *               Tanggal_Mulai:
 *                 type: string
 *                 format: date
 *               Tanggal_Selesai:
 *                 type: string
 *                 format: date
 *               Status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       404:
 *         description: Project not found
 *       500:
 *         description: Database update error
 */
// Menangani request PUT untuk mengupdate project
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

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       404:
 *         description: Project not found
 *       500:
 *         description: Database deletion error
 */
// Menangani request DELETE untuk menghapus project
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
