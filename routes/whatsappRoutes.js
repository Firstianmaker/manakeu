const express = require('express');
const router = express.Router();
const { sendMessage } = require('../config/whatsapp');

// Rute untuk mengirim pesan WhatsApp
router.post('/send', async (req, res) => {
    try {
        const { number, message } = req.body;
        
        // Validasi input
        if (!number || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nomor dan pesan diperlukan' 
            });
        }
        
        // Kirim pesan WhatsApp
        const result = await sendMessage(number, message);
        
        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'Pesan WhatsApp berhasil dikirim',
                data: result.response
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Gagal mengirim pesan WhatsApp',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Error in WhatsApp send route:', error);
        res.status(500).json({
            success: false,
            message: 'Error internal server',
            error: error.message
        });
    }
});

// Rute untuk cek status koneksi WhatsApp
router.get('/status', (req, res) => {
    try {
        const { client } = require('../config/whatsapp');
        const isConnected = client.info ? true : false;
        
        res.status(200).json({
            success: true,
            connected: isConnected,
            info: isConnected ? client.info : null
        });
    } catch (error) {
        console.error('Error in WhatsApp status route:', error);
        res.status(500).json({
            success: false,
            message: 'Error internal server',
            error: error.message
        });
    }
});

module.exports = router; 