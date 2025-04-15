const db = require('../config/database');

const createBatchTransactions = async (req, res) => {
  try {
      const { project_id, transactions } = req.body;
      
      // Validasi input
      if (!project_id || !transactions || !Array.isArray(transactions)) {
          return res.status(400).json({
              status: 'error',
              message: 'Invalid input. Project ID dan array transaksi diperlukan'
          });
      }

      // Mulai database transaction
      await db.promise().query('START TRANSACTION');

      const createdTransactions = [];
      
      // Proses setiap transaksi
      for (const trans of transactions) {
          const { jenis_transaksi, jumlah, keterangan, tanggal, nota_file } = trans;
          
          // 1. Buat transaksi
          const [transResult] = await db.promise().query(
              `INSERT INTO transaksi (ID_Project, ID_User, Jenis_Transaksi, Jumlah, Tanggal_Transaksi, Keterangan) 
               VALUES (?, ?, ?, ?, ?, ?)`,
              [project_id, req.user.ID_User, jenis_transaksi, jumlah, tanggal || new Date(), keterangan]
          );

          // 2. Jika ada nota, buat record nota
          if (nota_file) {
              await db.promise().query(
                  `INSERT INTO nota (ID_Transaksi, File_Nota, Status_Verifikasi, Tanggal_Unggah) 
                   VALUES (?, ?, 'Pending', NOW())`,
                  [transResult.insertId, nota_file]
              );
          }

          // 3. Buat log aktivitas
          await db.promise().query(
              `INSERT INTO log_aktivitas (ID_User, Aksi, Tanggal_Aksi) 
               VALUES (?, ?, NOW())`,
              [req.user.ID_User, `Membuat transaksi ${jenis_transaksi} sebesar ${jumlah} untuk project ID ${project_id}`]
          );

          createdTransactions.push({
              id: transResult.insertId,
              ...trans
          });
      }

      await db.promise().query('COMMIT');

      return res.status(201).json({
          status: 'success',
          message: `Berhasil membuat ${createdTransactions.length} transaksi`,
          data: createdTransactions
      });

  } catch (error) {
      await db.promise().query('ROLLBACK');
      console.error('Error in batch transactions:', error);
      return res.status(500).json({
          status: 'error',
          message: error.message
      });
  }
};

const projectTransactionAnalysis = async (req, res) => {
  try {
      const { project_id, period } = req.body; // period: 'daily', 'weekly', 'monthly'

      const query = `
          SELECT 
              DATE_FORMAT(t.Tanggal_Transaksi, 
                  CASE 
                      WHEN ? = 'daily' THEN '%Y-%m-%d'
                      WHEN ? = 'weekly' THEN '%Y-%u'
                      ELSE '%Y-%m'
                  END
              ) as periode,
              COUNT(*) as total_transaksi,
              COALESCE(SUM(CASE WHEN t.Jenis_Transaksi = 'Pemasukan' THEN t.Jumlah ELSE 0 END), 0) as total_pemasukan,
              COALESCE(SUM(CASE WHEN t.Jenis_Transaksi = 'Pengeluaran' THEN t.Jumlah ELSE 0 END), 0) as total_pengeluaran,
              COUNT(n.ID_Nota) as total_nota,
              COUNT(CASE WHEN n.Status_Verifikasi = 'Approved' THEN 1 END) as nota_approved,
              COALESCE(AVG(t.Jumlah), 0) as rata_rata_transaksi,
              COALESCE(MIN(t.Jumlah), 0) as transaksi_terkecil,
              COALESCE(MAX(t.Jumlah), 0) as transaksi_terbesar
          FROM transaksi t
          LEFT JOIN nota n ON t.ID_Transaksi = n.ID_Transaksi
          WHERE t.ID_Project = ?
          GROUP BY periode
          ORDER BY periode DESC
      `;

      const [results] = await db.promise().query(query, [period, period, project_id]);

      // Format angka agar tidak terlalu panjang
      const formatNumber = (num) => {
          return parseFloat(num).toFixed(2);
      };

      // Hitung trend dan anomali
      const analysis = results.map((row, index, arr) => {
          const prevRow = arr[index + 1];
          return {
              periode: row.periode,
              total_transaksi: Number(row.total_transaksi),
              total_pemasukan: formatNumber(row.total_pemasukan),
              total_pengeluaran: formatNumber(row.total_pengeluaran),
              total_nota: Number(row.total_nota),
              nota_approved: Number(row.nota_approved),
              rata_rata_transaksi: formatNumber(row.rata_rata_transaksi),
              transaksi_terkecil: formatNumber(row.transaksi_terkecil),
              transaksi_terbesar: formatNumber(row.transaksi_terbesar),
              trend_pemasukan: prevRow && prevRow.total_pemasukan > 0 ? 
                  formatNumber((row.total_pemasukan - prevRow.total_pemasukan) / prevRow.total_pemasukan * 100) + '%' : 
                  'N/A',
              trend_pengeluaran: prevRow && prevRow.total_pengeluaran > 0 ? 
                  formatNumber((row.total_pengeluaran - prevRow.total_pengeluaran) / prevRow.total_pengeluaran * 100) + '%' : 
                  'N/A',
              anomali: row.total_pengeluaran > (row.total_pemasukan * 1.5) ? 'Pengeluaran tinggi' : null
          };
      });

      // Format summary dengan lebih baik
      const summary = {
          total_periods: results.length,
          total_pemasukan: formatNumber(results.reduce((sum, row) => sum + Number(row.total_pemasukan), 0)),
          total_pengeluaran: formatNumber(results.reduce((sum, row) => sum + Number(row.total_pengeluaran), 0)),
          rata_rata_transaksi_per_period: formatNumber(results.reduce((sum, row) => sum + row.total_transaksi, 0) / (results.length || 1))
      };

      return res.status(200).json({
          status: 'success',
          data: {
              project_id,
              period,
              analysis,
              summary
          }
      });

  } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  createBatchTransactions,
  projectTransactionAnalysis
};