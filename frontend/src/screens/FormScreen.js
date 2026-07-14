import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useBarang } from "../context/BarangContext";
import { barangApi } from "../api/barangApi";

const KATEGORI_OPTIONS = ["Sembako", "Minuman", "Kebersihan", "Alat Tulis", "Dapur"];

export default function FormScreen({ route, navigation }) {
  const editingItem = route.params?.barang;
  const { addBarang, editBarang } = useBarang();

  const [namaBarang, setNamaBarang] = useState(editingItem?.nama_barang || "");
  const [kategori, setKategori] = useState(editingItem?.kategori || "");
  const [harga, setHarga] = useState(editingItem ? String(editingItem.harga) : "");
  const [stok, setStok] = useState(editingItem ? String(editingItem.stok) : "");
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Status pengecekan nama duplikat secara real-time
  const [namaStatus, setNamaStatus] = useState(null); // null | "checking" | "available" | "taken"
  const debounceRef = useRef(null);

  // Cek nama barang setiap user berhenti mengetik 500ms -> mencegah data ganda sedini mungkin
  useEffect(() => {
    if (!namaBarang.trim()) {
      setNamaStatus(null);
      return;
    }
    if (editingItem && namaBarang.trim() === editingItem.nama_barang) {
      setNamaStatus(null); // nama tidak berubah dari data asli
      return;
    }
    setNamaStatus("checking");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await barangApi.checkNama(namaBarang.trim(), editingItem?.id);
        setNamaStatus(res.available ? "available" : "taken");
      } catch (err) {
        setNamaStatus(null);
      }
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [namaBarang]);

  const validate = () => {
    const errs = [];
    if (!namaBarang.trim()) errs.push("Nama barang tidak boleh kosong");
    if (namaStatus === "taken") errs.push("Nama barang sudah digunakan, gunakan nama lain");
    if (!kategori.trim()) errs.push("Pilih kategori barang");
    if (!harga || Number(harga) <= 0) errs.push("Harga harus lebih besar dari nol");
    if (stok === "" || Number(stok) < 0) errs.push("Stok tidak boleh bernilai negatif");
    return errs;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    setSubmitting(true);

    const payload = {
      nama_barang: namaBarang.trim(),
      kategori: kategori.trim(),
      harga: Number(harga),
      stok: Number(stok),
    };

    try {
      if (editingItem) {
        await editBarang(editingItem.id, payload);
        Alert.alert("Berhasil", "Data barang telah diperbarui.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        await addBarang(payload);
        Alert.alert("Berhasil", "Barang baru telah ditambahkan.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      setErrors([err.message]);
      Alert.alert("Gagal Menyimpan", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{editingItem ? "Edit Barang" : "Tambah Barang"}</Text>

      {errors.length > 0 && (
        <View style={styles.errorBox}>
          {errors.map((e, i) => (
            <Text key={i} style={styles.errorText}>• {e}</Text>
          ))}
        </View>
      )}

      <Text style={styles.label}>Nama Barang</Text>
      <TextInput style={styles.input} value={namaBarang} onChangeText={setNamaBarang} placeholder="Contoh: Beras Premium 5kg" />
      {namaStatus === "checking" && (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color="#64748b" />
          <Text style={styles.statusTextNeutral}>  Memeriksa nama...</Text>
        </View>
      )}
      {namaStatus === "available" && <Text style={styles.statusTextOk}>✓ Nama tersedia</Text>}
      {namaStatus === "taken" && <Text style={styles.statusTextBad}>✗ Nama sudah digunakan</Text>}

      <Text style={styles.label}>Kategori</Text>
      <View style={styles.chipWrap}>
        {KATEGORI_OPTIONS.map((k) => (
          <TouchableOpacity
            key={k}
            onPress={() => setKategori(k)}
            style={[styles.chip, kategori === k && styles.chipActive]}
          >
            <Text style={[styles.chipText, kategori === k && styles.chipTextActive]}>{k}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Harga (Rp)</Text>
      <TextInput style={styles.input} value={harga} onChangeText={setHarga} keyboardType="numeric" placeholder="0" />

      <Text style={styles.label}>Stok</Text>
      <TextInput style={styles.input} value={stok} onChangeText={setStok} keyboardType="numeric" placeholder="0" />

      <TouchableOpacity
        style={[styles.submitBtn, (submitting || namaStatus === "taken") && { opacity: 0.5 }]}
        onPress={handleSubmit}
        disabled={submitting || namaStatus === "taken"}
      >
        <Text style={styles.submitText}>{submitting ? "Menyimpan..." : "Simpan"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 16, color: "#0f172a" },
  label: { fontSize: 13, color: "#334155", fontWeight: "600", marginTop: 14, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, backgroundColor: "#f8fafc",
  },
  errorBox: { backgroundColor: "#fee2e2", padding: 12, borderRadius: 10, marginBottom: 10 },
  errorText: { color: "#b91c1c", fontSize: 13 },

  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  statusTextNeutral: { fontSize: 12, color: "#64748b" },
  statusTextOk: { fontSize: 12, color: "#16a34a", marginTop: 6, fontWeight: "600" },
  statusTextBad: { fontSize: 12, color: "#dc2626", marginTop: 6, fontWeight: "600" },

  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#f8fafc",
  },
  chipActive: { backgroundColor: "#1e293b", borderColor: "#1e293b" },
  chipText: { fontSize: 13, color: "#334155", fontWeight: "600" },
  chipTextActive: { color: "#fff" },

  submitBtn: {
    backgroundColor: "#16a34a", padding: 15, borderRadius: 12,
    alignItems: "center", marginTop: 26, marginBottom: 40,
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});