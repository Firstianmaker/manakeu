const db = require('../config/database');

const getProjectTimeline = async (req, res) => {
try {
  const { projectId } = req.params;
  
  const query = `
      SELECT 
          'transaksi' as tipe_aktivitas,
          t.ID_Transaksi as id_aktivitas,
          t.Tanggal_Transaksi as tanggal,
          t.Jenis_Transaksi as jenis,
          t.Jumlah,
          t.Keterangan as deskripsi,
          COALESCE(n.Status_Verifikasi, 'Belum Ada Nota') as status_nota,
          COALESCE(a.Status_Approval, 'Belum Diapprove') as status_approval
      FROM transaksi t
      LEFT JOIN nota n ON t.ID_Transaksi = n.ID_Transaksi
      LEFT JOIN approval a ON n.ID_Nota = a.ID_Nota
      WHERE t.ID_Project = ?
      ORDER BY t.Tanggal_Transaksi DESC`;

  const [results] = await db.promise().query(query, [projectId]);

  return res.status(200).json({
      status: 'success',
      data: {
          project_id: projectId,
          total_aktivitas: results.length,
          timeline: results.map(row => ({
              ...row,
              Jumlah: Number(row.Jumlah)
          }))
      }
  });
} catch (error) {
  console.error('Error:', error);
  return res.status(500).json({ status: 'error', message: error.message });
}
};

const transferProject = async (req, res) => {
  try {
      const { source_project_id, target_project_id, transaction_ids } = req.body;

      // Validasi input
      if (!source_project_id || !target_project_id || !transaction_ids) {
          return res.status(400).json({
              status: 'error',
              message: 'Project source, target, dan transaction IDs diperlukan'
          });
      }

      // Cek keberadaan project
      const [projects] = await db.promise().query(
          'SELECT ID_Project, Nama_Project FROM project WHERE ID_Project IN (?, ?)',
          [source_project_id, target_project_id]
      );

      if (projects.length !== 2) {
          return res.status(404).json({
              status: 'error',
              message: 'Project source atau target tidak ditemukan'
          });
      }

      await db.promise().query('START TRANSACTION');

      // Update transaksi
      const [updateResult] = await db.promise().query(
          'UPDATE transaksi SET ID_Project = ? WHERE ID_Project = ? AND ID_Transaksi IN (?)',
          [target_project_id, source_project_id, transaction_ids]
      );

      // Log untuk setiap transaksi
      for (const transId of transaction_ids) {
          await db.promise().query(
              `INSERT INTO log_aktivitas (ID_User, Aksi, Tanggal_Aksi) 
               VALUES (?, ?, NOW())`,
              [
                  req.user.ID_User,
                  `Transfer transaksi ID ${transId} dari project ${source_project_id} ke project ${target_project_id}`
              ]
          );
      }

      await db.promise().query('COMMIT');

      return res.status(200).json({
          status: 'success',
          message: `${updateResult.affectedRows} transaksi berhasil ditransfer`,
          data: {
              source_project: projects.find(p => p.ID_Project === source_project_id),
              target_project: projects.find(p => p.ID_Project === target_project_id),
              transferred_transactions: updateResult.affectedRows
          }
      });

  } catch (error) {
      await db.promise().query('ROLLBACK');
      console.error('Error:', error);
      return res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  getProjectTimeline,
  transferProject
};