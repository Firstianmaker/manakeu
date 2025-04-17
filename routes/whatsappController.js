const { sendMessage, client } = require('../config/whatsapp');

// Controller untuk mengirim pesan WhatsApp
exports.sendWhatsAppMessage = async (req, res) => {
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
        console.error('Error in sendWhatsAppMessage controller:', error);
        res.status(500).json({
            success: false,
            message: 'Error internal server',
            error: error.message
        });
    }
};

// Controller untuk mendapatkan status koneksi WhatsApp
exports.getWhatsAppStatus = (req, res) => {
    try {
        const isConnected = client.info ? true : false;
        
        res.status(200).json({
            success: true,
            connected: isConnected,
            info: isConnected ? client.info : null
        });
    } catch (error) {
        console.error('Error in getWhatsAppStatus controller:', error);
        res.status(500).json({
            success: false,
            message: 'Error internal server',
            error: error.message
        });
    }
};

// Fungsi utilitas untuk customer service
exports.sendCustomerServiceMessage = async (customerName, customerPhone, message) => {
    try {
        // Nomor WhatsApp CS (ganti dengan nomor CS yang diinginkan)
        const csNumber = process.env.CS_WHATSAPP_NUMBER || '6281234567890';
        
        // Format pesan untuk CS
        const csMessage = `*PESAN DARI CUSTOMER*\n\nNama: ${customerName}\nTelepon: ${customerPhone}\n\nPesan:\n${message}`;
        
        // Kirim pesan ke CS
        return await sendMessage(csNumber, csMessage);
    } catch (error) {
        console.error('Error sending CS message:', error);
        return { success: false, error: error.message };
    }
}; 