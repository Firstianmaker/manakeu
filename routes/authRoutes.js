const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connection = require('../config/database');
const passport = require('passport');

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
router.post('/register', async (req, res) => {
  try {
      const { Nama, Email, Password, Role } = req.body;

      // Validasi input
      if (!Nama || !Email || !Password || !Role) {
          return res.status(400).json({ error: 'Semua field harus diisi' });
      }

      // Validasi panjang password minimal 6 karakter
      if (Password.length < 6) {
          return res.status(400).json({ error: 'Password harus minimal 6 karakter' });
      }

      // Validasi format email
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(Email)) {
          return res.status(400).json({ 
              error: 'Format email tidak valid. Email tidak boleh mengandung spasi dan harus menggunakan format yang benar' 
          });
      }

      // Convert email ke lowercase
      const normalizedEmail = Email.toLowerCase();

      // Validasi nama (hanya huruf, angka, dan spasi)
      const namaRegex = /^[a-zA-Z0-9 ]+$/;
      if (!namaRegex.test(Nama)) {
          return res.status(400).json({ 
              error: 'Nama hanya boleh mengandung huruf, angka, dan spasi' 
          });
      }

      // Validasi role
      if (!['Admin', 'User'].includes(Role)) {
          return res.status(400).json({ error: 'Role harus Admin atau User' });
      }

      // Cek apakah email sudah ada
      const checkUser = 'SELECT * FROM user WHERE Email = ?';
      connection.query(checkUser, [normalizedEmail], async (error, results) => {
          if (error) {
              console.error('Database error:', error);
              return res.status(500).json({ error: 'Database error' });
          }
          
          if (results.length > 0) {
              return res.status(400).json({ error: 'Email sudah terdaftar' });
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
                  return res.status(500).json({ error: 'Gagal mendaftarkan user' });
              }

              // Tambahkan log aktivitas
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
      res.status(500).json({ error: 'Server error' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { Email, Password } = req.body;

        // Validasi input
        if (!Email || !Password) {
            return res.status(400).json({ error: 'Email dan password harus diisi' });
        }

        // Cek user di database
        const query = 'SELECT * FROM user WHERE Email = ?';
        connection.query(query, [Email], async (error, results) => {
            if (error) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (results.length === 0) {
                return res.status(401).json({ error: 'Email atau password salah' });
            }

            const user = results[0];

            // Verifikasi password
            const validPassword = await bcrypt.compare(Password, user.Password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Email atau password salah' });
            }

            // Buat JWT token
            const token = jwt.sign(
                { 
                    ID_User: user.ID_User, 
                    Email: user.Email, 
                    Role: user.Role 
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Tambahkan log aktivitas
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
        res.status(500).json({ error: 'Server error' });
    }
});

// Get profile endpoint
router.get('/me', authMiddleware, (req, res) => {
    const query = 'SELECT ID_User, Nama, Email, Role, Tanggal_Buat FROM user WHERE ID_User = ?';
    
    connection.query(query, [req.user.ID_User], (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'User tidak ditemukan' });
        }

        res.json({
            user: results[0]
        });
    });
});

// Route OAuth Google
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
      // Buat JWT token
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

      // Redirect ke frontend dengan token
      res.redirect(`http://localhost:3000/auth-success?token=${token}`);
  }
);

module.exports = router;