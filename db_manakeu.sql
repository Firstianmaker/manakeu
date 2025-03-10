-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 10, 2025 at 04:22 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_manakeu`
--

-- --------------------------------------------------------

--
-- Table structure for table `approval`
--

CREATE TABLE `approval` (
  `ID_Approval` int(11) NOT NULL,
  `ID_Nota` int(11) NOT NULL,
  `ID_Admin` int(11) NOT NULL,
  `Status_Approval` enum('Approved','Rejected') NOT NULL,
  `Tanggal_Approval` date NOT NULL,
  `Catatan` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `approval`
--

INSERT INTO `approval` (`ID_Approval`, `ID_Nota`, `ID_Admin`, `Status_Approval`, `Tanggal_Approval`, `Catatan`) VALUES
(1, 1, 1, 'Approved', '2024-03-15', 'Nota sudah sesuai');

-- --------------------------------------------------------

--
-- Table structure for table `log_aktivitas`
--

CREATE TABLE `log_aktivitas` (
  `ID_Log` int(11) NOT NULL,
  `ID_User` int(11) NOT NULL,
  `Aksi` text NOT NULL,
  `Tanggal_Aksi` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `log_aktivitas`
--

INSERT INTO `log_aktivitas` (`ID_Log`, `ID_User`, `Aksi`, `Tanggal_Aksi`) VALUES
(1, 2, 'Membuat project baru: Website E-Commerce', '2025-03-10 22:21:23');

-- --------------------------------------------------------

--
-- Table structure for table `nota`
--

CREATE TABLE `nota` (
  `ID_Nota` int(11) NOT NULL,
  `ID_Transaksi` int(11) NOT NULL,
  `File_Nota` varchar(255) NOT NULL,
  `Status_Verifikasi` enum('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  `Tanggal_Unggah` date NOT NULL,
  `Tanggal_Verifikasi` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `nota`
--

INSERT INTO `nota` (`ID_Nota`, `ID_Transaksi`, `File_Nota`, `Status_Verifikasi`, `Tanggal_Unggah`, `Tanggal_Verifikasi`) VALUES
(1, 1, 'nota_pembayaran_1.pdf', 'Approved', '2024-03-14', '2024-03-15');

-- --------------------------------------------------------

--
-- Table structure for table `project`
--

CREATE TABLE `project` (
  `ID_Project` int(11) NOT NULL,
  `Nama_Project` varchar(255) NOT NULL,
  `Deskripsi` text DEFAULT NULL,
  `Tanggal_Mulai` date DEFAULT NULL,
  `Tanggal_Selesai` date DEFAULT NULL,
  `Status` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project`
--

INSERT INTO `project` (`ID_Project`, `Nama_Project`, `Deskripsi`, `Tanggal_Mulai`, `Tanggal_Selesai`, `Status`) VALUES
(2, 'Website E-Commerce', 'Pembuatan website e-commerce untuk UKM', '2024-03-14', '2024-06-14', 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `transaksi`
--

CREATE TABLE `transaksi` (
  `ID_Transaksi` int(11) NOT NULL,
  `ID_Project` int(11) NOT NULL,
  `Jenis_Transaksi` enum('Pemasukan','Pengeluaran') NOT NULL,
  `Jumlah` decimal(15,2) NOT NULL,
  `Tanggal_Transaksi` date NOT NULL,
  `Keterangan` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transaksi`
--

INSERT INTO `transaksi` (`ID_Transaksi`, `ID_Project`, `Jenis_Transaksi`, `Jumlah`, `Tanggal_Transaksi`, `Keterangan`) VALUES
(1, 2, 'Pemasukan', 5000000.00, '2024-03-14', 'Pembayaran tahap pertama'),
(2, 2, 'Pengeluaran', 1000000.00, '2024-03-15', 'Pembelian domain dan hosting');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `ID_User` int(11) NOT NULL,
  `Nama` varchar(255) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Role` enum('Admin','User') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`ID_User`, `Nama`, `Email`, `Role`) VALUES
(1, 'Admin Test', 'admin@test.com', 'Admin'),
(2, 'User Test', 'user@test.com', 'User');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `approval`
--
ALTER TABLE `approval`
  ADD PRIMARY KEY (`ID_Approval`),
  ADD KEY `ID_Nota` (`ID_Nota`),
  ADD KEY `ID_Admin` (`ID_Admin`);

--
-- Indexes for table `log_aktivitas`
--
ALTER TABLE `log_aktivitas`
  ADD PRIMARY KEY (`ID_Log`),
  ADD KEY `ID_User` (`ID_User`);

--
-- Indexes for table `nota`
--
ALTER TABLE `nota`
  ADD PRIMARY KEY (`ID_Nota`),
  ADD KEY `ID_Transaksi` (`ID_Transaksi`);

--
-- Indexes for table `project`
--
ALTER TABLE `project`
  ADD PRIMARY KEY (`ID_Project`);

--
-- Indexes for table `transaksi`
--
ALTER TABLE `transaksi`
  ADD PRIMARY KEY (`ID_Transaksi`),
  ADD KEY `ID_Project` (`ID_Project`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`ID_User`),
  ADD UNIQUE KEY `Email` (`Email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `approval`
--
ALTER TABLE `approval`
  MODIFY `ID_Approval` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `log_aktivitas`
--
ALTER TABLE `log_aktivitas`
  MODIFY `ID_Log` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `nota`
--
ALTER TABLE `nota`
  MODIFY `ID_Nota` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `project`
--
ALTER TABLE `project`
  MODIFY `ID_Project` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `transaksi`
--
ALTER TABLE `transaksi`
  MODIFY `ID_Transaksi` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `ID_User` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `approval`
--
ALTER TABLE `approval`
  ADD CONSTRAINT `approval_ibfk_1` FOREIGN KEY (`ID_Nota`) REFERENCES `nota` (`ID_Nota`) ON DELETE CASCADE,
  ADD CONSTRAINT `approval_ibfk_2` FOREIGN KEY (`ID_Admin`) REFERENCES `user` (`ID_User`) ON DELETE CASCADE;

--
-- Constraints for table `log_aktivitas`
--
ALTER TABLE `log_aktivitas`
  ADD CONSTRAINT `log_aktivitas_ibfk_1` FOREIGN KEY (`ID_User`) REFERENCES `user` (`ID_User`) ON DELETE CASCADE;

--
-- Constraints for table `nota`
--
ALTER TABLE `nota`
  ADD CONSTRAINT `nota_ibfk_1` FOREIGN KEY (`ID_Transaksi`) REFERENCES `transaksi` (`ID_Transaksi`) ON DELETE CASCADE;

--
-- Constraints for table `transaksi`
--
ALTER TABLE `transaksi`
  ADD CONSTRAINT `transaksi_ibfk_1` FOREIGN KEY (`ID_Project`) REFERENCES `project` (`ID_Project`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
