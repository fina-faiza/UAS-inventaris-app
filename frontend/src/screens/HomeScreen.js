import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Alert, RefreshControl, ScrollView,
} from "react-native";
import { useBarang } from "../context/BarangContext";

// Warna badge per kategori biar gampang dibedain sekilas
const KATEGORI_COLOR = {
  Sembako: "#f59e0b",
  Minuman: "#0ea5e9",
  Kebersihan: "#10b981",
  "Alat Tulis": "#8b5cf6",
  Dapur: "#ef4444",
};
const getKategoriColor = (k) => KATEGORI_COLOR[k] || "#64748b";

const KATEGORI_LIST = ["Semua", "Sembako", "Minuman", "Kebersihan", "Alat Tulis", "Dapur"];

export default function HomeScreen({ navigation }) {
  const {
    listBarang, loading, stats, page, totalPages, total,
    fetchBarang, fetchStats, deleteBarang, goToPage,
  } = useBarang();
  const [searchText, setSearchText] = useState("");
  const [activeKategori, setActiveKategori] = useState("Semua");

  useEffect(() => {
    fetchBarang(1, "", "");
    fetchStats();
  }, []);

  const handleSearch = (text) => {
    setSearchText(text);
    fetchBarang(1, text, activeKategori === "Semua" ? "" : activeKategori);
  };

  const handleFilterKategori = (kategori) => {
    setActiveKategori(kategori);
    fetchBarang(1, searchText, kategori === "Semua" ? "" : kategori);
  };

  const handleDelete = (item) => {
    if (item.stok > 0) {
      Alert.alert("Tidak Bisa Dihapus", `"${item.nama_barang}" masih memiliki stok ${item.stok}. Kosongkan stok terlebih dahulu sebelum menghapus.`);
      return;
    }
    Alert.alert("Konfirmasi Hapus", `Yakin ingin menghapus "${item.nama_barang}"?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteBarang(item.id);
            Alert.alert("Berhasil", "Barang telah dihapus.");
          } catch (err) {
            Alert.alert("Gagal Menghapus", err.message);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const color = getKategoriColor(item.kategori);
    return (
      <View style={styles.card}>
        <View style={[styles.colorBar, { backgroundColor: color }]} />
        <View style={{ flex: 1, paddingLeft: 10 }}>
          <View style={styles.cardHeader}>
            <Text style={styles.nama} numberOfLines={1}>{item.nama_barang}</Text>
            <View style={[styles.badge, { backgroundColor: color + "22" }]}>
              <Text style={[styles.badgeText, { color }]}>{item.kategori}</Text>
            </View>
          </View>
          <Text style={styles.harga}>Rp {Number(item.harga).toLocaleString("id-ID")}</Text>
          <View style={styles.stokRow}>
            <View style={[
              styles.stokDot,
              { backgroundColor: item.stok === 0 ? "#ef4444" : item.stok <= 5 ? "#f59e0b" : "#22c55e" }
            ]} />
            <Text style={styles.stokText}>
              Stok: {item.stok} {item.stok === 0 ? "(Habis)" : item.stok <= 5 ? "(Menipis)" : ""}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate("Form", { barang: item })}>
            <Text style={styles.btnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
            <Text style={styles.btnText}>Hapus</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Dashboard */}
      <View style={styles.dashboardWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          <View style={[styles.statCard, { backgroundColor: "#1e293b" }]}>
            <Text style={styles.statValue}>{stats?.total_barang ?? "-"}</Text>
            <Text style={styles.statLabel}>Jenis Barang</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#0ea5e9" }]}>
            <Text style={styles.statValue}>{stats?.total_stok ?? "-"}</Text>
            <Text style={styles.statLabel}>Total Stok</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#f59e0b" }]}>
            <Text style={styles.statValue}>{stats?.low_stok ?? "-"}</Text>
            <Text style={styles.statLabel}>Stok Menipis</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#ef4444" }]}>
            <Text style={styles.statValue}>{stats?.habis ?? "-"}</Text>
            <Text style={styles.statLabel}>Stok Habis</Text>
          </View>
        </ScrollView>
      </View>

      {/* Search */}
      <TextInput
        style={styles.searchInput}
        placeholder="Cari nama barang..."
        value={searchText}
        onChangeText={handleSearch}
      />

      {/* Filter kategori */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8 }}>
        {KATEGORI_LIST.map((k) => (
          <TouchableOpacity
            key={k}
            onPress={() => handleFilterKategori(k)}
            style={[
              styles.filterChip,
              activeKategori === k && { backgroundColor: "#1e293b" },
            ]}
          >
            <Text style={[styles.filterChipText, activeKategori === k && { color: "#fff" }]}>{k}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        data={listBarang}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => fetchBarang(page, searchText, activeKategori === "Semua" ? "" : activeKategori)} />
        }
        ListEmptyComponent={!loading && <Text style={styles.empty}>Tidak ada data barang</Text>}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            disabled={page <= 1}
            onPress={() => goToPage(page - 1)}
            style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
          >
            <Text style={styles.pageBtnText}>‹ Prev</Text>
          </TouchableOpacity>
          <Text style={styles.pageInfo}>Halaman {page} dari {totalPages} · {total} barang</Text>
          <TouchableOpacity
            disabled={page >= totalPages}
            onPress={() => goToPage(page + 1)}
            style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
          >
            <Text style={styles.pageBtnText}>Next ›</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("Form")}>
        <Text style={styles.fabText}>+ Tambah Barang</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9", padding: 12 },
  dashboardWrap: { marginBottom: 10 },
  statCard: { borderRadius: 14, padding: 14, minWidth: 110 },
  statValue: { color: "#fff", fontSize: 22, fontWeight: "800" },
  statLabel: { color: "#e2e8f0", fontSize: 12, marginTop: 2 },

  searchInput: {
    backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 10, marginBottom: 10, borderWidth: 1, borderColor: "#e2e8f0",
  },
  filterRow: { marginBottom: 10, maxHeight: 40 },
  filterChip: {
    backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0",
  },
  filterChipText: { fontSize: 13, color: "#334155", fontWeight: "600" },

  card: {
    backgroundColor: "#fff", borderRadius: 14, marginBottom: 10,
    flexDirection: "row", alignItems: "center", elevation: 2,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, overflow: "hidden",
  },
  colorBar: { width: 5, alignSelf: "stretch" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingRight: 10 },
  nama: { fontSize: 15, fontWeight: "700", color: "#0f172a", flexShrink: 1, marginRight: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  harga: { fontSize: 13, color: "#475569", marginTop: 4, paddingRight: 10 },
  stokRow: { flexDirection: "row", alignItems: "center", marginTop: 4, paddingRight: 10, paddingBottom: 12 },
  stokDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  stokText: { fontSize: 12, color: "#64748b" },

  actions: { paddingRight: 10, gap: 6 },
  editBtn: { backgroundColor: "#3b82f6", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  deleteBtn: { backgroundColor: "#ef4444", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  btnText: { color: "#fff", fontSize: 12, fontWeight: "700", textAlign: "center" },

  empty: { textAlign: "center", marginTop: 40, color: "#94a3b8" },

  pagination: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#fff", borderRadius: 10, padding: 10, marginBottom: 8,
  },
  pageBtn: { backgroundColor: "#1e293b", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  pageBtnDisabled: { backgroundColor: "#cbd5e1" },
  pageBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  pageInfo: { fontSize: 11, color: "#64748b" },

  fab: {
    backgroundColor: "#16a34a", padding: 14, borderRadius: 12,
    alignItems: "center", elevation: 3,
  },
  fabText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});