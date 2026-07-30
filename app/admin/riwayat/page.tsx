// app/admin/riwayat/page.tsx
'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { calculateSAW, totalBobot } from '@/lib/saw'
import type { HasilSAW } from '@/lib/saw'
import {
  fetchKayu,
  fetchKriteria,
  fetchRiwayatPerhitungan,
  simpanRiwayatPerhitungan,
  hapusRiwayatPerhitungan,
  type RiwayatPerhitungan,
} from '@/lib/supabase/queries'

// ── Icons ──
const IconWood = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 2L3 9v11h6v-6h6v6h6V9z"/>
  </svg>
)
const IconScale = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 3v18M5 7l-3 6a4 4 0 008 0l-3-6M19 7l-3 6a4 4 0 008 0l-3-6M5 7h14M9 21h6"/>
  </svg>
)
const IconBox = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
)
const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
  </svg>
)
const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)
const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconHistory = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>
  </svg>
)
const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
  </svg>
)
const IconPlay = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
)

export default function RiwayatPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [loggingOut, setLoggingOut] = useState<boolean>(false)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)

  const [riwayat, setRiwayat] = useState<RiwayatPerhitungan[]>([])
  const [dataLoading, setDataLoading] = useState<boolean>(true)
  const [dataError, setDataError] = useState<string | null>(null)

  const [menghitung, setMenghitung] = useState<boolean>(false)
  const [aksiError, setAksiError] = useState<string | null>(null)
  const [hapusId, setHapusId] = useState<string | null>(null)
  const [detail, setDetail] = useState<RiwayatPerhitungan | null>(null)

  // ── Auth guard ──
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
      } else {
        setUser(user)
        setLoading(false)
      }
    }
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) router.replace('/login')
    })

    return () => subscription.unsubscribe()
  }, [router])

  // ── Fetch riwayat ──
  const loadRiwayat = useCallback(async () => {
    setDataLoading(true)
    setDataError(null)
    try {
      const data = await fetchRiwayatPerhitungan()
      setRiwayat(data)
    } catch (err) {
      console.error(err)
      setDataError('Gagal memuat riwayat perhitungan. Periksa koneksi Supabase Anda.')
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!loading) loadRiwayat()
  }, [loading, loadRiwayat])

  // ── Realtime subscription ──
  useEffect(() => {
    const channel = supabase
      .channel('riwayat_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'riwayat_perhitungan' }, () => loadRiwayat())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadRiwayat])

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.replace('/login')
  }

  // ── Jalankan perhitungan SAW terkini & simpan sebagai riwayat baru ──
  const handleHitungDanSimpan = async () => {
    setMenghitung(true)
    setAksiError(null)
    try {
      const [kayu, kriteria] = await Promise.all([fetchKayu(), fetchKriteria()])

      if (kayu.length === 0 || kriteria.length === 0) {
        setAksiError('Data kayu atau kriteria masih kosong. Lengkapi terlebih dahulu sebelum menghitung.')
        return
      }

      const hasil: HasilSAW[] = calculateSAW(kayu, kriteria)
      const bobot = totalBobot(kriteria)

      await simpanRiwayatPerhitungan({
        dilakukanOleh: user?.email ?? null,
        jumlahKayu: kayu.length,
        kriteria,
        totalBobot: bobot,
        hasil,
      })

      await loadRiwayat()
    } catch (err) {
      console.error(err)
      setAksiError('Gagal menjalankan & menyimpan perhitungan. Silakan coba lagi.')
    } finally {
      setMenghitung(false)
    }
  }

  const confirmHapus = async () => {
    if (!hapusId) return
    try {
      await hapusRiwayatPerhitungan(hapusId)
      if (detail?.id === hapusId) setDetail(null)
      setRiwayat((prev) => prev.filter((r) => r.id !== hapusId))
    } catch (err) {
      console.error(err)
      setAksiError('Gagal menghapus riwayat.')
    } finally {
      setHapusId(null)
    }
  }

  const formatWaktu = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })

  const ringkasan = useMemo(() => {
    const total = riwayat.length
    const terakhir = riwayat[0] ?? null
    const rataRataKayu = total > 0
      ? Math.round(riwayat.reduce((sum, r) => sum + r.jumlahKayu, 0) / total)
      : 0
    return { total, terakhir, rataRataKayu }
  }, [riwayat])

  const navItems = [
    { id: 'dashboard', label: 'Dashboard',        href: '/admin/dashboard' },
    { id: 'kayu',      label: 'Jenis Kayu',       href: '/admin/kayu' },
    { id: 'kriteria',  label: 'Kriteria & Bobot', href: '/admin/kriteria' },
    { id: 'pesanan',   label: 'Pesanan',          href: '/admin/pesanan' },
    { id: 'riwayat',   label: 'Riwayat Perhitungan', href: '/admin/riwayat' },
  ]
  const navIcons: Record<string, React.ReactNode> = {
    dashboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    kayu: <IconWood/>,
    kriteria: <IconScale/>,
    pesanan: <IconBox/>,
    riwayat: <IconHistory/>,
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0E0A07', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '2px solid rgba(200,137,42,0.2)', borderTopColor: '#C8892A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ fontFamily: 'sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase' }}>Memuat...</p>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400&family=Lato:wght@300;400;700&display=swap');

        :root {
          --bg: #0E0A07; --surface: #16110D; --surface2: #1E1610;
          --border: rgba(255,255,255,0.05); --border2: rgba(255,255,255,0.08);
          --honey: #C8892A; --cream: #FAF6EF;
          --text: rgba(250,246,239,0.85); --text2: rgba(250,246,239,0.45); --text3: rgba(250,246,239,0.22);
          --sidebar-w: 240px;
        }
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Lato', sans-serif; background: var(--bg); color: var(--text); overflow-x: hidden; }

        .dash-wrap { display: flex; min-height: 100vh; }

        .sidebar { width: var(--sidebar-w); flex-shrink: 0; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; z-index: 200; transition: transform 0.3s ease; }
        @media (max-width: 900px) { .sidebar { transform: translateX(-100%); } .sidebar.open { transform: translateX(0); box-shadow: 8px 0 40px rgba(0,0,0,0.5); } }

        .sidebar-logo { padding: 28px 24px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .logo-mark { width: 32px; height: 32px; border: 1px solid rgba(200,137,42,0.4); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .logo-mark svg { width: 16px; height: 16px; color: var(--honey); }
        .logo-name { font-family: 'Playfair Display', serif; font-size: 13px; font-weight: 500; color: var(--cream); line-height: 1.2; }
        .logo-sub { font-size: 8.5px; color: var(--text3); letter-spacing: 1.8px; text-transform: uppercase; margin-top: 2px; display: block; }

        .sidebar-nav { flex: 1; padding: 16px 12px; overflow-y: auto; }
        .nav-section-label { font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--text3); padding: 0 12px; margin: 8px 0 6px; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; cursor: pointer; font-size: 13px; font-weight: 400; color: var(--text2); transition: all 0.2s; border: none; background: none; width: 100%; text-align: left; position: relative; text-decoration: none; }
        .nav-item::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 2px; height: 0; background: var(--honey); transition: height 0.2s; }
        .nav-item:hover { color: var(--cream); background: rgba(255,255,255,0.03); }
        .nav-item.active { color: var(--cream); background: rgba(200,137,42,0.08); }
        .nav-item.active::before { height: 60%; }
        .nav-item svg { flex-shrink: 0; opacity: 0.6; }
        .nav-item.active svg, .nav-item:hover svg { opacity: 1; color: var(--honey); }

        .sidebar-footer { padding: 16px 12px; border-top: 1px solid var(--border); }
        .user-card { display: flex; align-items: center; gap: 10px; padding: 10px 12px; margin-bottom: 8px; }
        .user-avatar { width: 32px; height: 32px; flex-shrink: 0; background: rgba(200,137,42,0.15); border: 1px solid rgba(200,137,42,0.25); display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 700; color: var(--honey); }
        .user-info { flex: 1; min-width: 0; }
        .user-name { font-size: 12px; font-weight: 400; color: var(--cream); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-role { font-size: 9.5px; color: var(--honey); letter-spacing: 1px; text-transform: uppercase; margin-top: 1px; }
        .btn-logout { display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 12px; background: none; border: 1px solid rgba(255,255,255,0.06); color: var(--text2); font-family: 'Lato', sans-serif; font-size: 11px; font-weight: 400; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
        .btn-logout:hover:not(:disabled) { background: rgba(192,57,43,0.08); border-color: rgba(192,57,43,0.25); color: rgba(220,80,60,0.9); }
        .btn-logout:disabled { opacity: 0.4; cursor: not-allowed; }

        .main { flex: 1; margin-left: var(--sidebar-w); display: flex; flex-direction: column; min-height: 100vh; }
        @media (max-width: 900px) { .main { margin-left: 0; } }

        .topbar { position: sticky; top: 0; z-index: 100; height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; background: rgba(14,10,7,0.88); backdrop-filter: blur(16px); border-bottom: 1px solid var(--border); }
        .topbar-left { display: flex; align-items: center; gap: 16px; }
        .menu-toggle { display: none; background: none; border: none; color: var(--text2); cursor: pointer; padding: 4px; transition: color 0.2s; }
        .menu-toggle:hover { color: var(--cream); }
        @media (max-width: 900px) { .menu-toggle { display: flex; align-items: center; } }
        .topbar-title { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 400; color: var(--cream); }

        .btn-primary { display: flex; align-items: center; gap: 8px; background: var(--honey); border: 1px solid var(--honey); color: #1A1207; padding: 9px 16px; font-family: 'Lato', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
        .btn-primary:hover:not(:disabled) { background: #DFA043; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .content { padding: 36px 32px 60px; flex: 1; }

        .error-banner { display: flex; align-items: center; gap: 12px; padding: 14px 20px; margin-bottom: 24px; border: 1px solid rgba(231,76,60,0.3); background: rgba(231,76,60,0.06); color: #E88B82; font-size: 13px; }
        .error-banner button { margin-left: auto; background: none; border: none; color: inherit; cursor: pointer; font-size: 18px; line-height: 1; opacity: 0.6; }
        .error-banner button:hover { opacity: 1; }

        .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 28px; }
        .page-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--honey); margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
        .page-eyebrow::before { content: ''; display: block; width: 16px; height: 1px; background: var(--honey); }
        .page-title { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 400; color: var(--cream); margin-bottom: 4px; }
        .page-sub { font-size: 12.5px; font-weight: 300; color: var(--text2); max-width: 520px; }

        .summary-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 2px; margin-bottom: 28px; }
        .summary-card { background: var(--surface); border: 1px solid var(--border); padding: 18px 20px; }
        .summary-label { font-size: 9.5px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text3); margin-bottom: 8px; }
        .summary-value { font-family: 'Playfair Display', serif; font-size: 24px; color: var(--cream); }
        .summary-sub { font-size: 11px; color: var(--text3); margin-top: 4px; }

        .panel { background: var(--surface); border: 1px solid var(--border); }
        .panel-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border); }
        .panel-title { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 400; color: var(--cream); }

        .riw-table { width: 100%; border-collapse: collapse; }
        .riw-table th { text-align: left; padding: 10px 24px; font-size: 9px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text3); border-bottom: 1px solid var(--border); white-space: nowrap; }
        .riw-table td { padding: 14px 24px; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 13px; font-weight: 300; color: var(--text2); vertical-align: middle; }
        .riw-table tr:last-child td { border-bottom: none; }
        .riw-table tr:hover td { background: rgba(255,255,255,0.02); }
        .riw-tanggal { color: var(--cream); font-weight: 400; }
        .riw-oleh { font-size: 10.5px; color: var(--text3); margin-top: 2px; }
        .badge-terbaik { display: inline-flex; flex-direction: column; }
        .badge-terbaik .nama { color: var(--cream); font-weight: 400; }
        .badge-terbaik .kode { font-size: 10px; color: var(--text3); }
        .vi-pill { display: inline-block; font-family: 'Lato', monospace; font-size: 12px; color: var(--honey); background: rgba(200,137,42,0.08); border: 1px solid rgba(200,137,42,0.2); padding: 3px 8px; }
        .row-actions { display: flex; gap: 6px; }
        .icon-btn { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; background: none; border: 1px solid var(--border2); color: var(--text2); cursor: pointer; transition: all 0.2s; }
        .icon-btn:hover { color: var(--cream); border-color: rgba(255,255,255,0.2); }
        .icon-btn.danger:hover { color: rgba(220,80,60,0.9); border-color: rgba(192,57,43,0.3); background: rgba(192,57,43,0.06); }

        .empty-state { padding: 56px 24px; text-align: center; }
        .empty-state svg { color: var(--text3); margin-bottom: 12px; }
        .empty-title { font-family: 'Playfair Display', serif; font-size: 17px; color: var(--cream); margin-bottom: 6px; }
        .empty-sub { font-size: 12.5px; color: var(--text3); max-width: 360px; margin: 0 auto 20px; line-height: 1.6; }

        .skeleton { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .modal { background: var(--surface); border: 1px solid var(--border2); width: 100%; max-width: 620px; max-height: 82vh; display: flex; flex-direction: column; }
        .modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 22px 26px; border-bottom: 1px solid var(--border); }
        .modal-title { font-family: 'Playfair Display', serif; font-size: 18px; color: var(--cream); margin-bottom: 4px; }
        .modal-sub { font-size: 11.5px; color: var(--text3); }
        .modal-close { background: none; border: none; color: var(--text2); cursor: pointer; }
        .modal-close:hover { color: var(--cream); }
        .modal-body { padding: 8px 0; overflow-y: auto; }

        .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 150; }
        .sidebar-overlay.open { display: block; }

        .confirm-box { background: var(--surface); border: 1px solid rgba(192,57,43,0.25); padding: 26px; width: 100%; max-width: 380px; text-align: center; }
        .confirm-title { font-family: 'Playfair Display', serif; font-size: 17px; color: var(--cream); margin-bottom: 8px; }
        .confirm-sub { font-size: 12.5px; color: var(--text2); margin-bottom: 20px; line-height: 1.6; }
        .confirm-actions { display: flex; gap: 10px; justify-content: center; }
        .btn-ghost { background: none; border: 1px solid var(--border2); color: var(--text2); padding: 9px 16px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; }
        .btn-ghost:hover { color: var(--cream); border-color: rgba(255,255,255,0.2); }
        .btn-danger { background: rgba(192,57,43,0.85); border: 1px solid rgba(192,57,43,0.85); color: #fff; padding: 9px 16px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; }
        .btn-danger:hover { background: #C0392B; }

        .spin { width: 14px; height: 14px; border: 1.5px solid rgba(0,0,0,0.25); border-top-color: #1A1207; border-radius: 50%; animation: spinR 0.7s linear infinite; display: inline-block; }
        @keyframes spinR { to { transform: rotate(360deg); } }
      `}</style>

      <div className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)}/>

      <div className="dash-wrap">
        {/* ── Sidebar ── */}
        <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
          <Link href="/admin/dashboard" className="sidebar-logo">
            <div className="logo-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L3 9v11h6v-6h6v6h6V9z"/>
              </svg>
            </div>
            <div>
              <span className="logo-name">Beuna Jaya Kayu</span>
              <span className="logo-sub">SPK · Metode SAW</span>
            </div>
          </Link>

          <nav className="sidebar-nav">
            <div className="nav-section-label">Menu Utama</div>
            {navItems.map(item => (
              <Link key={item.id} href={item.href}
                className={`nav-item${item.id === 'riwayat' ? ' active' : ''}`}
                onClick={() => setSidebarOpen(false)}>
                {navIcons[item.id]}{item.label}
              </Link>
            ))}
            <div className="nav-section-label" style={{ marginTop: 20 }}>Sistem</div>
            <Link href="/" className="nav-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              </svg>
              Halaman Publik
            </Link>
          </nav>

          <div className="sidebar-footer">
            <div className="user-card">
              <div className="user-avatar">{user?.email?.charAt(0).toUpperCase() ?? 'A'}</div>
              <div className="user-info">
                <div className="user-name">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin'}</div>
                <div className="user-role">Administrator</div>
              </div>
            </div>
            <button className="btn-logout" onClick={handleLogout} disabled={loggingOut}>
              {loggingOut ? <><span className="spin" style={{ borderTopColor: 'var(--text2)', borderColor: 'rgba(255,255,255,0.2)' }}/> Keluar...</> : <><IconLogout/> Logout</>}
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="main">
          <header className="topbar">
            <div className="topbar-left">
              <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <IconClose/> : <IconMenu/>}
              </button>
              <span className="topbar-title">Riwayat Perhitungan</span>
            </div>
            <button className="btn-primary" onClick={handleHitungDanSimpan} disabled={menghitung}>
              {menghitung ? <><span className="spin"/> Menghitung...</> : <><IconPlay/> Hitung &amp; Simpan</>}
            </button>
          </header>

          <div className="content">

            {(dataError || aksiError) && (
              <div className="error-banner">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {dataError || aksiError}
                <button onClick={() => { setDataError(null); setAksiError(null) }}>×</button>
              </div>
            )}

            <div className="page-header">
              <div>
                <div className="page-eyebrow">Audit Trail SAW</div>
                <h1 className="page-title">Riwayat Perhitungan</h1>
                <p className="page-sub">
                  Setiap kali perhitungan SAW dijalankan dan disimpan, sistem menyimpan snapshot
                  kriteria, bobot, dan hasil perangkingan pada saat itu — sehingga keputusan rekomendasi
                  dapat ditelusuri kembali kapan pun diperlukan.
                </p>
              </div>
            </div>

            <div className="summary-row">
              <div className="summary-card">
                <div className="summary-label">Total Riwayat</div>
                <div className="summary-value">{dataLoading ? '—' : ringkasan.total}</div>
                <div className="summary-sub">Perhitungan tersimpan</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Perhitungan Terakhir</div>
                <div className="summary-value" style={{ fontSize: 15 }}>
                  {dataLoading ? '—' : ringkasan.terakhir ? formatWaktu(ringkasan.terakhir.createdAt) : 'Belum ada'}
                </div>
                <div className="summary-sub">
                  {dataLoading ? '' : ringkasan.terakhir?.kayuTerbaikNama ? `Terbaik: ${ringkasan.terakhir.kayuTerbaikNama}` : '—'}
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Rata-rata Alternatif</div>
                <div className="summary-value">{dataLoading ? '—' : ringkasan.rataRataKayu}</div>
                <div className="summary-sub">Jenis kayu per perhitungan</div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h2 className="panel-title">Daftar Riwayat</h2>
              </div>

              {dataLoading ? (
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton" style={{ height: 20, width: `${88 - i * 8}%` }}/>
                  ))}
                </div>
              ) : riwayat.length === 0 ? (
                <div className="empty-state">
                  <IconHistory/>
                  <div className="empty-title">Belum ada riwayat perhitungan</div>
                  <p className="empty-sub">
                    Jalankan perhitungan SAW pertama Anda untuk mulai membangun jejak rekam
                    keputusan rekomendasi jenis kayu.
                  </p>
                  <button className="btn-primary" style={{ margin: '0 auto' }} onClick={handleHitungDanSimpan} disabled={menghitung}>
                    {menghitung ? <><span className="spin"/> Menghitung...</> : <><IconPlay/> Hitung &amp; Simpan Sekarang</>}
                  </button>
                </div>
              ) : (
                <table className="riw-table">
                  <thead>
                    <tr>
                      <th>Tanggal &amp; Waktu</th>
                      <th>Alternatif × Kriteria</th>
                      <th>Rekomendasi Terbaik</th>
                      <th>Nilai Vi</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riwayat.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div className="riw-tanggal">{formatWaktu(r.createdAt)}</div>
                          <div className="riw-oleh">{r.dilakukanOleh ?? 'Sistem'}</div>
                        </td>
                        <td>{r.jumlahKayu} kayu × {r.jumlahKriteria} kriteria</td>
                        <td>
                          <div className="badge-terbaik">
                            <span className="nama">{r.kayuTerbaikNama ?? '-'}</span>
                            <span className="kode">{r.kayuTerbaikKode ?? ''}</span>
                          </div>
                        </td>
                        <td>
                          <span className="vi-pill">{r.viTerbaik != null ? r.viTerbaik.toFixed(3) : '-'}</span>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button className="icon-btn" title="Lihat detail" onClick={() => setDetail(r)}>
                              <IconEye/>
                            </button>
                            <button className="icon-btn danger" title="Hapus riwayat" onClick={() => setHapusId(r.id)}>
                              <IconTrash/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ── Modal detail ── */}
      {detail && (
        <div className="overlay" onClick={() => setDetail(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Detail Perhitungan</div>
                <div className="modal-sub">{formatWaktu(detail.createdAt)} · {detail.dilakukanOleh ?? 'Sistem'}</div>
              </div>
              <button className="modal-close" onClick={() => setDetail(null)}><IconClose/></button>
            </div>
            <div className="modal-body">
              <table className="riw-table">
                <thead>
                  <tr>
                    <th>Peringkat</th>
                    <th>Alternatif Kayu</th>
                    <th>Nilai Vi</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.hasil
                    .slice()
                    .sort((a, b) => a.rank - b.rank)
                    .map((h) => (
                      <tr key={h.kayuId}>
                        <td>{h.rank === 1 ? 'Terbaik' : `#${h.rank}`}</td>
                        <td>
                          <div className="badge-terbaik">
                            <span className="nama">{h.nama}</span>
                            <span className="kode">{h.kode}</span>
                          </div>
                        </td>
                        <td><span className="vi-pill">{h.vi.toFixed(3)}</span></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Konfirmasi hapus ── */}
      {hapusId && (
        <div className="overlay" onClick={() => setHapusId(null)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-title">Hapus riwayat ini?</div>
            <p className="confirm-sub">
              Snapshot perhitungan ini akan dihapus permanen dan tidak dapat dikembalikan.
            </p>
            <div className="confirm-actions">
              <button className="btn-ghost" onClick={() => setHapusId(null)}>Batal</button>
              <button className="btn-danger" onClick={confirmHapus}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}