CREATE DATABASE IF NOT EXISTS inventaris_db;
USE inventaris_db;

DROP TABLE IF EXISTS barang;

CREATE TABLE IF NOT EXISTS barang (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_barang VARCHAR(100) NOT NULL UNIQUE,   -- UNIQUE -> mencegah nama barang sama
  kategori VARCHAR(50) NOT NULL,
  harga DECIMAL(12,2) NOT NULL,
  stok INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT chk_harga CHECK (harga > 0),      -- harga harus > 0
  CONSTRAINT chk_stok CHECK (stok >= 0)        -- stok tidak boleh negatif
);

-- Contoh data: Sembako & Kebutuhan Rumah Tangga
INSERT INTO barang (nama_barang, kategori, harga, stok) VALUES
('Beras Premium 5kg', 'Sembako', 68000, 42),
('Minyak Goreng 2L', 'Sembako', 34000, 30),
('Gula Pasir 1kg', 'Sembako', 15000, 55),
('Tepung Terigu 1kg', 'Sembako', 12000, 38),
('Telur Ayam 1kg', 'Sembako', 28000, 20),
('Kecap Manis 600ml', 'Sembako', 18000, 25),
('Garam Dapur 500g', 'Sembako', 4000, 60),
('Air Mineral 600ml', 'Minuman', 3000, 120),
('Teh Celup Kotak', 'Minuman', 9500, 48),
('Kopi Sachet Renceng', 'Minuman', 14000, 33),
('Susu UHT 1L', 'Minuman', 19000, 27),
('Sirup Rasa Jeruk 600ml', 'Minuman', 22000, 18),
('Sabun Cuci Piring 800ml', 'Kebersihan', 16000, 40),
('Deterjen Bubuk 1kg', 'Kebersihan', 21000, 35),
('Sapu Ijuk', 'Kebersihan', 25000, 12),
('Kain Pel', 'Kebersihan', 17000, 0),
('Tisu Gulung 4pcs', 'Kebersihan', 13500, 50),
('Buku Tulis 38 Lembar', 'Alat Tulis', 4500, 90),
('Pulpen Standar', 'Alat Tulis', 2500, 150),
('Pensil 2B', 'Alat Tulis', 2000, 100),
('Penghapus Karet', 'Alat Tulis', 1500, 70),
('Panci Aluminium 24cm', 'Dapur', 85000, 8),
('Wajan Anti Lengket', 'Dapur', 95000, 6),
('Piring Melamin', 'Dapur', 12000, 45),
('Gelas Kaca', 'Dapur', 8000, 0);