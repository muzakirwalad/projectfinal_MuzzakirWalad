// lib/saw.ts
// Tipe data & logika SAW — sesuai skripsi Beuna Jaya Kayu

export type JenisAtribut = 'benefit' | 'cost'

export interface Kriteria {
  id: string          // 'C1' … 'C7'
  nama: string
  jenis: JenisAtribut
  bobot: number       // 0 < bobot ≤ 1, Σ = 1
  urutan?: number
}

export interface Kayu {
  id: string          // UUID dari Supabase
  kode: string        // 'A1', 'A2', 'A3'
  nama: string
  deskripsi?: string
  foto?: string
  nilai: Record<string, number>   // { C1: 3, C2: 3, ... }
}

export interface HasilSAW {
  kayuId: string
  kode: string
  nama: string
  vi: number
  rank: number
  nilaiNormal: Record<string, number>
}

// ── Default data sesuai skripsi (fallback / seed UI) ──────────────────────────

export const KRITERIA_DEFAULT: Kriteria[] = [
  { id: 'C1', nama: 'Kekuatan (Kelas Kuat)',        jenis: 'benefit', bobot: 0.20, urutan: 1 },
  { id: 'C2', nama: 'Keawetan (Kelas Awet)',         jenis: 'benefit', bobot: 0.20, urutan: 2 },
  { id: 'C3', nama: 'Harga per m³',                  jenis: 'cost',    bobot: 0.15, urutan: 3 },
  { id: 'C4', nama: 'Kemudahan Pengerjaan',          jenis: 'benefit', bobot: 0.15, urutan: 4 },
  { id: 'C5', nama: 'Ketersediaan Stok',             jenis: 'benefit', bobot: 0.15, urutan: 5 },
  { id: 'C6', nama: 'Penyusutan & Perubahan Bentuk', jenis: 'cost',    bobot: 0.10, urutan: 6 },
  { id: 'C7', nama: 'Estetika / Serat Kayu',         jenis: 'benefit', bobot: 0.05, urutan: 7 },
]

export const KAYU_DEFAULT: Kayu[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    kode: 'A1', nama: 'Kayu Meranti',
    deskripsi: 'Kayu komersial populer dari Sumatera & Kalimantan. Ringan-sedang, mudah dikerjakan.',
    foto: 'https://images.unsplash.com/photo-1546484475-7f7bd55792da?w=800&auto=format&fit=crop',
    nilai: { C1: 3, C2: 3, C3: 1800000, C4: 4, C5: 4, C6: 3, C7: 3 },
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    kode: 'A2', nama: 'Kayu Merbau',
    deskripsi: 'Kayu keras tropis dengan serat indah. Tahan rayap, cocok untuk lantai & konstruksi.',
    foto: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop',
    nilai: { C1: 4, C2: 4, C3: 2800000, C4: 3, C5: 3, C6: 2, C7: 5 },
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    kode: 'A3', nama: 'Kayu Ulin/Besi',
    deskripsi: 'Kayu terkeras & terpadat di Indonesia. Sangat tahan air & serangga, umur panjang.',
    foto: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop',
    nilai: { C1: 5, C2: 5, C3: 4500000, C4: 2, C5: 2, C6: 1, C7: 4 },
  },
]

// ── Kalkulasi SAW ──────────────────────────────────────────────────────────────

/**
 * Normalisasi matriks keputusan → r_ij
 * Benefit : r_ij = x_ij / max(x_ij)
 * Cost    : r_ij = min(x_ij) / x_ij
 */
export function calculateSAW(daftarKayu: Kayu[], daftarKriteria: Kriteria[]): HasilSAW[] {
  if (daftarKayu.length === 0 || daftarKriteria.length === 0) return []

  // Hitung max & min per kriteria
  const maxNilai: Record<string, number> = {}
  const minNilai: Record<string, number> = {}

  for (const k of daftarKriteria) {
    const vals = daftarKayu.map((a) => a.nilai[k.id] ?? 0)
    maxNilai[k.id] = Math.max(...vals)
    minNilai[k.id] = Math.min(...vals.filter((v) => v > 0))
  }

  // Normalisasi & hitung Vi
  const hasil: HasilSAW[] = daftarKayu.map((kayu) => {
    const nilaiNormal: Record<string, number> = {}
    let vi = 0

    for (const k of daftarKriteria) {
      const xij = kayu.nilai[k.id] ?? 0
      const rij =
        k.jenis === 'benefit'
          ? maxNilai[k.id] !== 0 ? xij / maxNilai[k.id] : 0
          : xij !== 0 ? minNilai[k.id] / xij : 0

      nilaiNormal[k.id] = rij
      vi += k.bobot * rij
    }

    return { kayuId: kayu.id, kode: kayu.kode, nama: kayu.nama, vi, nilaiNormal, rank: 0 }
  })

  // Urutkan & beri rank
  hasil.sort((a, b) => b.vi - a.vi)
  hasil.forEach((h, i) => { h.rank = i + 1 })

  return hasil
}

export function totalBobot(daftarKriteria: Kriteria[]): number {
  return daftarKriteria.reduce((sum, k) => sum + k.bobot, 0)
}

// ── Tampilan ramah pengguna (untuk halaman pelanggan) ─────────────────────────
// Pelanggan tidak perlu melihat angka Vi mentah atau bobot kriteria.
// Fungsi di bawah ini mengubah hasil SAW menjadi persentase kecocokan & label
// kualitatif yang mudah dipahami orang awam.

/**
 * Mengubah nilai Vi menjadi persentase kecocokan relatif terhadap kayu
 * dengan Vi tertinggi (rank 1). Kayu terbaik selalu tampil 100%.
 */
export function getMatchPercentage(vi: number, viTerbaik: number): number {
  if (!viTerbaik || viTerbaik <= 0) return 0
  const pct = (vi / viTerbaik) * 100
  return Math.max(0, Math.min(100, Math.round(pct)))
}

export type MatchTone = 'best' | 'great' | 'good' | 'fair'

export interface MatchLabel {
  label: string
  tone: MatchTone
}

/**
 * Memberi label kualitatif berdasarkan peringkat & persentase kecocokan,
 * tanpa perlu menyebut angka Vi atau bobot sama sekali.
 */
export function getMatchLabel(rank: number, percentage: number): MatchLabel {
  if (rank === 1) return { label: 'Pilihan Terbaik', tone: 'best' }
  if (percentage >= 85) return { label: 'Sangat Direkomendasikan', tone: 'great' }
  if (percentage >= 70) return { label: 'Direkomendasikan', tone: 'good' }
  return { label: 'Cukup Sesuai', tone: 'fair' }
}