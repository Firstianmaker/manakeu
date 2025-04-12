// Mengimport Express.js dan CORS untuk mengaktifkan CORS
const express = require('express');
const cors = require('cors');
const passport = require('./config/passport');
const session = require('express-session');
// Mengkonfigurasi variabel lingkungan
require('dotenv').config();

// Membuat aplikasi Express
const app = express();

// Menggunakan middleware CORS dan JSON
app.use(cors());
app.use(express.json());

app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


// Mengimport rute-rute yang diperlukan
const projectRoutes = require('./routes/projectRoutes');
const transaksiRoutes = require('./routes/transaksiRoutes');
const userRoutes = require('./routes/userRoutes');
const notaRoutes = require('./routes/notaRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const logAktivitasRoutes = require('./routes/logAktivitasRoutes');
const authRoutes = require('./routes/authRoutes');

// Menggunakan rute-rute yang diimport
app.use('/api/projects', projectRoutes);
app.use('/api/transaksi', transaksiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/nota', notaRoutes);
app.use('/api/approval', approvalRoutes);
app.use('/api/logs', logAktivitasRoutes);
app.use('/api/auth', authRoutes);

// Rute test untuk memastikan server berjalan
app.get('/', (req, res) => {
    res.send('Server berjalan!');
});

// Mengatur port untuk server dan memulai server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});