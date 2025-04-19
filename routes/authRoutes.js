const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connection = require('../config/database');
const passport = require('passport');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');
const Encryption = require('../utils/encryption');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - Nama
 *         - Email
 *         - Password
 *         - Role
 *       properties:
 *         ID_User:
 *           type: integer
 *           description: The auto-generated id of the user
 *         Nama:
 *           type: string
 *           description: User's full name (minimum 2 words)
 *         Email:
 *           type: string
 *           description: User's email address from allowed domains
 *         Password:
 *           type: string
 *           description: User's password (8-50 characters, must include uppercase, lowercase, and number)
 *         Role:
 *           type: string
 *           enum: [Admin, User]
 *           description: User's role in the system
 *         API_Key:
 *           type: string
 *           description: User's API key for authentication
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Konstanta untuk validasi
const VALIDATION_RULES = {
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 50,
    NAMA_MIN_LENGTH: 3,
    NAMA_MAX_LENGTH: 50,
    ALLOWED_SPECIAL_CHARS: "!@#$%^&*()_+-=[]{}|;:,.<>?"
};

// Konstanta untuk pesan error
const ERROR_MESSAGES = {
    INVALID_EMAIL: 'Format email tidak valid',
    INVALID_DOMAIN: (domains) => `Domain email tidak diizinkan. Gunakan email dari: ${domains.join(', ')}`,
    INVALID_PASSWORD: 'Password tidak memenuhi kriteria keamanan',
    DUPLICATE_EMAIL: 'Email sudah terdaftar',
    DUPLICATE_NAME: 'Nama sudah terdaftar',
    SERVER_ERROR: 'Terjadi kesalahan pada server',
    AUTH_FAILED: 'Email atau password salah',
    EMPTY_FIELDS: 'Semua field harus diisi',
    INVALID_ROLE: 'Role harus Admin atau User'
};

// Domain email yang diizinkan
const allowedEmailDomains = [
    'gmail.com',
    'yahoo.com',
    'yahoo.co.id',
    'hotmail.com',
    'outlook.com',
    'live.com',
    'icloud.com'
];

// Fungsi helper untuk validasi password
const validatePassword = (password) => {
    if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH || 
        password.length > VALIDATION_RULES.PASSWORD_MAX_LENGTH) {
        return 'Password harus antara 8-50 karakter';
    }
    
    if (!/[A-Z]/.test(password)) {
        return 'Password harus mengandung minimal 1 huruf besar';
    }
    
    if (!/[a-z]/.test(password)) {
        return 'Password harus mengandung minimal 1 huruf kecil';
    }
    
    if (!/\d/.test(password)) {
        return 'Password harus mengandung minimal 1 angka';
    }
    
    // if (!new RegExp(`[${VALIDATION_RULES.ALLOWED_SPECIAL_CHARS}]`).test(password)) {
    //     return 'Password harus mengandung minimal 1 karakter spesial (!@#$%^&*()_+-=[]{}|;:,.<>?)';
    // }
    
    return null;
};

// Fungsi helper untuk validasi nama
const validateNama = (nama) => {
    if (nama.length < VALIDATION_RULES.NAMA_MIN_LENGTH || 
        nama.length > VALIDATION_RULES.NAMA_MAX_LENGTH) {
        return 'Nama harus antara 3-50 karakter';
    }
    
    if (!/^[a-zA-Z0-9\s.]+$/.test(nama)) {
        return 'Nama hanya boleh mengandung huruf, angka, spasi, dan tanda titik';
    }
    
    if (/\s\s/.test(nama)) {
        return 'Nama tidak boleh mengandung spasi berurutan';
    }
    
    if (nama.startsWith(' ') || nama.endsWith(' ')) {
        return 'Nama tidak boleh diawali atau diakhiri dengan spasi';
    }

    if (nama.trim().split(/\s+/).length < 2) {
        return 'Nama harus terdiri dari minimal 2 kata';
    }

    if (/^\d|\s\d/.test(nama)) {
        return 'Nama tidak boleh diawali dengan angka';
    }
    
    return null;
};

// Middleware untuk verifikasi token
const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token tidak valid' });
    }
};

// Saat generate API key
const generateApiKey = async (userId) => {
    const apiKey = crypto.randomBytes(32).toString('hex');
    const encryptedKey = Encryption.encryptApiKey(apiKey);
    
    await db.promise().query(
        'UPDATE user SET API_Key = ? WHERE ID_User = ?',
        [encryptedKey, userId]
    );
    
    return apiKey; // Return plain API key ke user
};

// Saat verifikasi API key
const verifyApiKey = async (apiKey) => {
    const [user] = await db.promise().query(
        'SELECT ID_User, API_Key FROM user WHERE ID_User = ?',
        [userId]
    );
    
    if (!user.length) return false;
    
    const decryptedKey = Encryption.decryptApiKey(user[0].API_Key);
    return apiKey === decryptedKey;
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Nama
 *               - Email
 *               - Password
 *               - Role
 *             properties:
 *               Nama:
 *                 type: string
 *                 description: User's full name (minimum 2 words)
 *               Email:
 *                 type: string
 *                 description: User's email from allowed domains
 *               Password:
 *                 type: string
 *                 description: Password (8-50 chars, must include uppercase, lowercase, and number)
 *               Role:
 *                 type: string
 *                 enum: [Admin, User]
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Server error
 */
// Register endpoint
router.post('/register', registerLimiter, async (req, res) => {
    try {
        const { Nama, Email, Password, Role } = req.body;

        // Validasi input kosong
        if (!Nama || !Email || !Password || !Role) {
            return res.status(400).json({ error: ERROR_MESSAGES.EMPTY_FIELDS });
        }

        // Validasi nama
        const namaError = validateNama(Nama);
        if (namaError) {
            return res.status(400).json({ error: namaError });
        }

        // Validasi password
        const passwordError = validatePassword(Password);
        if (passwordError) {
            return res.status(400).json({ error: passwordError });
        }

        // Validasi email
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(Email)) {
            return res.status(400).json({ error: ERROR_MESSAGES.INVALID_EMAIL });
        }

        // Normalize email
        const normalizedEmail = Email.toLowerCase();

        // Validasi domain email
        const emailDomain = normalizedEmail.split('@')[1];
        if (!allowedEmailDomains.includes(emailDomain)) {
            return res.status(400).json({ 
                error: ERROR_MESSAGES.INVALID_DOMAIN(allowedEmailDomains)
            });
        }

        // Validasi role
        if (!['Admin', 'User'].includes(Role)) {
            return res.status(400).json({ error: ERROR_MESSAGES.INVALID_ROLE });
        }

        // Cek duplikasi email dan nama
        const checkUser = 'SELECT * FROM user WHERE Email = ? OR Nama = ?';
        connection.query(checkUser, [normalizedEmail, Nama], async (error, results) => {
            if (error) {
                console.error('Database error:', error);
                return res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
            }
            
            if (results.length > 0) {
                if (results.some(result => result.Email === normalizedEmail)) {
                    return res.status(400).json({ error: ERROR_MESSAGES.DUPLICATE_EMAIL });
                }
                if (results.some(result => result.Nama === Nama)) {
                    return res.status(400).json({ error: ERROR_MESSAGES.DUPLICATE_NAME });
                }
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(Password, salt);

            // Insert user baru
            const insertUser = `
                INSERT INTO user (Nama, Email, Password, Role) 
                VALUES (?, ?, ?, ?)
            `;
            
            connection.query(insertUser, [Nama, normalizedEmail, hashedPassword, Role], (error, results) => {
                if (error) {
                    console.error('Error saat registrasi:', error);
                    return res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
                }

                // Log aktivitas
                const logQuery = `
                    INSERT INTO log_aktivitas (ID_User, Aksi) 
                    VALUES (?, ?)
                `;
                connection.query(logQuery, [
                    results.insertId, 
                    `User baru terdaftar dengan email ${normalizedEmail}`
                ]);

                res.status(201).json({ 
                    message: 'User berhasil didaftarkan',
                    user: {
                        ID_User: results.insertId,
                        Nama,
                        Email: normalizedEmail,
                        Role
                    }
                });
            });
        });
    } catch (error) {
        console.error('Server error:', error);
        let errorMessage = ERROR_MESSAGES.SERVER_ERROR;
        if (error.code === 'ER_DUP_ENTRY') {
            errorMessage = 'Data sudah ada dalam database';
        }
        res.status(500).json({ error: errorMessage });
    }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to the system
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Email
 *               - Password
 *             properties:
 *               Email:
 *                 type: string
 *               Password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid credentials
 *       401:
 *         description: Authentication failed
 *       500:
 *         description: Server error
 */
// Login endpoint
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { Email, Password } = req.body;

        // Validasi input kosong
        if (!Email || !Password) {
            return res.status(400).json({ error: ERROR_MESSAGES.EMPTY_FIELDS });
        }

        // Validasi format email
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(Email)) {
            return res.status(400).json({ error: ERROR_MESSAGES.INVALID_EMAIL });
        }

        // Normalize email
        const normalizedEmail = Email.toLowerCase();

        // Validasi domain email
        const emailDomain = normalizedEmail.split('@')[1];
        if (!allowedEmailDomains.includes(emailDomain)) {
            return res.status(400).json({ 
                error: ERROR_MESSAGES.INVALID_DOMAIN(allowedEmailDomains)
            });
        }

        // Cek user di database
        const query = 'SELECT * FROM user WHERE Email = ?';
        connection.query(query, [normalizedEmail], async (error, results) => {
            if (error) {
                return res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
            }

            if (results.length === 0) {
                return res.status(401).json({ error: ERROR_MESSAGES.AUTH_FAILED });
            }

            const user = results[0];

            // Verifikasi password
            const validPassword = await bcrypt.compare(Password, user.Password);
            if (!validPassword) {
                return res.status(401).json({ error: ERROR_MESSAGES.AUTH_FAILED });
            }

            // Generate JWT token
            const token = jwt.sign(
                { 
                    ID_User: user.ID_User, 
                    Email: user.Email, 
                    Role: user.Role 
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Log aktivitas
            const logQuery = `
                INSERT INTO log_aktivitas (ID_User, Aksi) 
                VALUES (?, ?)
            `;
            connection.query(logQuery, [
                user.ID_User, 
                'User melakukan login'
            ]);

            res.json({
                message: 'Login berhasil',
                token,
                user: {
                    ID_User: user.ID_User,
                    Nama: user.Nama,
                    Email: user.Email,
                    Role: user.Role
                }
            });
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
    }
});

// Update profile endpoint
router.put('/update-profile', authMiddleware, async (req, res) => {
    try {
        const { Nama, Password, currentPassword } = req.body;
        const userId = req.user.ID_User;

        // Validasi input
        if (!Nama && !Password) {
            return res.status(400).json({ 
                error: 'Minimal satu field (Nama atau Password) harus diisi untuk update' 
            });
        }

        // Cek user di database
        const checkUser = 'SELECT * FROM user WHERE ID_User = ?';
        connection.query(checkUser, [userId], async (error, results) => {
            if (error) {
                console.error('Database error:', error);
                return res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'User tidak ditemukan' });
            }

            const user = results[0];

            // Jika update password, validasi password lama
            if (Password) {
                if (!currentPassword) {
                    return res.status(400).json({ 
                        error: 'Password saat ini diperlukan untuk mengubah password' 
                    });
                }

                const validPassword = await bcrypt.compare(currentPassword, user.Password);
                if (!validPassword) {
                    return res.status(401).json({ 
                        error: 'Password saat ini tidak sesuai' 
                    });
                }

                // Validasi password baru
                const passwordError = validatePassword(Password);
                if (passwordError) {
                    return res.status(400).json({ error: passwordError });
                }
            }

            // Jika update nama, validasi nama
            if (Nama) {
                const namaError = validateNama(Nama);
                if (namaError) {
                    return res.status(400).json({ error: namaError });
                }

                // Cek duplikasi nama
                const checkNama = 'SELECT ID_User FROM user WHERE Nama = ? AND ID_User != ?';
                const [namaResults] = await connection.promise().query(checkNama, [Nama, userId]);
                if (namaResults.length > 0) {
                    return res.status(400).json({ error: ERROR_MESSAGES.DUPLICATE_NAME });
                }
            }

            // Mulai proses update
            let updateFields = [];
            let updateValues = [];
            let updateLog = [];

            if (Nama) {
                updateFields.push('Nama = ?');
                updateValues.push(Nama);
                updateLog.push(`Nama diubah menjadi ${Nama}`);
            }

            if (Password) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(Password, salt);
                updateFields.push('Password = ?');
                updateValues.push(hashedPassword);
                updateLog.push('Password diubah');
            }

            // Tambahkan userId untuk WHERE clause
            updateValues.push(userId);

            const updateQuery = `
                UPDATE user 
                SET ${updateFields.join(', ')}
                WHERE ID_User = ?
            `;

            connection.query(updateQuery, updateValues, (updateError) => {
                if (updateError) {
                    console.error('Update error:', updateError);
                    return res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
                }

                // Log aktivitas
                const logQuery = `
                    INSERT INTO log_aktivitas (ID_User, Aksi) 
                    VALUES (?, ?)
                `;
                connection.query(logQuery, [
                    userId, 
                    `User mengupdate profile: ${updateLog.join(', ')}`
                ]);

                // Ambil data user terbaru
                connection.query(
                    'SELECT ID_User, Nama, Email, Role, Tanggal_Buat FROM user WHERE ID_User = ?',
                    [userId],
                    (selectError, selectResults) => {
                        if (selectError) {
                            return res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
                        }

                        res.json({
                            message: 'Profile berhasil diupdate',
                            user: selectResults[0]
                        });
                    }
                );
            });
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
    }
});

// Get profile endpoint
router.get('/me', authMiddleware, (req, res) => {
    const query = 'SELECT ID_User, Nama, Email, Role, Tanggal_Buat FROM user WHERE ID_User = ?';
    
    connection.query(query, [req.user.ID_User], (error, results) => {
        if (error) {
            return res.status(500).json({ error: ERROR_MESSAGES.SERVER_ERROR });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }

        res.json({
            user: results[0]
        });
    });
});

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth2 login
 *     tags: [Authentication]
 *     responses:
 *       302:
 *         description: Redirects to Google login page
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth2 callback URL
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       401:
 *         description: Authentication failed
 */
router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
    try {
        const token = jwt.sign(
            { 
                ID_User: req.user.ID_User,
                Email: req.user.Email,
                Role: req.user.Role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Log aktivitas
        connection.query(
            `INSERT INTO log_aktivitas (ID_User, Aksi) 
             VALUES (?, ?)`,
            [req.user.ID_User, 'Login via Google']
        );

        res.json({
            status: 'success',
            message: 'Google login berhasil',
            token,
            user: {
                ID_User: req.user.ID_User,
                Email: req.user.Email,
                Role: req.user.Role
            }
        });
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Gagal login dengan Google'
        });
    }
});

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verify JWT token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid or expired token
 */
router.get('/verify', authMiddleware, (req, res) => {
    res.json({ user: req.user });
});

/**
 * @swagger
 * /api/auth/api-key:
 *   post:
 *     summary: Generate new API key
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: New API key generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apiKey:
 *                   type: string
 *                   description: The new API key
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/api-key', authMiddleware, async (req, res) => {
    try {
        const apiKey = await generateApiKey(req.user.id);
        res.json({ apiKey });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate API key' });
    }
});
// Google OAuth routes
// Google OAuth routes
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'consent',   // Tambah ini agar selalu muncul pilih akun
        accessType: 'offline'
    })
);

// Route callback tetap sama
router.get('/google/callback',
    passport.authenticate('google', { 
        failureRedirect: '/login',
        failureMessage: true
    }),
    (req, res) => {
        try {
            const token = jwt.sign(
                { 
                    ID_User: req.user.ID_User,
                    Email: req.user.Email,
                    Role: req.user.Role 
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Log aktivitas
            connection.query(
                `INSERT INTO log_aktivitas (ID_User, Aksi) 
                 VALUES (?, ?)`,
                [req.user.ID_User, 'Login via Google']
            );

            res.json({
                status: 'success',
                message: 'Google login berhasil',
                token,
                user: {
                    ID_User: req.user.ID_User,
                    Email: req.user.Email,
                    Role: req.user.Role
                }
            });
        } catch (error) {
            console.error('OAuth callback error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Gagal login dengan Google'
            });
        }
    }
);

module.exports = router;