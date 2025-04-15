const db = require('../config/database');

const projectSummaryReport = async (req, res) => {
  try {
      const { project_id, start_date, end_date } = req.body;

      const query = `
          SELECT 
              p.ID_Project,
              p.Nama_Project,
              p.Status as Status_Project,
              COUNT(DISTINCT t.ID_Transaksi) as Total_Transaksi,
              SUM(CASE WHEN t.Jenis_Transaksi = 'Pemasukan' THEN t.Jumlah ELSE 0 END) as Total_Pemasukan,
              SUM(CASE WHEN t.Jenis_Transaksi = 'Pengeluaran' THEN t.Jumlah ELSE 0 END) as Total_Pengeluaran,
              COUNT(DISTINCT n.ID_Nota) as Total_Nota,
              SUM(CASE WHEN n.Status_Verifikasi = 'Approved' THEN 1 ELSE 0 END) as Nota_Approved,
              SUM(CASE WHEN n.Status_Verifikasi = 'Rejected' THEN 1 ELSE 0 END) as Nota_Rejected,
              SUM(CASE WHEN n.Status_Verifikasi = 'Pending' THEN 1 ELSE 0 END) as Nota_Pending
          FROM project p
          LEFT JOIN transaksi t ON p.ID_Project = t.ID_Project
          LEFT JOIN nota n ON t.ID_Transaksi = n.ID_Transaksi
          WHERE p.ID_Project = ?
          AND (t.Tanggal_Transaksi BETWEEN ? AND ? OR t.Tanggal_Transaksi IS NULL)
          GROUP BY p.ID_Project
      `;

      const [projectSummary] = await db.promise().query(query, [project_id, start_date, end_date]);

      // Get transaction details
      const [transactions] = await db.promise().query(
          `SELECT t.*, n.Status_Verifikasi as Status_Nota
           FROM transaksi t
           LEFT JOIN nota n ON t.ID_Transaksi = n.ID_Transaksi
           WHERE t.ID_Project = ?
           AND t.Tanggal_Transaksi BETWEEN ? AND ?
           ORDER BY t.Tanggal_Transaksi DESC`,
          [project_id, start_date, end_date]
      );

      return res.status(200).json({
          status: 'success',
          data: {
              summary: projectSummary[0],
              period: {
                  start: start_date,
                  end: end_date
              },
              transactions: transactions
          }
      });

  } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ status: 'error', message: error.message });
  }
};

// controllers/complexController.js

const userActivityReport = async (req, res) => {
  try {
      const { user_id, start_date, end_date } = req.body;

      // Validasi input
      if (!user_id || !start_date || !end_date) {
          return res.status(400).json({
              status: 'error',
              message: 'User ID, tanggal awal, dan tanggal akhir diperlukan'
          });
      }

      // Definisikan semua query di dalam function
      const transactionQuery = `
          SELECT 
              COUNT(*) as total_transaksi,
              SUM(CASE WHEN t.Jenis_Transaksi = 'Pemasukan' THEN 1 ELSE 0 END) as total_pemasukan,
              SUM(CASE WHEN t.Jenis_Transaksi = 'Pengeluaran' THEN 1 ELSE 0 END) as total_pengeluaran,
              COUNT(DISTINCT t.ID_Project) as total_project,
              COALESCE(SUM(t.Jumlah), 0) as total_nilai_transaksi,
              COUNT(n.ID_Nota) as total_nota_diupload
          FROM transaksi t
          LEFT JOIN nota n ON t.ID_Transaksi = n.ID_Transaksi
          WHERE t.ID_User = ?
          AND t.Tanggal_Transaksi BETWEEN ? AND ?
      `;

      const notaQuery = `
          SELECT 
              COUNT(*) as total_nota,
              SUM(CASE WHEN n.Status_Verifikasi = 'Approved' THEN 1 ELSE 0 END) as nota_approved,
              SUM(CASE WHEN n.Status_Verifikasi = 'Rejected' THEN 1 ELSE 0 END) as nota_rejected,
              SUM(CASE WHEN n.Status_Verifikasi = 'Pending' THEN 1 ELSE 0 END) as nota_pending
          FROM nota n
          JOIN transaksi t ON n.ID_Transaksi = t.ID_Transaksi
          WHERE t.ID_User = ?
          AND n.Tanggal_Unggah BETWEEN ? AND ?
      `;

      const logQuery = `
          SELECT 
              DATE_FORMAT(Tanggal_Aksi, '%Y-%m-%d') as tanggal,
              COUNT(*) as jumlah_aktivitas,
              GROUP_CONCAT(Aksi SEPARATOR '|') as detail_aktivitas
          FROM log_aktivitas
          WHERE ID_User = ?
          AND Tanggal_Aksi BETWEEN ? AND ?
          GROUP BY DATE_FORMAT(Tanggal_Aksi, '%Y-%m-%d')
          ORDER BY tanggal DESC
      `;

      // Eksekusi semua query
      const [[transactionSummary], [notaSummary], logs] = await Promise.all([
          db.promise().query(transactionQuery, [user_id, start_date, end_date]),
          db.promise().query(notaQuery, [user_id, start_date, end_date]),
          db.promise().query(logQuery, [user_id, start_date, end_date])
      ]);

      // Format logs dengan pengecekan null
      const formattedLogs = logs.map(log => ({
          tanggal: log.tanggal,
          jumlah_aktivitas: log.jumlah_aktivitas,
          detail_aktivitas: log.detail_aktivitas ? log.detail_aktivitas.split('|') : []
      }));

      return res.status(200).json({
          status: 'success',
          data: {
              periode: {
                  start: start_date,
                  end: end_date
              },
              ringkasan_transaksi: {
                  ...transactionSummary,
                  rata_rata_nilai: transactionSummary.total_transaksi > 0 ? 
                      (transactionSummary.total_nilai_transaksi / transactionSummary.total_transaksi).toFixed(2) : 0
              },
              ringkasan_nota: notaSummary,
              aktivitas_harian: formattedLogs
          }
      });

  } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ status: 'error', message: error.message });
  }
};
module.exports = {
  projectSummaryReport,
  userActivityReport
};