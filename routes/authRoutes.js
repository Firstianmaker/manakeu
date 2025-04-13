const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connection = require('../config/database');
const passport = require('passport');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');

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
    
    if (!new RegExp(`[${VALIDATION_RULES.ALLOWED_SPECIAL_CHARS}]`).test(password)) {
        return 'Password harus mengandung minimal 1 karakter spesial (!@#$%^&*()_+-=[]{}|;:,.<>?)';
    }
    
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

// Google OAuth routes
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        accessType: 'offline',
        prompt: 'consent'
    })
);

router.get('/google/callback',
    passport.authenticate('google', { 
        failureRedirect: '/login',
        session: false,
        failureMessage: true
    }),
    (req, res) => {
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
        const logQuery = `
            INSERT INTO log_aktivitas (ID_User, Aksi) 
            VALUES (?, ?)
        `;
        connection.query(logQuery, [
            req.user.ID_User,
            'User login via Google'
        ]);

        res.redirect(`http://localhost:3000/auth-success?token=${token}`);
    }
);

module.exports = router;