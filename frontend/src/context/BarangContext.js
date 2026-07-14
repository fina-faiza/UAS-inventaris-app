import React, { createContext, useContext, useState, useCallback } from "react";
import { barangApi } from "../api/barangApi";

const BarangContext = createContext();

export function BarangProvider({ children }) {
  const [listBarang, setListBarang] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  // State pagination -> 10 data per halaman biar aplikasi tetap ringan
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("");

  const fetchBarang = useCallback(async (targetPage = 1, searchText = "", kategori = "") => {
    setLoading(true);
    try {
      const res = await barangApi.getAll(targetPage, searchText, kategori);
      setListBarang(res.data);
      setPage(res.pagination.page);
      setTotalPages(res.pagination.totalPages || 1);
      setTotal(res.pagination.total);
      setSearch(searchText);
      setKategoriFilter(kategori);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await barangApi.getStats();
      setStats(res);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Setelah tambah/edit/hapus, refresh halaman yang sedang aktif + statistik
  // supaya dashboard dan list selalu sinkron tanpa perlu restart aplikasi
  const refreshAll = async () => {
    await Promise.all([fetchBarang(page, search, kategoriFilter), fetchStats()]);
  };

  const addBarang = async (barang) => {
    const newItem = await barangApi.create(barang);
    await refreshAll();
    return newItem;
  };

  const editBarang = async (id, barang) => {
    const updated = await barangApi.update(id, barang);
    await refreshAll();
    return updated;
  };

  const deleteBarang = async (id) => {
    await barangApi.remove(id);
    // Kalau halaman jadi kosong setelah hapus (dan bukan halaman 1), mundur 1 halaman
    const isLastItemOnPage = listBarang.length === 1 && page > 1;
    const targetPage = isLastItemOnPage ? page - 1 : page;
    await fetchBarang(targetPage, search, kategoriFilter);
    await fetchStats();
  };

  const goToPage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchBarang(newPage, search, kategoriFilter);
  };

  return (
    <BarangContext.Provider
      value={{
        listBarang,
        loading,
        stats,
        page,
        totalPages,
        total,
        search,
        kategoriFilter,
        fetchBarang,
        fetchStats,
        addBarang,
        editBarang,
        deleteBarang,
        goToPage,
      }}
    >
      {children}
    </BarangContext.Provider>
  );
}

export function useBarang() {
  return useContext(BarangContext);
}