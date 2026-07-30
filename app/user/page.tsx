// app/user/page.tsx
// Halaman user setelah login: Rekomendasi SAW + Form Pesan Kayu
'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { calculateSAW, getMatchPercentage, getMatchLabel } from '@/lib/saw'
import type { Kayu, Kriteria, HasilSAW } from '@/lib/saw'
import Link from 'next/link'

// ── Types ──
interface KayuWithValues extends Kayu {
  deskripsi?: string
}

// ── Icons ──
const IconWood = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 2L3 9v11h6v-6h6v6h6V9z"/>
  </svg>
)
const IconChart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)
const IconBox = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
)
const IconHistory = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="12 8 12 12 14 14"/>
    <path d="M3.05 11a9 9 0 1 0 .5-4H1"/>
    <polyline points="1 3 1 7 5 7"/>
  </svg>
)
const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
  </svg>
)
const IconArrow = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
const IconSparkle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 2l1.9 5.3L19 9l-5.1 1.7L12 16l-1.9-5.3L5 9l5.1-1.7L12 2z"/>
  </svg>
)
const IconThumb = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/>
  </svg>
)
const IconSearch = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="7"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IconSearchOff = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="11" cy="11" r="7"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    <line x1="8" y1="8" x2="14" y2="14"/>
  </svg>
)

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  menunggu:    { label: 'Menunggu',    color: '#C8892A', bg: 'rgba(200,137,42,0.10)', border: 'rgba(200,137,42,0.25)' },
  dikonfirmasi:{ label: 'Dikonfirmasi',color: '#2980B9', bg: 'rgba(41,128,185,0.10)', border: 'rgba(41,128,185,0.25)' },
  selesai:     { label: 'Selesai',     color: '#27AE60', bg: 'rgba(39,174,96,0.10)',  border: 'rgba(39,174,96,0.25)'  },
  dibatalkan:  { label: 'Dibatalkan',  color: '#E74C3C', bg: 'rgba(231,76,60,0.10)',  border: 'rgba(231,76,60,0.25)'  },
}

// Tampilan label ramah pengguna berdasarkan "tone" dari getMatchLabel
const TONE_STYLE: Record<string, { color: string; bg: string; border: string; icon: 'sparkle' | 'thumb' }> = {
  best:  { color: '#1E8449', bg: 'rgba(39,174,96,.10)',  border: 'rgba(39,174,96,.28)',  icon: 'sparkle' },
  great: { color: '#2980B9', bg: 'rgba(41,128,185,.10)', border: 'rgba(41,128,185,.28)', icon: 'thumb' },
  good:  { color: '#7C4A2D', bg: 'rgba(124,74,45,.08)',  border: 'rgba(124,74,45,.22)',  icon: 'thumb' },
  fair:  { color: '#8A6D3B', bg: 'rgba(138,109,59,.08)', border: 'rgba(138,109,59,.22)', icon: 'thumb' },
}

// ── Kamus kebutuhan → kriteria ──
// Memetakan kata kunci sehari-hari (yang mungkin diketik pelanggan) ke kriteria
// yang relevan di database, supaya pelanggan tidak perlu tahu istilah teknis
// seperti "C1", "bobot", atau "atribut cost/benefit".
const NEED_SYNONYMS: { keywords: string[]; matches: string[] }[] = [
  { keywords: ['murah', 'harga', 'terjangkau', 'ekonomis', 'hemat', 'biaya', 'budget'], matches: ['harga', 'biaya'] },
  { keywords: ['kuat', 'kokoh', 'kekuatan', 'beban', 'struktur', 'konstruksi'], matches: ['kekuat', 'kuat'] },
  { keywords: ['awet', 'tahan lama', 'tahan air', 'tahan rayap', 'ketahanan', 'durable', 'anti rayap'], matches: ['awet', 'ketahanan', 'tahan'] },
  { keywords: ['stok', 'tersedia', 'ready', 'ketersediaan', 'ada barang'], matches: ['stok', 'tersedia', 'ketersediaan'] },
  { keywords: ['estetika', 'serat', 'corak', 'cantik', 'indah', 'tampilan', 'motif'], matches: ['estetika', 'serat', 'corak'] },
  { keywords: ['ringan', 'berat', 'densitas', 'berat jenis'], matches: ['berat jenis', 'densitas'] },
  { keywords: ['laris', 'diminati', 'favorit', 'permintaan', 'populer', 'banyak dicari'], matches: ['permintaan', 'diminati', 'populer'] },
  { keywords: ['mudah dikerjakan', 'pengerjaan', 'olah', 'gergaji'], matches: ['pengerjaan', 'olah'] },
  { keywords: ['lantai', 'flooring'], matches: ['kekuat', 'awet', 'ketahanan'] },
  { keywords: ['outdoor', 'luar ruangan', 'kena hujan'], matches: ['awet', 'ketahanan', 'tahan'] },
]

/** Cari kriteria yang paling relevan dengan kata kunci kebutuhan yang diketik pengguna. */
function findKriteriaMatch(daftarKriteria: Kriteria[], query: string): Kriteria | null {
  const q = query.toLowerCase().trim()
  if (!q) return null

  // 1) Cocokkan langsung ke nama kriteria di database
  const direct = daftarKriteria.find(k => k.nama.toLowerCase().includes(q) || q.includes(k.nama.toLowerCase()))
  if (direct) return direct

  // 2) Cocokkan lewat kamus sinonim kebutuhan sehari-hari
  for (const group of NEED_SYNONYMS) {
    const isMatch = group.keywords.some(kw => q.includes(kw) || kw.includes(q))
    if (!isMatch) continue
    const found = daftarKriteria.find(k => group.matches.some(m => k.nama.toLowerCase().includes(m)))
    if (found) return found
  }
  return null
}

type ActiveTab = 'rekomendasi' | 'pesan' | 'riwayat'

export default function UserPage() {
  const router = useRouter()
  const [user, setUser] = useState<import('@supabase/supabase-js').User | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>('rekomendasi')

  // SAW data
  const [daftarKayu, setDaftarKayu] = useState<KayuWithValues[]>([])
  const [daftarKriteria, setDaftarKriteria] = useState<Kriteria[]>([])
  const [hasilSAW, setHasilSAW] = useState<HasilSAW[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  // Form pesan
  const [formKayuId, setFormKayuId] = useState('')
  const [formVolume, setFormVolume] = useState('')
  const [formCatatan, setFormCatatan] = useState('')
  const [formNama, setFormNama] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formSuccess, setFormSuccess] = useState(false)
  const [formError, setFormError] = useState('')

  // Riwayat pesanan
  const [riwayat, setRiwayat] = useState<Array<{
    id: string; status: string; nama_pemesan: string; volume_m3: number | null;
    catatan: string | null; created_at: string; kayu?: { nama: string; kode: string } | null
  }>>([])
  const [riwayatLoading, setRiwayatLoading] = useState(false)

  // Info "kenapa direkomendasikan" expand (ganti dari showDetail bobot)
  const [showInfo, setShowInfo] = useState(false)

  // Pencarian kayu / kebutuhan (mis. "murah", "tahan air", "meranti")
  const [searchQuery, setSearchQuery] = useState('')

  // ── Auth guard ──
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setUser(user)
      // Pre-fill nama from user metadata
      setFormNama(user.user_metadata?.full_name || user.email?.split('@')[0] || '')
      setLoading(false)
    }
    check()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === 'SIGNED_OUT' || !s) router.replace('/login')
    })
    return () => subscription.unsubscribe()
  }, [router])

  // ── Load SAW data ──
  const loadData = useCallback(async () => {
    setDataLoading(true)
    try {
      const [{ data: kayuData }, { data: kriteriaData }] = await Promise.all([
        supabase.from('kayu').select('*').order('kode'),
        supabase.from('kriteria').select('*').order('urutan'),
      ])

      // Fetch nilai_kayu
      const { data: nilaiData } = await supabase.from('nilai_kayu').select('*')

      // Map ke format Kayu dengan nilai
      const kayuWithValues: KayuWithValues[] = (kayuData ?? []).map(k => ({
        ...k,
        nilai: (nilaiData ?? [])
          .filter(n => n.kayu_id === k.id)
          .reduce((acc: Record<string, number>, n) => { acc[n.kriteria_id] = n.nilai; return acc }, {}),
      }))

      setDaftarKayu(kayuWithValues)
      setDaftarKriteria(kriteriaData ?? [])
      setHasilSAW(calculateSAW(kayuWithValues as Kayu[], kriteriaData ?? []))
    } catch (err) {
      console.error(err)
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!loading) loadData()
  }, [loading, loadData])

  // ── Load riwayat pesanan ──
  const loadRiwayat = useCallback(async () => {
    if (!user) return
    setRiwayatLoading(true)
    const { data } = await supabase
      .from('pesanan')
      .select('*, kayu:kayu_id(nama, kode)')
      .eq('nama_pemesan', formNama || user.email?.split('@')[0] || '')
      .order('created_at', { ascending: false })
      .limit(20)
    setRiwayat(data ?? [])
    setRiwayatLoading(false)
  }, [user, formNama])

  useEffect(() => {
    if (activeTab === 'riwayat') loadRiwayat()
  }, [activeTab, loadRiwayat])

  // ── Submit pesanan ──
  const handlePesan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formKayuId) { setFormError('Pilih jenis kayu terlebih dahulu.'); return }
    if (!formNama.trim()) { setFormError('Nama pemesan tidak boleh kosong.'); return }
    setFormError('')
    setFormLoading(true)
    try {
      const { error } = await supabase.from('pesanan').insert({
        kayu_id: formKayuId,
        volume_m3: formVolume ? parseFloat(formVolume) : null,
        catatan: formCatatan.trim() || null,
        nama_pemesan: formNama.trim(),
        status: 'menunggu',
      })
      if (error) throw error
      setFormSuccess(true)
      setFormKayuId('')
      setFormVolume('')
      setFormCatatan('')
      setTimeout(() => setFormSuccess(false), 5000)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Gagal mengirim pesanan. Coba lagi.')
    } finally {
      setFormLoading(false)
    }
  }

  // Pre-select kayu from rekomendasi
  const handlePesanFromRek = (kayuId: string) => {
    setFormKayuId(kayuId)
    setActiveTab('pesan')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const formatTanggal = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const rekTerbaik = hasilSAW[0] ?? null
  const viTerbaik = rekTerbaik?.vi ?? 0

  // ── Hasil pencarian: berdasarkan nama kayu ATAU kebutuhan (kriteria) ──
  type DisplayItem = { kayuId: string; kode: string; nama: string; rank: number; persen: number }
  const searchResult = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    if (!q) {
      const items: DisplayItem[] = hasilSAW.map(h => ({
        kayuId: h.kayuId, kode: h.kode, nama: h.nama, rank: h.rank,
        persen: getMatchPercentage(h.vi, viTerbaik),
      }))
      return { mode: 'all' as const, items, kriteria: null as Kriteria | null }
    }

    // Cocokkan ke nama / kode / deskripsi kayu
    const woodMatches = daftarKayu.filter(k =>
      k.nama.toLowerCase().includes(q) ||
      k.kode.toLowerCase().includes(q) ||
      (k.deskripsi ?? '').toLowerCase().includes(q)
    )
    if (woodMatches.length > 0) {
      const items: DisplayItem[] = hasilSAW
        .filter(h => woodMatches.some(w => w.id === h.kayuId))
        .map(h => ({
          kayuId: h.kayuId, kode: h.kode, nama: h.nama, rank: h.rank,
          persen: getMatchPercentage(h.vi, viTerbaik),
        }))
      return { mode: 'wood' as const, items, kriteria: null as Kriteria | null }
    }

    // Cocokkan ke kebutuhan (kriteria) — mis. "murah", "tahan air", "kuat"
    const kriteriaMatch = findKriteriaMatch(daftarKriteria, q)
    if (kriteriaMatch) {
      const items: DisplayItem[] = hasilSAW
        .map(h => ({ h, val: h.nilaiNormal[kriteriaMatch.id] ?? 0 }))
        .sort((a, b) => b.val - a.val)
        .map(({ h, val }, i) => ({
          kayuId: h.kayuId, kode: h.kode, nama: h.nama, rank: i + 1,
          persen: Math.round(val * 100),
        }))
      return { mode: 'criteria' as const, items, kriteria: kriteriaMatch }
    }

    return { mode: 'none' as const, items: [] as DisplayItem[], kriteria: null as Kriteria | null }
  }, [searchQuery, hasilSAW, daftarKayu, daftarKriteria, viTerbaik])

  // ── Wood colors ──
  const WOOD_COLORS: Record<string, string> = {
    meranti: '#A0714F', merbau: '#6B3A2A', ulin: '#3D2010',
  }
  const getWoodColor = (nama: string) => {
    const n = nama.toLowerCase()
    if (n.includes('meranti')) return WOOD_COLORS.meranti
    if (n.includes('merbau')) return WOOD_COLORS.merbau
    if (n.includes('ulin') || n.includes('besi')) return WOOD_COLORS.ulin
    return '#7C4A2D'
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF6EF' }}>
        <div style={{ width: 36, height: 36, border: '2px solid rgba(61,43,31,.1)', borderTopColor: '#C8892A', borderRadius: '50%', animation: 'spin .8s linear infinite' }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400&family=Lato:wght@300;400;700&display=swap');

        :root {
          --cream:#FAF6EF; --light:#F5EEE3; --bark:#3D2B1F; --wood:#7C4A2D; --honey:#C8892A; --sand:#E8D5B7;
          --border:rgba(61,43,31,.08); --border2:rgba(61,43,31,.14); --text2:rgba(61,43,31,.52); --text3:rgba(61,43,31,.32);
        }
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Lato',sans-serif;background:var(--cream);color:var(--bark);overflow-x:hidden;}

        /* ── TOPBAR ── */
        .nav{position:sticky;top:0;z-index:100;height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 5%;background:rgba(250,246,239,.94);backdrop-filter:blur(14px);border-bottom:1px solid var(--border);}
        .nav-brand{display:flex;align-items:center;gap:10px;text-decoration:none;}
        .nav-mark{width:34px;height:34px;background:var(--bark);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .nav-mark svg{width:16px;height:16px;color:var(--honey);}
        .nav-name{font-family:'Playfair Display',serif;font-size:14px;font-weight:700;color:var(--bark);}
        .nav-sub{font-size:9px;color:var(--wood);letter-spacing:1.8px;text-transform:uppercase;margin-top:1px;display:block;}
        .nav-right{display:flex;align-items:center;gap:14px;}
        .nav-user{font-size:12px;color:var(--text2);}
        .nav-user strong{color:var(--bark);}
        .nav-home{font-size:11px;color:var(--text2);text-decoration:none;transition:color .2s;}
        .nav-home:hover{color:var(--bark);}
        .btn-out{display:flex;align-items:center;gap:6px;background:none;border:1px solid var(--border2);color:var(--text2);font-family:'Lato',sans-serif;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:7px 13px;cursor:pointer;transition:all .2s;}
        .btn-out:hover:not(:disabled){border-color:rgba(192,57,43,.3);color:rgba(192,57,43,.8);}
        .btn-out:disabled{opacity:.4;cursor:not-allowed;}

        /* ── HERO ── */
        .hero{padding:52px 5% 40px;background:var(--bark);position:relative;overflow:hidden;}
        .hero-glow{position:absolute;top:-80px;right:-80px;width:400px;height:400px;background:radial-gradient(circle,rgba(200,137,42,.08) 0%,transparent 70%);pointer-events:none;}
        .hero-grid{position:absolute;inset:0;pointer-events:none;background-image:repeating-linear-gradient(90deg,transparent,transparent 79px,rgba(255,255,255,.015) 79px,rgba(255,255,255,.015) 80px);}
        .hero-inner{position:relative;z-index:2;max-width:700px;}
        .hero-eyebrow{font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--honey);margin-bottom:10px;display:flex;align-items:center;gap:8px;}
        .hero-eyebrow::before{content:'';display:block;width:18px;height:1px;background:var(--honey);}
        .hero-title{font-family:'Playfair Display',serif;font-size:clamp(26px,4vw,42px);color:#FAF6EF;line-height:1.1;margin-bottom:10px;}
        .hero-title em{font-style:italic;color:var(--honey);}
        .hero-desc{font-size:13.5px;font-weight:300;color:rgba(250,246,239,.45);line-height:1.75;max-width:500px;}

        /* ── TAB NAV ── */
        .tab-nav{display:flex;background:var(--bark);border-bottom:1px solid rgba(255,255,255,.04);padding:0 5%;}
        .tab-btn{display:flex;align-items:center;gap:8px;padding:14px 20px;font-family:'Lato',sans-serif;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:rgba(250,246,239,.35);background:none;border:none;border-bottom:2px solid transparent;cursor:pointer;transition:all .2s;margin-bottom:-1px;}
        .tab-btn:hover{color:rgba(250,246,239,.7);}
        .tab-btn.active{color:#FAF6EF;border-bottom-color:var(--honey);}
        .tab-btn svg{opacity:.6;}
        .tab-btn.active svg{opacity:1;color:var(--honey);}

        /* ── CONTENT ── */
        .page-content{padding:40px 5% 80px;max-width:1100px;margin:0 auto;}

        /* ── REKOMENDASI ── */
        .rek-header{margin-bottom:28px;}
        .section-eyebrow{font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--honey);margin-bottom:8px;display:flex;align-items:center;gap:8px;}
        .section-eyebrow::before{content:'';display:block;width:16px;height:1px;background:var(--honey);}
        .section-title{font-family:'Playfair Display',serif;font-size:clamp(22px,3.5vw,32px);color:var(--bark);margin-bottom:8px;}
        .section-desc{font-size:13px;font-weight:300;color:var(--text2);line-height:1.7;max-width:520px;}

        /* Search bar & chip kebutuhan */
        .search-wrap{margin-bottom:22px;}
        .search-box{display:flex;align-items:center;gap:10px;background:white;border:1px solid var(--border2);padding:13px 16px;transition:all .2s;}
        .search-box:focus-within{border-color:var(--honey);box-shadow:0 4px 16px rgba(61,43,31,.06);}
        .search-box svg{color:var(--text3);flex-shrink:0;}
        .search-input{flex:1;border:none;outline:none;background:none;font-family:'Lato',sans-serif;font-size:14px;font-weight:300;color:var(--bark);}
        .search-input::placeholder{color:var(--text3);}
        .search-clear{background:none;border:none;color:var(--text3);cursor:pointer;display:flex;align-items:center;padding:2px;transition:color .2s;}
        .search-clear:hover{color:var(--bark);}
        .chip-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;}
        .chip{background:white;border:1px solid var(--border2);color:var(--text2);font-family:'Lato',sans-serif;font-size:11.5px;font-weight:400;padding:7px 14px;cursor:pointer;transition:all .2s;}
        .chip:hover{border-color:rgba(200,137,42,.4);color:var(--bark);}
        .chip.active{background:var(--bark);border-color:var(--bark);color:var(--cream);}
        .search-status{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;background:rgba(200,137,42,.06);border:1px solid rgba(200,137,42,.18);padding:12px 18px;margin-bottom:20px;font-size:13px;color:var(--text2);}
        .search-status strong{color:var(--bark);}
        .search-reset{background:none;border:none;color:var(--honey);font-size:12px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;cursor:pointer;white-space:nowrap;}
        .search-reset:hover{text-decoration:underline;}
        .search-empty{padding:56px 20px;text-align:center;background:white;border:1px solid var(--border);margin-bottom:32px;}
        .search-empty svg{color:var(--text3);margin-bottom:14px;}
        .search-empty-title{font-family:'Playfair Display',serif;font-size:18px;color:var(--text2);margin-bottom:6px;}
        .search-empty-desc{font-size:13px;font-weight:300;color:var(--text3);max-width:360px;margin:0 auto;line-height:1.6;}

        /* Ranking cards */
        .rek-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:2px;margin-bottom:32px;}
        .rek-card{background:white;border:1px solid var(--border);position:relative;overflow:hidden;transition:all .3s;}
        .rek-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;opacity:0;transition:opacity .3s;}
        .rek-card:hover{box-shadow:0 8px 32px rgba(61,43,31,.1);transform:translateY(-3px);}
        .rek-card:hover::before{opacity:1;}
        .rek-card.first{border-top:2px solid var(--honey);}
        .rek-card.first::before{display:none;}
        .rek-card-top{padding:24px 24px 16px;display:flex;align-items:flex-start;gap:14px;}
        .wood-swatch{width:48px;height:48px;flex-shrink:0;border-radius:50%;border:3px solid rgba(255,255,255,.4);position:relative;}
        .wood-swatch::after{content:'';position:absolute;inset:3px;border-radius:50%;border:1px solid rgba(255,255,255,.3);}
        .rank-badge{position:absolute;bottom:-4px;right:-4px;width:20px;height:20px;border-radius:50%;background:var(--honey);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:white;font-family:'Lato',sans-serif;border:2px solid white;}
        .rek-card-info{}
        .rek-card-rank{font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--honey);margin-bottom:3px;}
        .rek-card-name{font-family:'Playfair Display',serif;font-size:19px;color:var(--bark);margin-bottom:2px;}
        .rek-card-code{font-size:11px;color:var(--text3);}

        /* Match (kecocokan) — pengganti tampilan Vi/bobot mentah */
        .match-section{padding:0 24px 16px;}
        .match-label{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:6px;}
        .match-row{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
        .match-bar{flex:1;height:6px;background:rgba(61,43,31,.06);border-radius:4px;overflow:hidden;}
        .match-fill{height:100%;border-radius:4px;transition:width .6s ease;}
        .match-num{font-size:13px;font-weight:700;color:var(--bark);font-family:'Lato',sans-serif;min-width:42px;text-align:right;}
        .match-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;font-size:10.5px;font-weight:700;letter-spacing:.4px;border:1px solid;}

        .rek-card-foot{padding:14px 24px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;}
        .btn-pesan-rek{display:flex;align-items:center;gap:6px;background:var(--bark);color:var(--cream);border:none;font-family:'Lato',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;padding:9px 14px;cursor:pointer;transition:all .2s;}
        .btn-pesan-rek:hover{background:var(--wood);transform:translateY(-1px);}

        /* Info "kenapa direkomendasikan" — bahasa awam, tanpa angka bobot */
        .info-toggle{display:flex;align-items:center;gap:8px;background:none;border:1px solid var(--border2);color:var(--text2);font-family:'Lato',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:9px 16px;cursor:pointer;transition:all .2s;margin-bottom:16px;}
        .info-toggle:hover{color:var(--bark);border-color:rgba(61,43,31,.25);}
        .info-panel{background:white;border:1px solid var(--border);padding:24px;}
        .info-panel p{font-size:13.5px;font-weight:300;color:var(--text2);line-height:1.75;margin-bottom:14px;}
        .info-panel p:last-child{margin-bottom:0;}
        .aspek-pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;}
        .aspek-pill{font-size:11.5px;color:var(--wood);background:rgba(124,74,45,.06);border:1px solid rgba(124,74,45,.16);padding:6px 12px;font-weight:400;}

        /* ── FORM PESAN ── */
        .form-wrap{max-width:600px;}
        .form-card{background:white;border:1px solid var(--border);padding:32px;}
        .fg{margin-bottom:22px;}
        .flbl{display:block;font-size:10px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:var(--text3);margin-bottom:8px;}
        .finput,.fselect,.ftextarea{width:100%;background:white;border:1px solid var(--border2);border-bottom:2px solid rgba(61,43,31,.14);color:var(--bark);font-family:'Lato',sans-serif;font-size:14px;font-weight:300;padding:13px 15px;outline:none;transition:all .25s;-webkit-appearance:none;resize:vertical;}
        .finput::placeholder,.ftextarea::placeholder{color:var(--text3);}
        .finput:focus,.fselect:focus,.ftextarea:focus{border-bottom-color:var(--honey);box-shadow:0 4px 14px rgba(61,43,31,.06);}
        .fselect{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%233D2B1F' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:40px;cursor:pointer;}
        .ftextarea{min-height:90px;}
        .form-hint{font-size:11.5px;font-weight:300;color:var(--text3);margin-top:6px;display:flex;align-items:flex-start;gap:6px;}
        .form-hint svg{flex-shrink:0;margin-top:1px;}

        /* Kayu preview when selected */
        .kayu-preview{display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(61,43,31,.03);border:1px solid var(--border);margin-top:10px;}
        .kp-swatch{width:28px;height:28px;border-radius:50%;flex-shrink:0;}
        .kp-name{font-size:13px;font-weight:400;color:var(--bark);}
        .kp-rank{font-size:10px;color:var(--honey);font-weight:700;letter-spacing:1px;text-transform:uppercase;}

        .btn-submit{width:100%;background:var(--bark);color:var(--cream);font-family:'Lato',sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:16px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .25s;margin-top:8px;}
        .btn-submit:hover:not(:disabled){background:var(--wood);transform:translateY(-1px);box-shadow:0 8px 24px rgba(61,43,31,.2);}
        .btn-submit:disabled{opacity:.5;cursor:not-allowed;}

        .success-box{display:flex;align-items:flex-start;gap:12px;background:rgba(39,174,96,.06);border:1px solid rgba(39,174,96,.2);padding:16px;margin-bottom:24px;animation:fadeIn .3s ease;}
        .success-box svg{flex-shrink:0;color:#27AE60;margin-top:2px;}
        .success-title{font-size:14px;font-weight:700;color:#1E8449;margin-bottom:4px;}
        .success-desc{font-size:12.5px;font-weight:300;color:rgba(30,132,73,.8);line-height:1.5;}
        .err-box{display:flex;align-items:flex-start;gap:10px;background:rgba(192,57,43,.05);border:1px solid rgba(192,57,43,.18);padding:13px;margin-bottom:18px;}
        .err-box svg{flex-shrink:0;color:#C0392B;margin-top:1px;}
        .err-txt{font-size:12.5px;color:rgba(192,57,43,.85);line-height:1.5;}

        @keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}

        /* ── RIWAYAT ── */
        .riwayat-empty{padding:48px 20px;text-align:center;color:var(--text3);}
        .riwayat-icon{width:48px;height:48px;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;}
        .riwayat-title{font-family:'Playfair Display',serif;font-size:18px;color:var(--text2);margin-bottom:6px;}
        .riwayat-list{display:flex;flex-direction:column;gap:2px;}
        .riwayat-item{background:white;border:1px solid var(--border);padding:20px 24px;display:flex;align-items:center;gap:20px;flex-wrap:wrap;transition:box-shadow .2s;}
        .riwayat-item:hover{box-shadow:0 4px 16px rgba(61,43,31,.07);}
        .ri-left{flex:1;min-width:0;}
        .ri-kayu{font-size:15px;font-weight:400;color:var(--bark);font-family:'Playfair Display',serif;margin-bottom:4px;}
        .ri-date{font-size:11.5px;color:var(--text3);}
        .ri-vol{font-size:13px;color:var(--text2);}
        .status-pill{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;border:1px solid;}
        .status-dot{width:5px;height:5px;border-radius:50%;}

        .spin{width:13px;height:13px;border:1.5px solid rgba(255,255,255,.3);border-top-color:var(--cream);border-radius:50%;animation:spinR .7s linear infinite;display:inline-block;}
        @keyframes spinR{to{transform:rotate(360deg)}}

        /* Loading skeleton */
        .skeleton{background:linear-gradient(90deg,rgba(61,43,31,.04) 25%,rgba(61,43,31,.08) 50%,rgba(61,43,31,.04) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:2px;}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

        @media(max-width:600px){
          .page-content{padding:28px 4% 60px;}
          .form-card{padding:24px;}
          .nav-user{display:none;}
        }
      `}</style>

      {/* TOPBAR */}
      <nav className="nav">
        <Link href="/user" className="nav-brand">
          <div className="nav-mark" style={{ borderRadius: 6, overflow: 'hidden', background: 'transparent' }}>
            <img src="/logo.png" alt="Logo Beuna Jaya Kayu" style={{ width: 28, height: 28, objectFit: 'contain', display: 'block' }} />
          </div>
          <div>
            <span className="nav-name">Beuna Jaya Kayu</span>
            <span className="nav-sub">Rekomendasi Kayu</span>
          </div>
        </Link>
        <div className="nav-right">
          <span className="nav-user">Halo, <strong>{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</strong></span>
          <Link href="/" className="nav-home">Beranda</Link>
          <button className="btn-out" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? <span className="spin" style={{ borderTopColor: 'var(--text2)' }}/> : <IconLogout/>}
            Keluar
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div className="hero">
        <div className="hero-glow"/>
        <div className="hero-grid"/>
        <div className="hero-inner">
          <div className="hero-eyebrow">Rekomendasi untuk Anda</div>
          <h1 className="hero-title">
            Temukan Kayu <em>Terbaik</em><br/>untuk Kebutuhan Anda
          </h1>
          <p className="hero-desc">
            Sistem kami membandingkan setiap jenis kayu dari beberapa aspek penting —
            seperti harga, kekuatan, ketahanan, dan stok — lalu menyusunnya menjadi
            rekomendasi yang mudah Anda pahami.
          </p>
        </div>
      </div>

      {/* TAB NAV */}
      <div className="tab-nav">
        {[
          { id: 'rekomendasi', label: 'Rekomendasi', icon: <IconChart/> },
          { id: 'pesan',       label: 'Pesan Kayu',      icon: <IconBox/> },
          { id: 'riwayat',     label: 'Riwayat Pesanan', icon: <IconHistory/> },
        ].map(t => (
          <button key={t.id} className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id as ActiveTab)}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div className="page-content">

        {/* ── TAB: REKOMENDASI ── */}
        {activeTab === 'rekomendasi' && (
          <div>
            <div className="rek-header">
              <div className="section-eyebrow">Hasil Rekomendasi</div>
              <h2 className="section-title">Kayu yang Cocok untuk Anda</h2>
              <p className="section-desc">
                Ketik nama kayu atau kebutuhan Anda di kolom pencarian — misalnya &quot;murah&quot;,
                &quot;tahan air&quot;, atau &quot;kuat&quot; — dan sistem akan menampilkan kayu paling cocok untuk itu.
              </p>
            </div>

            {/* Search bar + chip kebutuhan cepat */}
            <div className="search-wrap">
              <div className="search-box">
                <IconSearch/>
                <input
                  className="search-input"
                  type="text"
                  placeholder='Cari kayu atau kebutuhan… misal "tahan air", "murah", "meranti"'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="search-clear" onClick={() => setSearchQuery('')} aria-label="Hapus pencarian">
                    <IconClose/>
                  </button>
                )}
              </div>
              {daftarKriteria.length > 0 && (
                <div className="chip-row">
                  {daftarKriteria.map(k => (
                    <button
                      key={k.id}
                      className={`chip${searchResult.kriteria?.id === k.id ? ' active' : ''}`}
                      onClick={() => setSearchQuery(prev => prev === k.nama ? '' : k.nama)}
                    >
                      {k.nama}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status pencarian */}
            {searchQuery.trim() !== '' && (
              <div className="search-status">
                {searchResult.mode === 'wood' && (
                  <span>Menampilkan hasil pencarian untuk &quot;<strong>{searchQuery}</strong>&quot;.</span>
                )}
                {searchResult.mode === 'criteria' && searchResult.kriteria && (
                  <span>Menampilkan kayu terbaik untuk kebutuhan: <strong>{searchResult.kriteria.nama}</strong></span>
                )}
                {searchResult.mode === 'none' && (
                  <span>Tidak ditemukan hasil untuk &quot;<strong>{searchQuery}</strong>&quot;.</span>
                )}
                <button className="search-reset" onClick={() => setSearchQuery('')}>Tampilkan Semua Rekomendasi</button>
              </div>
            )}

            {dataLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 140, width: '100%' }}/>)}
              </div>
            ) : hasilSAW.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center', background: 'white', border: '1px solid var(--border)', marginBottom: 32 }}>
                <p style={{ color: 'var(--text2)', fontSize: 14 }}>Belum ada data kayu & kriteria. Hubungi admin.</p>
              </div>
            ) : searchResult.mode === 'none' ? (
              <div className="search-empty">
                <IconSearchOff/>
                <div className="search-empty-title">Belum Ketemu</div>
                <p className="search-empty-desc">
                  Coba gunakan kata kunci lain, atau pilih salah satu kebutuhan di atas
                  seperti &quot;{daftarKriteria[0]?.nama ?? 'Harga'}&quot; untuk melihat rekomendasinya.
                </p>
              </div>
            ) : (
              <div className="rek-grid">
                {searchResult.items.map(h => {
                  const color = getWoodColor(h.nama)
                  const isFirst = h.rank === 1
                  const kayuObj = daftarKayu.find(k => k.id === h.kayuId)
                  const persen = h.persen
                  const match = getMatchLabel(h.rank, persen)
                  const toneStyle = TONE_STYLE[match.tone]
                  return (
                    <div className={`rek-card${isFirst ? ' first' : ''}`} key={h.kayuId}
                      style={{ '--accent': color } as React.CSSProperties}>
                      <style>{`.rek-card:hover::before{background:linear-gradient(90deg,${color},transparent)}`}</style>
                      <div className="rek-card-top">
                        <div className="wood-swatch" style={{ background: color }}>
                          <span className="rank-badge">{h.rank}</span>
                        </div>
                        <div className="rek-card-info">
                          <div className="rek-card-rank">
                            {isFirst ? '★ Rekomendasi Terbaik' : `Peringkat ${h.rank}`}
                          </div>
                          <div className="rek-card-name">{h.nama}</div>
                          <div className="rek-card-code">{h.kode}</div>
                        </div>
                      </div>
                      <div className="match-section">
                        <div className="match-label">
                          {searchResult.mode === 'criteria' && searchResult.kriteria
                            ? `Kecocokan untuk ${searchResult.kriteria.nama}`
                            : 'Tingkat Kecocokan'}
                        </div>
                        <div className="match-row">
                          <div className="match-bar">
                            <div className="match-fill" style={{ width: `${persen}%`, background: color }}/>
                          </div>
                          <span className="match-num">{persen}%</span>
                        </div>
                        <span className="match-chip" style={{ color: toneStyle.color, background: toneStyle.bg, borderColor: toneStyle.border }}>
                          {toneStyle.icon === 'sparkle' ? <IconSparkle/> : <IconThumb/>}
                          {match.label}
                        </span>
                      </div>
                      <div className="rek-card-foot">
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>&nbsp;</span>
                        {kayuObj && (
                          <button className="btn-pesan-rek" onClick={() => handlePesanFromRek(kayuObj.id)}>
                            Pesan <IconArrow/>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Kenapa direkomendasikan — bahasa awam, tanpa angka bobot/Vi */}
            <div>
              <button className="info-toggle" onClick={() => setShowInfo(!showInfo)}>
                <IconInfo/>
                {showInfo ? 'Sembunyikan' : 'Lihat'} Alasan Rekomendasi Ini
              </button>
              {showInfo && (
                <div className="info-panel">
                  <p>
                    Rekomendasi di atas dihitung dengan mempertimbangkan beberapa aspek penting dari
                    setiap jenis kayu secara bersamaan, bukan hanya salah satu faktor saja — sehingga
                    hasilnya lebih adil dan objektif dibanding memilih berdasarkan satu pertimbangan saja.
                  </p>
                  <p style={{ marginBottom: 6 }}>Aspek yang dipertimbangkan sistem antara lain:</p>
                  <div className="aspek-pills">
                    {daftarKriteria.length > 0
                      ? daftarKriteria.map(k => (
                          <span className="aspek-pill" key={k.id}>{k.nama}</span>
                        ))
                      : ['Harga', 'Kekuatan', 'Ketahanan', 'Stok', 'Berat Jenis', 'Permintaan Pasar', 'Estetika Serat'].map(n => (
                          <span className="aspek-pill" key={n}>{n}</span>
                        ))
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB: PESAN KAYU ── */}
        {activeTab === 'pesan' && (
          <div className="form-wrap">
            <div style={{ marginBottom: 28 }}>
              <div className="section-eyebrow">Pemesanan</div>
              <h2 className="section-title">Pesan Kayu</h2>
              <p className="section-desc">Isi formulir di bawah ini. Admin akan mengkonfirmasi pesanan Anda segera.</p>
            </div>

            {formSuccess && (
              <div className="success-box">
                <IconCheck/>
                <div>
                  <div className="success-title">Pesanan Berhasil Dikirim!</div>
                  <div className="success-desc">Pesanan Anda sedang diproses. Admin akan segera mengkonfirmasi. Cek riwayat pesanan untuk memantau status.</div>
                </div>
              </div>
            )}
            {formError && (
              <div className="err-box">
                <IconInfo/>
                <span className="err-txt">{formError}</span>
              </div>
            )}

            <div className="form-card">
              <form onSubmit={handlePesan}>
                <div className="fg">
                  <label className="flbl">Nama Pemesan</label>
                  <input className="finput" type="text" placeholder="Nama lengkap Anda"
                    value={formNama} onChange={e => setFormNama(e.target.value)} required/>
                </div>

                <div className="fg">
                  <label className="flbl">Jenis Kayu</label>
                  <select className="fselect" value={formKayuId}
                    onChange={e => setFormKayuId(e.target.value)} required>
                    <option value="">— Pilih jenis kayu —</option>
                    {hasilSAW.map(h => {
                      const k = daftarKayu.find(k => k.id === h.kayuId)
                      return k ? (
                        <option key={k.id} value={k.id}>
                          {h.rank === 1 ? '★ ' : ''}{k.nama} ({k.kode}){h.rank === 1 ? ' — Rekomendasi Terbaik' : ''}
                        </option>
                      ) : null
                    })}
                  </select>
                  {formKayuId && (() => {
                    const k = daftarKayu.find(k => k.id === formKayuId)
                    const h = hasilSAW.find(h => h.kayuId === formKayuId)
                    const persen = h ? getMatchPercentage(h.vi, viTerbaik) : 0
                    const match = h ? getMatchLabel(h.rank, persen) : null
                    return k ? (
                      <div className="kayu-preview">
                        <div className="kp-swatch" style={{ background: getWoodColor(k.nama) }}/>
                        <div>
                          <div className="kp-name">{k.nama}</div>
                          {h && match && <div className="kp-rank">{match.label} · {persen}% Cocok</div>}
                        </div>
                      </div>
                    ) : null
                  })()}
                  <div className="form-hint">
                    <IconInfo/> Disarankan memilih kayu dengan tingkat kecocokan tertinggi dari rekomendasi sistem.
                  </div>
                </div>

                <div className="fg">
                  <label className="flbl">Volume (m³)</label>
                  <input className="finput" type="number" placeholder="Contoh: 2.5" min="0.01" step="0.01"
                    value={formVolume} onChange={e => setFormVolume(e.target.value)}/>
                  <div className="form-hint">
                    <IconInfo/> Opsional. Kosongkan jika belum tahu volume yang dibutuhkan.
                  </div>
                </div>

                <div className="fg">
                  <label className="flbl">Catatan / Keterangan</label>
                  <textarea className="ftextarea" placeholder="Kegunaan kayu, dimensi yang diinginkan, atau informasi tambahan lainnya..."
                    value={formCatatan} onChange={e => setFormCatatan(e.target.value)}/>
                </div>

                <button type="submit" className="btn-submit" disabled={formLoading}>
                  {formLoading ? <><span className="spin"/> Mengirim Pesanan...</> : <><IconBox/> Kirim Pesanan</>}
                </button>
              </form>
            </div>

            <div style={{ marginTop: 16, padding: '14px 18px', background: 'rgba(200,137,42,.05)', border: '1px solid rgba(200,137,42,.15)' }}>
              <p style={{ fontSize: 12.5, fontWeight: 300, color: 'var(--text2)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--bark)' }}>Alur Pemesanan:</strong>{' '}
                Kirim pesanan → Admin mengkonfirmasi → Status diperbarui → Kayu siap diambil atau dikirim.
                Pantau status pesanan di tab <strong style={{ color: 'var(--bark)' }}>Riwayat Pesanan</strong>.
              </p>
            </div>
          </div>
        )}

        {/* ── TAB: RIWAYAT ── */}
        {activeTab === 'riwayat' && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <div className="section-eyebrow">Riwayat</div>
              <h2 className="section-title">Pesanan Saya</h2>
              <p className="section-desc">Pantau status pesanan kayu yang telah Anda kirimkan.</p>
            </div>

            {riwayatLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80 }}/>)}
              </div>
            ) : riwayat.length === 0 ? (
              <div style={{ background: 'white', border: '1px solid var(--border)' }}>
                <div className="riwayat-empty">
                  <div className="riwayat-icon"><IconHistory/></div>
                  <div className="riwayat-title">Belum Ada Pesanan</div>
                  <p style={{ fontSize: 13, fontWeight: 300, color: 'var(--text3)' }}>
                    Anda belum memiliki riwayat pesanan. Mulai pesan kayu dari tab Rekomendasi atau Pesan Kayu.
                  </p>
                </div>
              </div>
            ) : (
              <div className="riwayat-list">
                {riwayat.map(r => {
                  const sc = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.menunggu
                  return (
                    <div className="riwayat-item" key={r.id}>
                      <div className="ri-left">
                        <div className="ri-kayu">{r.kayu?.nama ?? 'Kayu tidak ditemukan'}</div>
                        <div className="ri-date">{formatTanggal(r.created_at)}</div>
                        {r.volume_m3 && <div className="ri-vol" style={{ marginTop: 4 }}>{r.volume_m3} m³</div>}
                        {r.catatan && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4, fontStyle: 'italic' }}>"{r.catatan}"</div>}
                      </div>
                      <div>
                        <span className="status-pill" style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}>
                          <span className="status-dot" style={{ background: sc.color }}/>
                          {sc.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </>
  )
}