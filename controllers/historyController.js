const db = require('../config/database');

const getRecentHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const { days = 7, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        // Query untuk mengambil aktivitas
        const query = `
            SELECT 
                DATE_FORMAT(t.Tanggal_Transaksi, '%Y-%m-%d %H:%i:%s') as tanggal_aktivitas,
                t.ID_Transaksi,
                t.Jenis_Transaksi,
                t.Jumlah,
                t.Keterangan as keterangan_transaksi,
                p.ID_Project,
                p.Nama_Project,
                u.Nama as nama_user,
                l.ID_Log,
                l.Aksi as keterangan_log
            FROM transaksi t
            JOIN user u ON t.ID_User = u.ID_User
            LEFT JOIN project p ON t.ID_Project = p.ID_Project
            LEFT JOIN log_aktivitas l ON 
                DATE(l.Tanggal_Aksi) = DATE(t.Tanggal_Transaksi) 
                AND l.ID_User = t.ID_User
                AND l.Aksi LIKE CONCAT('%', t.Jenis_Transaksi, '%', FORMAT(t.Jumlah, 0), '%')
            WHERE t.ID_User = ?
            ORDER BY tanggal_aktivitas DESC
            LIMIT ? OFFSET ?
        `;

        const [results] = await db.promise().query(query, [
            userId,
            parseInt(limit), 
            parseInt(offset)
        ]);

        // Format jumlah uang
        const formatCurrency = (amount) => {
            if (!amount) return null;
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount);
        };

        const activities = results.map(row => ({
            tanggal: row.tanggal_aktivitas,
            user: {
                nama: row.nama_user
            },
            aktivitas: {
            id_transaksi: row.ID_Transaksi,
            jenis: row.Jenis_Transaksi,
            jumlah: formatCurrency(row.Jumlah),
            keterangan: row.keterangan_transaksi,
            project: {
                id: row.ID_Project,
                nama_project: row.Nama_Project
            }
        }
    }));

        // Tambahkan log yang tidak terkait dengan transaksi
        const additionalLogsQuery = `
            SELECT 
                DATE_FORMAT(l.Tanggal_Aksi, '%Y-%m-%d %H:%i:%s') as tanggal_aktivitas,
                l.ID_Log,
                l.Aksi as keterangan,
                u.Nama as nama_user
            FROM log_aktivitas l
            JOIN user u ON l.ID_User = u.ID_User
            WHERE l.ID_User = ?
            AND NOT EXISTS (
                SELECT 1 FROM transaksi t 
                WHERE DATE(l.Tanggal_Aksi) = DATE(t.Tanggal_Transaksi)
                AND l.Aksi LIKE CONCAT('%', t.Jenis_Transaksi, '%', FORMAT(t.Jumlah, 0), '%')
            )
            ORDER BY l.Tanggal_Aksi DESC
        `;

        const [additionalLogs] = await db.promise().query(additionalLogsQuery, [userId]);

        // Gabungkan dengan log tambahan
        const additionalActivities = additionalLogs.map(log => ({
            tanggal: log.tanggal_aktivitas,
            user: {
                nama_user: log.nama_user
            },
            aktivitas: {
                id_log: log.ID_Log,
                keterangan: log.keterangan
            }
        }));

        // Gabungkan dan urutkan berdasarkan tanggal
        const allActivities = [...activities, ...additionalActivities]
            .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

        return res.status(200).json({
            status: 'success',
            data: {
                total_aktivitas: allActivities.length,
                page: parseInt(page),
                limit: parseInt(limit),
                period: `${days} hari terakhir`,
                activities: allActivities
            }
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ 
            status: 'error', 
            message: error.message 
        });
    }
};

const getTransactionHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const query = `
            SELECT 
                t.ID_Transaksi,
                t.Jumlah,
                t.Jenis_Transaksi,
                t.Tanggal_Transaksi,
                t.Keterangan,
                p.ID_Project,
                p.Nama_Project,
                n.ID_Nota,
                n.Status_Verifikasi as Status_Nota,
                a.Status_Approval
            FROM transaksi t
            JOIN user u ON t.ID_User = u.ID_User
            LEFT JOIN project p ON t.ID_Project = p.ID_Project
            LEFT JOIN nota n ON t.ID_Transaksi = n.ID_Transaksi
            LEFT JOIN approval a ON n.ID_Nota = a.ID_Nota
            WHERE t.ID_User = ?
            ORDER BY t.Tanggal_Transaksi DESC
            LIMIT ? OFFSET ?
        `;

        const [results] = await db.promise().query(query, [userId, parseInt(limit), parseInt(offset)]);

        return res.status(200).json({
            status: 'success',
            data: {
                total_transaksi: results.length,
                page: parseInt(page),
                limit: parseInt(limit),
                transaksi: results.map(row => ({
                id_transaksi: row.ID_Transaksi,
                jumlah: Number(row.Jumlah),
                jenis: row.Jenis_Transaksi,
                tanggal: row.Tanggal_Transaksi,
                keterangan: row.Keterangan,
                project: {
                    id: row.ID_Project,
                    nama_projek: row.Nama_Project
                    },
                nota: {
                    id: row.ID_Nota,
                    status_nota: row.Status_Nota
                    },
                approval: row.Status_Approval
                }))
            }
        });

        // Error
        } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ status: 'error', message: error.message });
        }
    };

    module.exports = {
    getTransactionHistory,
    getRecentHistory
};