// lib/supabase/queries.ts
// Semua fungsi fetch & mutasi data ke Supabase

import { supabase } from './client'
import type { Kayu, Kriteria, HasilSAW } from '../saw'

// ── Types Supabase raw ────────────────────────────────────────────────────────

interface KriteriaRow {
  id: string
  nama: string
  jenis: 'benefit' | 'cost'
  bobot: number
  urutan: number
}

interface KayuRow {
  id: string
  kode: string
  nama: string
  deskripsi: string | null
  foto?: string | null
  nilai_kayu: { kriteria_id: string; nilai: number }[]
}

interface PesananRow {
  id: string
  nama_pemesan: string
  kayu_id: string | null
  volume_m3: number | null
  status: 'menunggu' | 'dikonfirmasi' | 'selesai' | 'dibatalkan'
  catatan: string | null
  created_at: string
  kayu: { nama: string }[] | null
}

interface RiwayatRow {
  id: string
  created_at: string
  dilakukan_oleh: string | null
  jumlah_kayu: number
  jumlah_kriteria: number
  total_bobot: number
  kriteria_snapshot: Kriteria[]
  hasil: HasilSAW[]
  kayu_terbaik_kode: string | null
  kayu_terbaik_nama: string | null
  vi_terbaik: number | null
}

// ── Kriteria ──────────────────────────────────────────────────────────────────

export async function fetchKriteria(): Promise<Kriteria[]> {
  const { data, error } = await supabase
    .from('kriteria')
    .select('*')
    .order('urutan', { ascending: true })

  if (error) throw error
  return (data as KriteriaRow[]).map((r) => ({
    id: r.id,
    nama: r.nama,
    jenis: r.jenis,
    bobot: Number(r.bobot),
    urutan: r.urutan,
  }))
}

export async function upsertKriteria(
  k: Kriteria & { urutan?: number }
): Promise<void> {
  const { error } = await supabase.from('kriteria').upsert(
    {
      id: k.id,
      nama: k.nama,
      jenis: k.jenis,
      bobot: k.bobot,
      urutan: k.urutan ?? 99,
    },
    { onConflict: 'id' }
  )
  if (error) throw error
}

export async function deleteKriteria(id: string): Promise<void> {
  const { error } = await supabase.from('kriteria').delete().eq('id', id)
  if (error) throw error
}

// Helper parser foto & deskripsi untuk kompatibilitas schema DB
function extractFotoAndDeskripsi(rawDeskripsi: string | null, rawFoto: string | null | undefined): { deskripsi: string; foto?: string } {
  let foto = rawFoto || undefined
  let deskripsi = rawDeskripsi || ''

  if (!foto && deskripsi.includes('[IMG:')) {
    const match = deskripsi.match(/\[IMG:(.*?)\]/)
    if (match) {
      foto = match[1].trim()
      deskripsi = deskripsi.replace(/\[IMG:.*?\]/, '').trim()
    }
  }

  return { deskripsi, foto }
}

function encodeFotoIntoDeskripsi(deskripsi: string, foto?: string): string {
  const cleanDesc = deskripsi.replace(/\[IMG:.*?\]/, '').trim()
  if (foto && foto.trim()) {
    return `[IMG:${foto.trim()}] ${cleanDesc}`.trim()
  }
  return cleanDesc
}

// ── Kayu ──────────────────────────────────────────────────────────────────────

export async function fetchKayu() {
  const { data, error } = await supabase
    .from('kayu')
    .select(`
      *,
      nilai_kayu ( kriteria_id, nilai )
    `)
    .order('kode', { ascending: true })

  if (error) {
    console.error('Error fetch kayu:', error)
    throw error
  }

  return (data || []).map((row) => {
    let photoUrl = ''

    if (row.foto) {
      const rawFoto = String(row.foto).trim()
      
      // Jika di DB sudah tersimpan URL utuh (http/https)
      if (rawFoto.startsWith('http://') || rawFoto.startsWith('https://')) {
        photoUrl = rawFoto
      } else {
        // Generasi Public URL langsung dari nama file di Storage (misal: A1-1785426185520.jpg)
        const { data: pUrl } = supabase.storage
          .from('kayu-photos')
          .getPublicUrl(rawFoto)
        
        photoUrl = pUrl.publicUrl
      }
    }

    return {
      id: row.id,
      kode: row.kode,
      nama: row.nama,
      deskripsi: row.deskripsi || '',
      foto: photoUrl, // URL utuh Supabase Storage
      nilai: Object.fromEntries(
        (row.nilai_kayu || []).map((n: any) => [n.kriteria_id, Number(n.nilai)])
      ),
    }
  })
}

export async function upsertKayu(
  kayu: Kayu,
  nilaiMap: Record<string, number>
): Promise<void> {
  // 1. Upsert baris kayu ke kolom foto
  const payload: Record<string, unknown> = {
    id: kayu.id,
    kode: kayu.kode,
    nama: kayu.nama,
    deskripsi: kayu.deskripsi,
    foto: kayu.foto || null,
  }

  let kayuId = kayu.id
  const { data: kayuData, error: kayuErr } = await supabase
    .from('kayu')
    .upsert(payload, { onConflict: 'id' })
    .select('id')
    .single()

  if (kayuErr) {
    // Jika kolom foto belum ada di schema DB, fallback ke deskripsi
    const errStr = (JSON.stringify(kayuErr) + (kayuErr.message || '')).toLowerCase()
    if (errStr.includes('foto') || errStr.includes('column')) {
      const embeddedDeskripsi = encodeFotoIntoDeskripsi(kayu.deskripsi ?? '', kayu.foto)
      delete payload.foto
      payload.deskripsi = embeddedDeskripsi
      const { data: fallbackData, error: fallbackErr } = await supabase
        .from('kayu')
        .upsert(payload, { onConflict: 'id' })
        .select('id')
        .single()

      if (fallbackErr) throw fallbackErr
      kayuId = fallbackData?.id ?? kayu.id
    } else {
      throw kayuErr
    }
  } else {
    kayuId = kayuData?.id ?? kayu.id
  }

  // 2. Upsert nilai kriteria
  const nilaiRows = Object.entries(nilaiMap).map(([kriteria_id, nilai]) => ({
    kayu_id: kayuId,
    kriteria_id,
    nilai,
  }))

  const { error: nilaiErr } = await supabase
    .from('nilai_kayu')
    .upsert(nilaiRows, { onConflict: 'kayu_id,kriteria_id' })

  if (nilaiErr) throw nilaiErr
}

export async function deleteKayu(id: string): Promise<void> {
  // nilai_kayu terhapus otomatis via ON DELETE CASCADE
  const { error } = await supabase.from('kayu').delete().eq('id', id)
  if (error) throw error
}

// ── Pesanan ───────────────────────────────────────────────────────────────────

export interface Pesanan {
  id: string
  nama_pemesan: string
  kayu_id: string | null
  kayu_nama: string | null
  volume_m3: number | null
  status: 'menunggu' | 'dikonfirmasi' | 'selesai' | 'dibatalkan'
  catatan: string | null
  created_at: string
}

export async function fetchPesanan(): Promise<Pesanan[]> {
  const { data, error } = await supabase
    .from('pesanan')
    .select(`id, nama_pemesan, kayu_id, volume_m3, status, catatan, created_at, kayu(nama)`)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data as PesananRow[]).map((r) => ({
  id: r.id,
  nama_pemesan: r.nama_pemesan,
  kayu_id: r.kayu_id,
  kayu_nama: r.kayu?.[0]?.nama ?? null,
  volume_m3: r.volume_m3,
  status: r.status,
  catatan: r.catatan,
  created_at: r.created_at,
}))
}

export async function updateStatusPesanan(
  id: string,
  status: Pesanan['status']
): Promise<void> {
  const { error } = await supabase.from('pesanan').update({ status }).eq('id', id)
  if (error) throw error
}

// ── Dashboard stats ───────────────────────────────────────────────────────────

export interface DashboardStats {
  totalKayu: number
  totalKriteria: number
  pesananMenunggu: number
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [kayuRes, kriteriaRes, pesananRes] = await Promise.all([
    supabase.from('kayu').select('id', { count: 'exact', head: true }),
    supabase.from('kriteria').select('id', { count: 'exact', head: true }),
    supabase
      .from('pesanan')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'menunggu'),
  ])

  if (kayuRes.error) throw kayuRes.error
  if (kriteriaRes.error) throw kriteriaRes.error
  if (pesananRes.error) throw pesananRes.error

  return {
    totalKayu: kayuRes.count ?? 0,
    totalKriteria: kriteriaRes.count ?? 0,
    pesananMenunggu: pesananRes.count ?? 0,
  }
}

// ── Riwayat Perhitungan SAW ────────────────────────────────────────────────────

export interface RiwayatPerhitungan {
  id: string
  createdAt: string
  dilakukanOleh: string | null
  jumlahKayu: number
  jumlahKriteria: number
  totalBobot: number
  kriteriaSnapshot: Kriteria[]
  hasil: HasilSAW[]
  kayuTerbaikKode: string | null
  kayuTerbaikNama: string | null
  viTerbaik: number | null
}

function mapRiwayatRow(row: RiwayatRow): RiwayatPerhitungan {
  return {
    id: row.id,
    createdAt: row.created_at,
    dilakukanOleh: row.dilakukan_oleh,
    jumlahKayu: row.jumlah_kayu,
    jumlahKriteria: row.jumlah_kriteria,
    totalBobot: Number(row.total_bobot),
    kriteriaSnapshot: row.kriteria_snapshot,
    hasil: row.hasil,
    kayuTerbaikKode: row.kayu_terbaik_kode,
    kayuTerbaikNama: row.kayu_terbaik_nama,
    viTerbaik: row.vi_terbaik != null ? Number(row.vi_terbaik) : null,
  }
}

/** Ambil seluruh riwayat perhitungan, terbaru lebih dulu */
export async function fetchRiwayatPerhitungan(): Promise<RiwayatPerhitungan[]> {
  const { data, error } = await supabase
    .from('riwayat_perhitungan')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as RiwayatRow[]).map(mapRiwayatRow)
}

/** Simpan satu snapshot hasil perhitungan SAW yang baru dijalankan */
export async function simpanRiwayatPerhitungan(payload: {
  dilakukanOleh: string | null
  jumlahKayu: number
  kriteria: Kriteria[]
  totalBobot: number
  hasil: HasilSAW[]
}): Promise<RiwayatPerhitungan> {
  const terbaik = payload.hasil.find((h) => h.rank === 1) ?? payload.hasil[0] ?? null

  const { data, error } = await supabase
    .from('riwayat_perhitungan')
    .insert({
      dilakukan_oleh: payload.dilakukanOleh,
      jumlah_kayu: payload.jumlahKayu,
      jumlah_kriteria: payload.kriteria.length,
      total_bobot: payload.totalBobot,
      kriteria_snapshot: payload.kriteria,
      hasil: payload.hasil,
      kayu_terbaik_kode: terbaik?.kode ?? null,
      kayu_terbaik_nama: terbaik?.nama ?? null,
      vi_terbaik: terbaik?.vi ?? null,
    })
    .select('*')
    .single()

  if (error) throw error
  return mapRiwayatRow(data as RiwayatRow)
}

/** Hapus satu entri riwayat */
export async function hapusRiwayatPerhitungan(id: string): Promise<void> {
  const { error } = await supabase.from('riwayat_perhitungan').delete().eq('id', id)
  if (error) throw error
}