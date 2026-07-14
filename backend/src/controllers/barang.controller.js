const pool = require("../db");

// GET /api/barang?page=1&limit=10&search=&kategori=
// -> pakai pagination (10 data/halaman) supaya tetap cepat walau data banyak
exports.getAllBarang = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const kategori = req.query.kategori || "";

    const whereClause = kategori
      ? "WHERE nama_barang LIKE ? AND kategori = ?"
      : "WHERE nama_barang LIKE ?";
    const params = kategori ? [`%${search}%`, kategori] : [`%${search}%`];

    const [rows] = await pool.query(
      `SELECT id, nama_barang, kategori, harga, stok
       FROM barang
       ${whereClause}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM barang ${whereClause}`,
      params
    );

    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        total: countRows[0].total,
        totalPages: Math.ceil(countRows[0].total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil data barang", error: err.message });
  }
};

// GET /api/barang/check-nama?nama=...&exclude_id=...
// -> dipanggil frontend secara real-time untuk cegah nama barang ganda
exports.checkNama = async (req, res) => {
  try {
    const { nama, exclude_id } = req.query;
    if (!nama || !nama.trim()) {
      return res.json({ available: true });
    }
    const query = exclude_id
      ? "SELECT id FROM barang WHERE nama_barang = ? AND id != ?"
      : "SELECT id FROM barang WHERE nama_barang = ?";
    const params = exclude_id ? [nama.trim(), exclude_id] : [nama.trim()];
    const [rows] = await pool.query(query, params);
    res.json({ available: rows.length === 0 });
  } catch (err) {
    res.status(500).json({ message: "Gagal memeriksa nama", error: err.message });
  }
};

// GET /api/barang/stats -> data ringkasan untuk dashboard
exports.getStats = async (req, res) => {
  try {
    const [[totalRow]] = await pool.query("SELECT COUNT(*) as total FROM barang");
    const [[stokRow]] = await pool.query("SELECT COALESCE(SUM(stok),0) as total_stok FROM barang");
    const [[nilaiRow]] = await pool.query(
      "SELECT COALESCE(SUM(harga * stok),0) as total_nilai FROM barang"
    );
    const [[lowStokRow]] = await pool.query(
      "SELECT COUNT(*) as low_stok FROM barang WHERE stok > 0 AND stok <= 5"
    );
    const [[habisRow]] = await pool.query(
      "SELECT COUNT(*) as habis FROM barang WHERE stok = 0"
    );
    const [kategoriRows] = await pool.query(
      "SELECT kategori, COUNT(*) as jumlah FROM barang GROUP BY kategori ORDER BY jumlah DESC"
    );

    res.json({
      total_barang: totalRow.total,
      total_stok: stokRow.total_stok,
      total_nilai: nilaiRow.total_nilai,
      low_stok: lowStokRow.low_stok,
      habis: habisRow.habis,
      per_kategori: kategoriRows,
    });
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil statistik", error: err.message });
  }
};

// Fungsi validasi bersama (dipakai saat create & update)
function validateBarang({ nama_barang, harga, stok }) {
  const errors = [];
  if (!nama_barang || nama_barang.trim() === "") {
    errors.push("Nama barang tidak boleh kosong");
  }
  if (harga === undefined || Number(harga) <= 0) {
    errors.push("Harga harus lebih besar dari nol");
  }
  if (stok === undefined || Number(stok) < 0) {
    errors.push("Stok tidak boleh bernilai negatif");
  }
  return errors;
}

// POST /api/barang
exports.createBarang = async (req, res) => {
  const { nama_barang, kategori, harga, stok } = req.body;

  const errors = validateBarang({ nama_barang, harga, stok });
  if (errors.length > 0) {
    return res.status(400).json({ message: "Validasi gagal", errors });
  }

  const connection = await pool.getConnection();
  try {
    // Transaction + row lock untuk mencegah data ganda saat dua user
    // menambahkan barang dengan nama sama secara bersamaan
    await connection.beginTransaction();

    const [existing] = await connection.query(
      "SELECT id FROM barang WHERE nama_barang = ? FOR UPDATE",
      [nama_barang.trim()]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(409).json({ message: "Nama barang sudah digunakan" });
    }

    const [result] = await connection.query(
      "INSERT INTO barang (nama_barang, kategori, harga, stok) VALUES (?, ?, ?, ?)",
      [nama_barang.trim(), kategori, harga, stok]
    );

    await connection.commit();

    const [newRow] = await pool.query("SELECT * FROM barang WHERE id = ?", [result.insertId]);
    res.status(201).json(newRow[0]);
  } catch (err) {
    await connection.rollback();
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Nama barang sudah digunakan" });
    }
    res.status(500).json({ message: "Gagal menambah barang", error: err.message });
  } finally {
    connection.release();
  }
};

// PUT /api/barang/:id
exports.updateBarang = async (req, res) => {
  const { id } = req.params;
  const { nama_barang, kategori, harga, stok } = req.body;

  const errors = validateBarang({ nama_barang, harga, stok });
  if (errors.length > 0) {
    return res.status(400).json({ message: "Validasi gagal", errors });
  }

  try {
    const [dup] = await pool.query(
      "SELECT id FROM barang WHERE nama_barang = ? AND id != ?",
      [nama_barang.trim(), id]
    );
    if (dup.length > 0) {
      return res.status(409).json({ message: "Nama barang sudah digunakan" });
    }

    const [result] = await pool.query(
      "UPDATE barang SET nama_barang=?, kategori=?, harga=?, stok=? WHERE id=?",
      [nama_barang.trim(), kategori, harga, stok, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Barang tidak ditemukan" });
    }

    const [updated] = await pool.query("SELECT * FROM barang WHERE id = ?", [id]);
    res.json(updated[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Nama barang sudah digunakan" });
    }
    res.status(500).json({ message: "Gagal mengubah barang", error: err.message });
  }
};

// DELETE /api/barang/:id
exports.deleteBarang = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT stok FROM barang WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Barang tidak ditemukan" });
    }

    // Aturan bisnis: barang yang stoknya masih ada tidak boleh dihapus
    if (rows[0].stok > 0) {
      return res.status(400).json({
        message: "Barang tidak bisa dihapus karena stok masih tersedia",
      });
    }

    await pool.query("DELETE FROM barang WHERE id = ?", [id]);
    res.json({ message: "Barang berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: "Gagal menghapus barang", error: err.message });
  }
};