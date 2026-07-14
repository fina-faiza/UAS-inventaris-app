const BASE_URL = "http://192.168.0.127:3000/api/barang";

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    const message = data.errors ? data.errors.join(", ") : data.message;
    throw new Error(message || "Terjadi kesalahan");
  }
  return data;
}

export const barangApi = {
  // limit default 10 -> sesuai kebutuhan pagination biar tidak lemot
  getAll: async (page = 1, search = "", kategori = "") => {
    const res = await fetch(
      `${BASE_URL}?page=${page}&limit=10&search=${encodeURIComponent(search)}&kategori=${encodeURIComponent(kategori)}`
    );
    return handleResponse(res);
  },

  getStats: async () => {
    const res = await fetch(`${BASE_URL}/stats`);
    return handleResponse(res);
  },

  // Cek real-time apakah nama barang sudah dipakai (untuk cegah data ganda saat mengetik)
  checkNama: async (nama, excludeId = null) => {
    const url = excludeId
      ? `${BASE_URL}/check-nama?nama=${encodeURIComponent(nama)}&exclude_id=${excludeId}`
      : `${BASE_URL}/check-nama?nama=${encodeURIComponent(nama)}`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  create: async (barang) => {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(barang),
    });
    return handleResponse(res);
  },

  update: async (id, barang) => {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(barang),
    });
    return handleResponse(res);
  },

  remove: async (id) => {
    const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
    return handleResponse(res);
  },
};