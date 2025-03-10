const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const projectRoutes = require('./routes/projectRoutes');
const transaksiRoutes = require('./routes/transaksiRoutes');
const userRoutes = require('./routes/userRoutes');
const notaRoutes = require('./routes/notaRoutes');
const approvalRoutes = require('./routes/approvalRoutes');
const logAktivitasRoutes = require('./routes/logAktivitasRoutes');

app.use('/api/projects', projectRoutes);
app.use('/api/transaksi', transaksiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/nota', notaRoutes);
app.use('/api/approval', approvalRoutes);
app.use('/api/logs', logAktivitasRoutes);

// Test route
app.get('/', (req, res) => {
    res.send('Server berjalan!');
});

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});