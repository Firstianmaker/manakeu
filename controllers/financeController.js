const db = require('../config/database');
const { invalidateMultipleCache } = require('../utils/cacheUtils');

const getProjectMonthly = async (req, res) => {
  try {
      const year = req.query.year || new Date().getFullYear();
      const month = req.query.month || new Date().getMonth() + 1;

      const query = `
          SELECT 
              p.ID_Project,
              p.Nama_Project,
              p.Status as Status_Project,
              COUNT(t.ID_Transaksi) as Total_Transaksi,
              COALESCE(SUM(CASE 
                  WHEN t.Jenis_Transaksi = 'Pemasukan' THEN t.Jumlah 
                  ELSE 0 
              END), 0) as Total_Pemasukan,
              COALESCE(SUM(CASE 
                  WHEN t.Jenis_Transaksi = 'Pengeluaran' THEN t.Jumlah 
                  ELSE 0 
              END), 0) as Total_Pengeluaran,
              COUNT(n.ID_Nota) as Total_Nota,
              COUNT(CASE 
                  WHEN n.Status_Verifikasi = 'Approved' THEN 1 
                  ELSE NULL 
              END) as Nota_Terverifikasi
          FROM project p
          LEFT JOIN transaksi t ON p.ID_Project = t.ID_Project 
          LEFT JOIN nota n ON t.ID_Transaksi = n.ID_Transaksi
          WHERE (t.Tanggal_Transaksi IS NULL OR 
                (YEAR(t.Tanggal_Transaksi) = ? AND MONTH(t.Tanggal_Transaksi) = ?))
          GROUP BY p.ID_Project, p.Nama_Project, p.Status
          ORDER BY Total_Transaksi DESC
      `;

      const [results] = await db.promise().query(query, [year, month]);

      // Format angka agar tidak muncul sebagai string
      const formattedResults = results.map(row => ({
          ...row,
          Total_Pemasukan: Number(row.Total_Pemasukan),
          Total_Pengeluaran: Number(row.Total_Pengeluaran),
          Total_Transaksi: Number(row.Total_Transaksi),
          Total_Nota: Number(row.Total_Nota),
          Nota_Terverifikasi: Number(row.Nota_Terverifikasi)
      }));

      // Hitung total keseluruhan dari hasil yang sudah diformat
      const summary = {
          total_pemasukan: formattedResults.reduce((sum, row) => sum + row.Total_Pemasukan, 0),
          total_pengeluaran: formattedResults.reduce((sum, row) => sum + row.Total_Pengeluaran, 0),
          total_transaksi: formattedResults.reduce((sum, row) => sum + row.Total_Transaksi, 0),
          total_nota: formattedResults.reduce((sum, row) => sum + row.Total_Nota, 0)
      };

      return res.status(200).json({
          status: 'success',
          data: {
              period: `${month}/${year}`,
              summary: summary,
              total_projects: formattedResults.length,
              projects: formattedResults.map(row => ({
                  id_project: row.ID_Project,
                  nama_project: row.Nama_Project,
                  status_project: row.Status_Project,
                  statistik: {
                      total_transaksi: row.Total_Transaksi,
                      total_pemasukan: row.Total_Pemasukan,
                      total_pengeluaran: row.Total_Pengeluaran,
                      total_nota: row.Total_Nota,
                      nota_terverifikasi: row.Nota_Terverifikasi
                  }
              }))
          }
      });

    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({
          status: 'error',
          message: 'Internal server error',
          error: error.message
      });
  }
};

const projectBudgetAdjustment = async (req, res) => {
    try {
        const { project_id, adjustments } = req.body;

        if (!project_id || !adjustments || !Array.isArray(adjustments)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid input. Project ID dan array adjustment diperlukan'
            });
        }

        await db.promise().query('START TRANSACTION');

        const results = [];
        for (const adj of adjustments) {
            const { transaksi_id, jumlah_baru, keterangan } = adj;

            // 1. Update jumlah transaksi
            const [updateResult] = await db.promise().query(
                `UPDATE transaksi 
                 SET Jumlah = ?, Keterangan = CONCAT(Keterangan, ' [Adjusted: ', ?) 
                 WHERE ID_Transaksi = ? AND ID_Project = ?`,
                [jumlah_baru, keterangan, transaksi_id, project_id]
            );

            // 2. Log perubahan
            await db.promise().query(
                `INSERT INTO log_aktivitas (ID_User, Aksi, Tanggal_Aksi) 
                 VALUES (?, ?, NOW())`,
                [req.user.ID_User, `Adjustment budget transaksi ID ${transaksi_id} menjadi ${jumlah_baru}`]
            );

            results.push({
                transaksi_id,
                jumlah_baru,
                updated: updateResult.affectedRows > 0
            });
        }

        // Tambahan: Invalidate cache setelah adjustment
        await invalidateMultipleCache([
            `project:summary:${project_id}`,
            `project:monthly:${project_id}:*`,
            `project:timeline:${project_id}`,
            `user:dashboard:${req.user.ID_User}`,
            `project:budget:${project_id}`
        ]);

        await db.promise().query('COMMIT');

        return res.status(200).json({
            status: 'success',
            message: `Berhasil mengupdate ${results.filter(r => r.updated).length} transaksi`,
            data: results
        });

    } catch (error) {
        await db.promise().query('ROLLBACK');
        console.error('Error in project budget adjustment:', error);
        return res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

module.exports = {
  getProjectMonthly,
  projectBudgetAdjustment
};