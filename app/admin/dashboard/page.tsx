// app/admin/dashboard/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { calculateSAW, totalBobot } from '@/lib/saw'
import type { Kayu, Kriteria, HasilSAW } from '@/lib/saw'
import {
  fetchKayu,
  fetchKriteria,
  fetchDashboardStats,
  type DashboardStats,
} from '@/lib/supabase/queries'

// ── Types ──
interface StatCard {
  label: string
  value: string
  sub: string
  trend: 'up' | 'down' | 'neutral'
  trendVal: string
  icon: React.ReactNode
}

// ── Icons ──
const IconWood = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 2L3 9v11h6v-6h6v6h6V9z"/>
  </svg>
)
const IconChart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)
const IconBox = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
)
const IconScale = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 3v18M5 7l-3 6a4 4 0 008 0l-3-6M19 7l-3 6a4 4 0 008 0l-3-6M5 7h14M9 21h6"/>
  </svg>
)
const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
  </svg>
)
const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
  </svg>
)
const IconArrow = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)
const IconTrendUp = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
)
const IconTrendDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
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
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
  </svg>
)
const IconHistory = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>
  </svg>
)

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [loggingOut, setLoggingOut] = useState<boolean>(false)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [activeMenu] = useState<string>('dashboard')

  // ── Data dari Supabase ──
  const [daftarKayu, setDaftarKayu]       = useState<Kayu[]>([])
  const [daftarKriteria, setDaftarKriteria] = useState<Kriteria[]>([])
  const [stats, setStats]                 = useState<DashboardStats | null>(null)
  const [hasilSAW, setHasilSAW]           = useState<HasilSAW[]>([])
  const [dataLoading, setDataLoading]     = useState<boolean>(true)
  const [dataError, setDataError]         = useState<string | null>(null)

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

    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => { subscription.unsubscribe(); clearInterval(timer) }
  }, [router])

  // ── Fetch data Supabase ──
  const loadData = useCallback(async () => {
    setDataLoading(true)
    setDataError(null)
    try {
      const [kayu, kriteria, dashStats] = await Promise.all([
        fetchKayu(),
        fetchKriteria(),
        fetchDashboardStats(),
      ])
      setDaftarKayu(kayu)
      setDaftarKriteria(kriteria)
      setStats(dashStats)
      setHasilSAW(calculateSAW(kayu, kriteria))
    } catch (err) {
      console.error(err)
      setDataError('Gagal memuat data dari database. Periksa koneksi Supabase Anda.')
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!loading) loadData()
  }, [loading, loadData])

  // ── Realtime subscription ──
  useEffect(() => {
    const channel = supabase
      .channel('dashboard_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kayu' },     () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kriteria' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pesanan' },  () => loadData())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [loadData])

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const formatDate = (d: Date) =>
    d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const bobotTotal          = totalBobot(daftarKriteria)
  const rekomendasiTerbaik  = hasilSAW[0] ?? null

  const statCards: StatCard[] = [
    {
      label: 'Jenis Kayu',
      value: dataLoading ? '—' : String(stats?.totalKayu ?? daftarKayu.length),
      sub: daftarKayu.map((k) => k.nama).join(', ') || 'Memuat...',
      trend: 'neutral',
      trendVal: 'Live dari DB',
      icon: <IconWood />,
    },
    {
      label: 'Kriteria SAW',
      value: dataLoading ? '—' : String(stats?.totalKriteria ?? daftarKriteria.length),
      sub: `Total bobot ${bobotTotal.toFixed(2)}`,
      trend: Math.abs(bobotTotal - 1) < 0.001 ? 'up' : 'down',
      trendVal: Math.abs(bobotTotal - 1) < 0.001 ? 'Bobot valid' : 'Cek bobot',
      icon: <IconScale />,
    },
    {
      label: 'Rekomendasi Terbaik',
      value: dataLoading ? '—' : (rekomendasiTerbaik?.kode ?? '-'),
      sub: rekomendasiTerbaik?.nama ?? (dataLoading ? 'Menghitung...' : 'Belum ada data'),
      trend: rekomendasiTerbaik ? 'up' : 'neutral',
      trendVal: rekomendasiTerbaik ? `Vi = ${rekomendasiTerbaik.vi.toFixed(3)}` : '-',
      icon: <IconChart />,
    },
    {
      label: 'Pesanan Masuk',
      value: dataLoading ? '—' : String(stats?.pesananMenunggu ?? 0),
      sub: 'Menunggu konfirmasi',
      trend: (stats?.pesananMenunggu ?? 0) > 0 ? 'up' : 'neutral',
      trendVal: (stats?.pesananMenunggu ?? 0) > 0 ? 'Perlu ditangani' : 'Tidak ada antrean',
      icon: <IconBox />,
    },
  ]

  const navItems = [
    { id: 'dashboard', label: 'Dashboard',        href: '/admin/dashboard',   icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
    { id: 'kayu',      label: 'Jenis Kayu',       href: '/admin/kayu',        icon: <IconWood /> },
    { id: 'kriteria',  label: 'Kriteria & Bobot', href: '/admin/kriteria',    icon: <IconScale /> },
    { id: 'pesanan',   label: 'Pesanan',          href: '/admin/pesanan',     icon: <IconBox /> },
    { id: 'riwayat',   label: 'Riwayat Perhitungan', href: '/admin/riwayat', icon: <IconHistory /> },
  ]

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
        .topbar-right { display: flex; align-items: center; gap: 12px; }
        .topbar-time { font-size: 11px; color: var(--text3); font-family: 'Lato', monospace; letter-spacing: 0.5px; display: none; }
        @media (min-width: 600px) { .topbar-time { display: block; } }
        .status-pill { display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 700; color: rgba(39,174,96,0.8); letter-spacing: 1px; text-transform: uppercase; padding: 5px 10px; border: 1px solid rgba(39,174,96,0.2); background: rgba(39,174,96,0.05); }
        .status-dot { width: 5px; height: 5px; border-radius: 50%; background: #27AE60; animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

        .btn-refresh { display: flex; align-items: center; gap: 6px; background: none; border: 1px solid var(--border2); color: var(--text2); padding: 6px 12px; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
        .btn-refresh:hover:not(:disabled) { color: var(--cream); border-color: rgba(255,255,255,0.2); }
        .btn-refresh:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-refresh svg { transition: transform 0.5s ease; }
        .btn-refresh.spinning svg { animation: spinR 0.7s linear infinite; }
        @keyframes spinR { to { transform: rotate(360deg); } }

        .content { padding: 36px 32px 60px; flex: 1; }

        /* Error banner */
        .error-banner { display: flex; align-items: center; gap: 12px; padding: 14px 20px; margin-bottom: 24px; border: 1px solid rgba(231,76,60,0.3); background: rgba(231,76,60,0.06); color: #E88B82; font-size: 13px; border-radius: 0; }
        .error-banner button { margin-left: auto; background: none; border: none; color: inherit; cursor: pointer; font-size: 18px; line-height: 1; opacity: 0.6; }
        .error-banner button:hover { opacity: 1; }

        .welcome-banner { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 36px; padding: 28px 32px; background: var(--surface); border: 1px solid var(--border); border-top: 2px solid rgba(200,137,42,0.3); position: relative; overflow: hidden; animation: fadeUp 0.5s ease both; }
        .welcome-banner::before { content: ''; position: absolute; top: -60px; right: -60px; width: 220px; height: 220px; background: radial-gradient(circle, rgba(200,137,42,0.06) 0%, transparent 70%); pointer-events: none; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .welcome-greeting { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--honey); margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
        .welcome-greeting::before { content: ''; display: block; width: 16px; height: 1px; background: var(--honey); }
        .welcome-title { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 400; color: var(--cream); margin-bottom: 4px; }
        .welcome-title em { font-style: italic; color: var(--honey); }
        .welcome-sub { font-size: 12.5px; font-weight: 300; color: var(--text2); }
        .welcome-right { text-align: right; }
        .welcome-date { font-size: 11.5px; color: var(--text2); font-weight: 300; text-transform: capitalize; }
        .welcome-clock { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400; color: var(--cream); letter-spacing: 1px; }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 2px; margin-bottom: 32px; }
        .stat-card { background: var(--surface); padding: 24px; border: 1px solid var(--border); position: relative; overflow: hidden; transition: border-color 0.25s, transform 0.25s; animation: fadeUp 0.5s ease both; }
        .stat-card:nth-child(1){animation-delay:0.05s} .stat-card:nth-child(2){animation-delay:0.1s}
        .stat-card:nth-child(3){animation-delay:0.15s} .stat-card:nth-child(4){animation-delay:0.2s}
        .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, var(--honey), transparent); opacity: 0; transition: opacity 0.25s; }
        .stat-card:hover { border-color: rgba(200,137,42,0.2); transform: translateY(-3px); }
        .stat-card:hover::before { opacity: 1; }
        .stat-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .stat-icon { width: 40px; height: 40px; border: 1px solid rgba(200,137,42,0.2); display: flex; align-items: center; justify-content: center; color: var(--honey); }
        .stat-trend { display: flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700; padding: 4px 8px; border: 1px solid transparent; }
        .stat-trend.up { color: #27AE60; border-color: rgba(39,174,96,0.2); background: rgba(39,174,96,0.06); }
        .stat-trend.down { color: #E74C3C; border-color: rgba(231,76,60,0.2); background: rgba(231,76,60,0.06); }
        .stat-trend.neutral { color: var(--text2); border-color: rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); }
        .stat-value { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 700; color: var(--cream); line-height: 1; margin-bottom: 4px; }
        .stat-label { font-size: 10px; font-weight: 700; color: var(--text2); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px; }
        .stat-sub { font-size: 11.5px; font-weight: 300; color: var(--text3); }

        /* Skeleton shimmer for loading */
        .skeleton { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 2px; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .bottom-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2px; }
        @media (max-width: 1100px) { .bottom-grid { grid-template-columns: 1fr; } }

        .panel { background: var(--surface); border: 1px solid var(--border); animation: fadeUp 0.5s 0.25s ease both; }
        .panel-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border); }
        .panel-title { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 400; color: var(--cream); }
        .panel-action { display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--honey); text-decoration: none; transition: opacity 0.2s; background: none; border: none; cursor: pointer; font-family: 'Lato', sans-serif; }
        .panel-action:hover { opacity: 0.7; }

        .wood-table { width: 100%; border-collapse: collapse; }
        .wood-table th { text-align: left; padding: 10px 24px; font-size: 9px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text3); border-bottom: 1px solid var(--border); }
        .wood-table td { padding: 14px 24px; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 13px; font-weight: 300; color: var(--text2); transition: background 0.2s; }
        .wood-table tr:last-child td { border-bottom: none; }
        .wood-table tr:hover td { background: rgba(255,255,255,0.02); }
        .wood-name-cell { display: flex; align-items: center; gap: 10px; }
        .wood-rank { width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; font-family: 'Lato', sans-serif; border: 1px solid rgba(200,137,42,0.3); color: var(--honey); }
        .wood-rank.first { background: rgba(200,137,42,0.18); border-color: var(--honey); }
        .wood-name-txt { font-weight: 400; color: var(--cream); }
        .wood-code { font-size: 10px; color: var(--text3); }
        .vi-wrap { display: flex; align-items: center; gap: 10px; }
        .vi-bar-track { flex: 1; height: 3px; background: rgba(255,255,255,0.06); max-width: 80px; }
        .vi-bar-fill { height: 100%; background: var(--honey); transition: width 0.5s ease; }
        .vi-value { font-size: 12px; color: var(--cream); min-width: 42px; text-align: right; font-family: 'Lato', monospace; }

        .activity-list { padding: 0; }
        .activity-item { display: flex; gap: 12px; align-items: flex-start; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.2s; }
        .activity-item:last-child { border-bottom: none; }
        .activity-item:hover { background: rgba(255,255,255,0.02); }
        .activity-dot-wrap { display: flex; flex-direction: column; align-items: center; padding-top: 5px; }
        .activity-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .activity-line { width: 1px; flex: 1; background: rgba(255,255,255,0.05); margin-top: 5px; min-height: 18px; }
        .activity-item:last-child .activity-line { display: none; }
        .activity-body { flex: 1; min-width: 0; }
        .activity-text { font-size: 12.5px; font-weight: 300; color: var(--text2); line-height: 1.5; margin-bottom: 3px; }
        .activity-time { font-size: 10.5px; color: var(--text3); }
        .empty-saw { padding: 32px 24px; text-align: center; color: var(--text3); font-size: 12px; }

        .overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 150; }
        .overlay.open { display: block; }
        .spin { width: 14px; height: 14px; border: 1.5px solid rgba(255,255,255,0.2); border-top-color: var(--text2); border-radius: 50%; animation: spinR 0.7s linear infinite; display: inline-block; }
        @keyframes spinR { to { transform: rotate(360deg); } }
      `}</style>

      <div className={`overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)}/>

      <div className="dash-wrap">
        {/* ── Sidebar ── */}
        <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
          <Link href="/" className="sidebar-logo">
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
                className={`nav-item${activeMenu === item.id ? ' active' : ''}`}
                onClick={() => setSidebarOpen(false)}>
                {item.icon}{item.label}
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
              {loggingOut ? <><span className="spin"/> Keluar...</> : <><IconLogout/> Logout</>}
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
              <span className="topbar-title">Dashboard Admin</span>
            </div>
            <div className="topbar-right">
              <span className="topbar-time">{formatTime(currentTime)}</span>
              <button
                className={`btn-refresh${dataLoading ? ' spinning' : ''}`}
                onClick={loadData}
                disabled={dataLoading}
                title="Refresh data"
              >
                <IconRefresh/>
                {dataLoading ? 'Memuat...' : 'Refresh'}
              </button>
              <div className="status-pill">
                <div className="status-dot"/>
                Online
              </div>
            </div>
          </header>

          <div className="content">

            {/* Error banner */}
            {dataError && (
              <div className="error-banner">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {dataError}
                <button onClick={loadData}>↻</button>
              </div>
            )}

            {/* Welcome banner */}
            <div className="welcome-banner">
              <div className="welcome-left">
                <div className="welcome-greeting">Selamat Datang</div>
                <h1 className="welcome-title">
                  Halo, <em>{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin'}!</em>
                </h1>
                <p className="welcome-sub">SPK Pemilihan Jenis Kayu — UD. Kilang Kayu Beuna Jaya, Aceh Tamiang.</p>
              </div>
              <div className="welcome-right">
                <div className="welcome-date">{formatDate(currentTime)}</div>
                <div className="welcome-clock">{formatTime(currentTime)}</div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="stats-grid">
              {statCards.map((s) => (
                <div className="stat-card" key={s.label}>
                  <div className="stat-top">
                    <div className="stat-icon">{s.icon}</div>
                    <div className={`stat-trend ${s.trend}`}>
                      {s.trend === 'up' && <IconTrendUp/>}
                      {s.trend === 'down' && <IconTrendDown/>}
                      {s.trendVal}
                    </div>
                  </div>
                  {dataLoading
                    ? <div className="skeleton" style={{ height: 40, width: '60%', marginBottom: 8 }}/>
                    : <div className="stat-value">{s.value}</div>
                  }
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-sub">{dataLoading ? '—' : s.sub}</div>
                </div>
              ))}
            </div>

            {/* Bottom panels */}
            <div className="bottom-grid">
              {/* SAW ranking table */}
              <div className="panel">
                <div className="panel-header">
                  <h2 className="panel-title">Hasil Perangkingan SAW</h2>
                  <Link href="/admin/rekomendasi" className="panel-action">
                    Lihat Detail <IconArrow/>
                  </Link>
                </div>

                {dataLoading ? (
                  <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[1,2,3].map(i => (
                      <div key={i} className="skeleton" style={{ height: 20, width: `${85 - i * 10}%` }}/>
                    ))}
                  </div>
                ) : hasilSAW.length === 0 ? (
                  <div className="empty-saw">
                    Belum ada data kayu & kriteria. Isi terlebih dahulu melalui menu Jenis Kayu & Kriteria.
                  </div>
                ) : (
                  <table className="wood-table">
                    <thead>
                      <tr>
                        <th>Alternatif Kayu</th>
                        <th>Peringkat</th>
                        <th>Nilai Vi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hasilSAW.map(h => {
                        const maxVi = hasilSAW[0]?.vi || 1
                        return (
                          <tr key={h.kayuId}>
                            <td>
                              <div className="wood-name-cell">
                                <div className={`wood-rank${h.rank === 1 ? ' first' : ''}`}>{h.rank}</div>
                                <div>
                                  <div className="wood-name-txt">{h.nama}</div>
                                  <div className="wood-code">{h.kode}</div>
                                </div>
                              </div>
                            </td>
                            <td>{h.rank === 1 ? 'Terbaik' : `Peringkat ${h.rank}`}</td>
                            <td>
                              <div className="vi-wrap">
                                <div className="vi-bar-track">
                                  <div className="vi-bar-fill" style={{ width: `${(h.vi / maxVi) * 100}%` }}/>
                                </div>
                                <span className="vi-value">{h.vi.toFixed(3)}</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Activity panel */}
              <div className="panel" style={{ animationDelay: '0.3s' }}>
                <div className="panel-header">
                  <h2 className="panel-title">Ringkasan Data</h2>
                </div>
                <div className="activity-list">
                  {[
                    {
                      color: '#C8892A',
                      text: rekomendasiTerbaik
                        ? `Rekomendasi terbaik: ${rekomendasiTerbaik.nama} (Vi = ${rekomendasiTerbaik.vi.toFixed(3)})`
                        : 'Belum ada perhitungan SAW',
                      time: 'Kalkulasi terkini',
                    },
                    {
                      color: '#7C4A2D',
                      text: `${daftarKayu.length} jenis kayu terdaftar di database`,
                      time: 'Data aktif',
                    },
                    {
                      color: '#2980B9',
                      text: `${daftarKriteria.length} kriteria — total bobot ${bobotTotal.toFixed(2)}`,
                      time: Math.abs(bobotTotal - 1) < 0.001 ? 'Bobot valid ✓' : '⚠ Bobot belum = 1.00',
                    },
                    {
                      color: '#27AE60',
                      text: `${stats?.pesananMenunggu ?? 0} pesanan menunggu konfirmasi`,
                      time: 'Status pesanan',
                    },
                  ].map((a, i) => (
                    <div className="activity-item" key={i}>
                      <div className="activity-dot-wrap">
                        <div className="activity-dot" style={{ background: a.color }}/>
                        <div className="activity-line"/>
                      </div>
                      <div className="activity-body">
                        <div className="activity-text">{dataLoading ? '...' : a.text}</div>
                        <div className="activity-time">{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  )
}