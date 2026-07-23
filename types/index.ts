// ============================================================
// types/index.ts
// Tipe data utama sistem SPK SAW — UD. Kilang Kayu Beuna Jaya
// Sesuai ERD skripsi Muzzakir Walad (2026)
// ============================================================

export interface Kayu {
  id: string
  kode: 'A1' | 'A2' | 'A3'
  nama: string
  nama_latin: string
  c1_harga: number   // Cost
  c2_kekuatan: number // Benefit 1–5
  c3_stok: number    // Benefit 1–5
  c4_ketahanan: number // Benefit 1–5
  c5_berat_jenis: number // Benefit (g/cm³)
  c6_pasar: number   // Benefit 1–5
  c7_estetika: number // Benefit 1–5
  created_at?: string
  updated_at?: string
}

export interface Bobot {
  id: string
  w1_harga: number   // 0,20
  w2_kekuatan: number // 0,20
  w3_stok: number    // 0,15
  w4_ketahanan: number // 0,15
  w5_berat_jenis: number // 0,10
  w6_pasar: number   // 0,10
  w7_estetika: number // 0,10
  updated_at?: string
}

export interface HasilSAW {
  kode: string
  nama: string
  r_c1: number
  r_c2: number
  r_c3: number
  r_c4: number
  r_c5: number
  r_c6: number
  r_c7: number
  vi: number
  peringkat: number
  selisih?: number
}

export interface Pesanan {
  id: string
  no_pesanan: string
  nama_pelanggan: string
  jenis_kayu: string
  qty: number
  satuan: string
  status: 'menunggu' | 'dikonfirmasi' | 'selesai' | 'dibatalkan'
  catatan?: string
  created_at: string
  updated_at?: string
}

export interface StatAdmin {
  jumlah_kayu: number
  jumlah_kriteria: number
  skor_tertinggi: number
  fitur_diuji: number
  pesanan_menunggu: number
}