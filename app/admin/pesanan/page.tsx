// app/admin/pesanan/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

// ── Types ──
type StatusPesanan = 'menunggu' | 'dikonfirmasi' | 'selesai' | 'dibatalkan'

interface Kayu {
  id: string
  nama: string
  kode: string
}

interface Pesanan {
  id: string
  nama_pemesan: string
  kayu_id: string | null
  volume_m3: number | null
  catatan: string | null
  status: StatusPesanan
  created_at: string
  kayu?: Kayu | null
}

// ── Icons ──
const IconBox = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
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
const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
  </svg>
)
const IconScale = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 3v18M5 7l-3 6a4 4 0 008 0l-3-6M19 7l-3 6a4 4 0 008 0l-3-6M5 7h14M9 21h6"/>
  </svg>
)
const IconWood = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 2L3 9v11h6v-6h6v6h6V9z"/>
  </svg>
)
const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
)
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
  </svg>
)
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconEye = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)
const IconDone = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)

// ── Status config ──
const STATUS_CONFIG: Record<StatusPesanan, { label: string; color: string; bg: string; border: string }> = {
  menunggu:    { label: 'Menunggu',    color: '#C8892A', bg: 'rgba(200,137,42,0.10)', border: 'rgba(200,137,42,0.25)' },
  dikonfirmasi:{ label: 'Dikonfirmasi',color: '#2980B9', bg: 'rgba(41,128,185,0.10)', border: 'rgba(41,128,185,0.25)' },
  selesai:     { label: 'Selesai',     color: '#27AE60', bg: 'rgba(39,174,96,0.10)',  border: 'rgba(39,174,96,0.25)'  },
  dibatalkan:  { label: 'Dibatalkan',  color: '#E74C3C', bg: 'rgba(231,76,60,0.10)',  border: 'rgba(231,76,60,0.25)'  },
}

export default function AdminPesananPage() {
  const router = useRouter()
  const [user, setUser] = useState<import('@supabase/supabase-js').User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const [pesanan, setPesanan] = useState<Pesanan[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<StatusPesanan | 'semua'>('semua')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Detail modal
  const [detailItem, setDetailItem] = useState<Pesanan | null>(null)

  // ── Auth ──
  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setUser(user)
      setLoading(false)
    }
    check()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === 'SIGNED_OUT' || !s) router.replace('/login')
    })
    return () => subscription.unsubscribe()
  }, [router])

  // ── Fetch pesanan ──
  const loadPesanan = useCallback(async () => {
    setDataLoading(true)
    const { data, error } = await supabase
      .from('pesanan')
      .select(`*, kayu:kayu_id(id, nama, kode)`)
      .order('created_at', { ascending: false })
    if (!error && data) setPesanan(data as Pesanan[])
    setDataLoading(false)
  }, [])

  useEffect(() => {
    if (!loading) loadPesanan()
  }, [loading, loadPesanan])

  // ── Realtime ──
  useEffect(() => {
    const ch = supabase.channel('pesanan_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pesanan' }, loadPesanan)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [loadPesanan])

  const updateStatus = async (id: string, status: StatusPesanan) => {
    setUpdatingId(id)
    await supabase.from('pesanan').update({ status }).eq('id', id)
    setUpdatingId(null)
    if (detailItem?.id === id) setDetailItem(prev => prev ? { ...prev, status } : prev)
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const formatTanggal = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const filtered = filterStatus === 'semua'
    ? pesanan
    : pesanan.filter(p => p.status === filterStatus)

  const counts = {
    semua: pesanan.length,
    menunggu: pesanan.filter(p => p.status === 'menunggu').length,
    dikonfirmasi: pesanan.filter(p => p.status === 'dikonfirmasi').length,
    selesai: pesanan.filter(p => p.status === 'selesai').length,
    dibatalkan: pesanan.filter(p => p.status === 'dibatalkan').length,
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard',        href: '/admin/dashboard',   icon: <IconGrid /> },
    { id: 'kayu',      label: 'Jenis Kayu',       href: '/admin/kayu',        icon: <IconWood /> },
    { id: 'kriteria',  label: 'Kriteria & Bobot', href: '/admin/kriteria',    icon: <IconScale /> },
    { id: 'pesanan',   label: 'Pesanan',          href: '/admin/pesanan',     icon: <IconBox /> },
  ]

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0E0A07' }}>
        <div style={{ width: 40, height: 40, border: '2px solid rgba(200,137,42,0.2)', borderTopColor: '#C8892A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400&family=Lato:wght@300;400;700&display=swap');
        :root {
          --bg:#0E0A07;--surface:#16110D;--surface2:#1E1610;
          --border:rgba(255,255,255,0.05);--border2:rgba(255,255,255,0.08);
          --honey:#C8892A;--cream:#FAF6EF;
          --text:rgba(250,246,239,0.85);--text2:rgba(250,246,239,0.45);--text3:rgba(250,246,239,0.22);
          --sidebar-w:240px;
        }
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Lato',sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden;}

        .wrap{display:flex;min-height:100vh;}
        .sidebar{width:var(--sidebar-w);flex-shrink:0;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:200;transition:transform 0.3s ease;}
        @media(max-width:900px){.sidebar{transform:translateX(-100%);}.sidebar.open{transform:translateX(0);box-shadow:8px 0 40px rgba(0,0,0,.5);}}
        .sidebar-logo{padding:28px 24px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;text-decoration:none;}
        .logo-mark{width:32px;height:32px;border:1px solid rgba(200,137,42,.4);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .logo-mark svg{width:16px;height:16px;color:var(--honey);}
        .logo-name{font-family:'Playfair Display',serif;font-size:13px;font-weight:500;color:var(--cream);line-height:1.2;}
        .logo-sub{font-size:8.5px;color:var(--text3);letter-spacing:1.8px;text-transform:uppercase;margin-top:2px;display:block;}
        .sidebar-nav{flex:1;padding:16px 12px;overflow-y:auto;}
        .nav-section-label{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--text3);padding:0 12px;margin:8px 0 6px;}
        .nav-item{display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer;font-size:13px;color:var(--text2);transition:all .2s;border:none;background:none;width:100%;text-align:left;position:relative;text-decoration:none;}
        .nav-item::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:2px;height:0;background:var(--honey);transition:height .2s;}
        .nav-item:hover{color:var(--cream);background:rgba(255,255,255,.03);}
        .nav-item.active{color:var(--cream);background:rgba(200,137,42,.08);}
        .nav-item.active::before{height:60%;}
        .nav-item svg{flex-shrink:0;opacity:.6;}
        .nav-item.active svg,.nav-item:hover svg{opacity:1;color:var(--honey);}
        .sidebar-footer{padding:16px 12px;border-top:1px solid var(--border);}
        .user-card{display:flex;align-items:center;gap:10px;padding:10px 12px;margin-bottom:8px;}
        .user-avatar{width:32px;height:32px;flex-shrink:0;background:rgba(200,137,42,.15);border:1px solid rgba(200,137,42,.25);display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:14px;font-weight:700;color:var(--honey);}
        .user-info{flex:1;min-width:0;}
        .user-name{font-size:12px;color:var(--cream);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .user-role{font-size:9.5px;color:var(--honey);letter-spacing:1px;text-transform:uppercase;margin-top:1px;}
        .btn-logout{display:flex;align-items:center;gap:8px;width:100%;padding:9px 12px;background:none;border:1px solid rgba(255,255,255,.06);color:var(--text2);font-family:'Lato',sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:all .2s;}
        .btn-logout:hover:not(:disabled){background:rgba(192,57,43,.08);border-color:rgba(192,57,43,.25);color:rgba(220,80,60,.9);}
        .btn-logout:disabled{opacity:.4;cursor:not-allowed;}

        .main{flex:1;margin-left:var(--sidebar-w);display:flex;flex-direction:column;min-height:100vh;}
        @media(max-width:900px){.main{margin-left:0;}}
        .topbar{position:sticky;top:0;z-index:100;height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 32px;background:rgba(14,10,7,.88);backdrop-filter:blur(16px);border-bottom:1px solid var(--border);}
        .topbar-left{display:flex;align-items:center;gap:16px;}
        .menu-toggle{display:none;background:none;border:none;color:var(--text2);cursor:pointer;padding:4px;transition:color .2s;}
        .menu-toggle:hover{color:var(--cream);}
        @media(max-width:900px){.menu-toggle{display:flex;align-items:center;}}
        .topbar-title{font-family:'Playfair Display',serif;font-size:17px;color:var(--cream);}
        .topbar-right{display:flex;align-items:center;gap:12px;}
        .btn-refresh{display:flex;align-items:center;gap:6px;background:none;border:1px solid var(--border2);color:var(--text2);padding:6px 12px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:all .2s;}
        .btn-refresh:hover:not(:disabled){color:var(--cream);border-color:rgba(255,255,255,.2);}
        .btn-refresh:disabled{opacity:.4;cursor:not-allowed;}
        .btn-refresh.spinning svg{animation:spinR .7s linear infinite;}
        @keyframes spinR{to{transform:rotate(360deg)}}

        .content{padding:36px 32px 60px;flex:1;}
        .overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:150;}
        .overlay.open{display:block;}

        /* Page header */
        .page-header{display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:16px;margin-bottom:28px;}
        .page-eyebrow{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--honey);margin-bottom:6px;display:flex;align-items:center;gap:8px;}
        .page-eyebrow::before{content:'';display:block;width:14px;height:1px;background:var(--honey);}
        .page-title{font-family:'Playfair Display',serif;font-size:28px;color:var(--cream);}

        /* Filter tabs */
        .filter-tabs{display:flex;gap:2px;margin-bottom:24px;flex-wrap:wrap;}
        .filter-tab{display:flex;align-items:center;gap:8px;padding:9px 16px;background:none;border:1px solid var(--border);color:var(--text2);font-family:'Lato',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer;transition:all .2s;}
        .filter-tab:hover{color:var(--cream);border-color:var(--border2);}
        .filter-tab.active{color:var(--cream);border-color:rgba(200,137,42,.4);background:rgba(200,137,42,.08);}
        .filter-tab .badge{min-width:18px;height:18px;padding:0 5px;background:rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;}
        .filter-tab.active .badge{background:rgba(200,137,42,.2);color:var(--honey);}

        /* Table */
        .table-wrap{background:var(--surface);border:1px solid var(--border);overflow:hidden;}
        table{width:100%;border-collapse:collapse;}
        th{text-align:left;padding:12px 20px;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text3);border-bottom:1px solid var(--border);}
        td{padding:16px 20px;border-bottom:1px solid rgba(255,255,255,.03);font-size:13px;color:var(--text2);vertical-align:middle;}
        tr:last-child td{border-bottom:none;}
        tr:hover td{background:rgba(255,255,255,.02);}
        .pemesan-name{font-weight:400;color:var(--cream);font-size:14px;margin-bottom:2px;}
        .pemesan-date{font-size:11px;color:var(--text3);}
        .kayu-name{color:var(--cream);font-weight:400;}
        .kayu-code{font-size:10px;color:var(--text3);margin-top:2px;}
        .vol-val{color:var(--cream);font-weight:400;}
        .status-pill{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;border:1px solid;}
        .status-dot{width:5px;height:5px;border-radius:50%;}

        /* Action buttons */
        .action-row{display:flex;gap:4px;flex-wrap:wrap;}
        .act-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 10px;font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;cursor:pointer;transition:all .2s;font-family:'Lato',sans-serif;border:1px solid;background:none;}
        .act-btn:disabled{opacity:.3;cursor:not-allowed;}
        .act-btn.confirm{color:rgba(41,128,185,.9);border-color:rgba(41,128,185,.25);}
        .act-btn.confirm:not(:disabled):hover{background:rgba(41,128,185,.1);}
        .act-btn.done{color:rgba(39,174,96,.9);border-color:rgba(39,174,96,.25);}
        .act-btn.done:not(:disabled):hover{background:rgba(39,174,96,.1);}
        .act-btn.cancel{color:rgba(231,76,60,.9);border-color:rgba(231,76,60,.25);}
        .act-btn.cancel:not(:disabled):hover{background:rgba(231,76,60,.1);}
        .act-btn.view{color:var(--text2);border-color:var(--border);}
        .act-btn.view:not(:disabled):hover{color:var(--cream);border-color:var(--border2);}

        /* Empty state */
        .empty-state{padding:60px 20px;text-align:center;color:var(--text3);}
        .empty-icon{width:48px;height:48px;margin:0 auto 16px;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--text3);}
        .empty-title{font-family:'Playfair Display',serif;font-size:18px;color:var(--text2);margin-bottom:8px;}
        .empty-desc{font-size:13px;font-weight:300;}

        /* Summary cards */
        .summary-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:2px;margin-bottom:28px;}
        .summary-card{background:var(--surface);border:1px solid var(--border);padding:18px 20px;}
        .summary-val{font-family:'Playfair Display',serif;font-size:32px;color:var(--cream);line-height:1;margin-bottom:4px;}
        .summary-lbl{font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text3);}

        /* Detail modal */
        .modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:300;display:flex;align-items:center;justify-content:center;padding:20px;}
        .modal{background:var(--surface);border:1px solid var(--border);width:100%;max-width:520px;max-height:90vh;overflow-y:auto;}
        .modal-header{display:flex;justify-content:space-between;align-items:center;padding:24px;border-bottom:1px solid var(--border);}
        .modal-title{font-family:'Playfair Display',serif;font-size:18px;color:var(--cream);}
        .modal-close{background:none;border:none;color:var(--text2);cursor:pointer;padding:4px;transition:color .2s;}
        .modal-close:hover{color:var(--cream);}
        .modal-body{padding:24px;}
        .detail-row{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);}
        .detail-row:last-child{border-bottom:none;}
        .detail-lbl{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text3);min-width:120px;padding-top:2px;}
        .detail-val{font-size:13px;color:var(--cream);flex:1;}
        .modal-actions{padding:20px 24px;border-top:1px solid var(--border);display:flex;gap:8px;flex-wrap:wrap;}
        .modal-btn{display:flex;align-items:center;gap:6px;padding:10px 16px;font-family:'Lato',sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer;border:1px solid;transition:all .2s;background:none;}
        .modal-btn:disabled{opacity:.3;cursor:not-allowed;}
        .modal-btn.primary{background:var(--honey);color:#0E0A07;border-color:var(--honey);}
        .modal-btn.primary:not(:disabled):hover{background:#B8791A;}

        .spin{width:12px;height:12px;border:1.5px solid rgba(255,255,255,.2);border-top-color:currentColor;border-radius:50%;animation:spinR .7s linear infinite;display:inline-block;}
      `}</style>

      <div className={`overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)}/>

      {/* Detail Modal */}
      {detailItem && (
        <div className="modal-backdrop" onClick={() => setDetailItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Detail Pesanan</span>
              <button className="modal-close" onClick={() => setDetailItem(null)}><IconClose/></button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-lbl">ID Pesanan</span>
                <span className="detail-val" style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text2)' }}>{detailItem.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-lbl">Nama Pemesan</span>
                <span className="detail-val">{detailItem.nama_pemesan}</span>
              </div>
              <div className="detail-row">
                <span className="detail-lbl">Jenis Kayu</span>
                <span className="detail-val">{detailItem.kayu?.nama ?? '—'} {detailItem.kayu?.kode ? `(${detailItem.kayu.kode})` : ''}</span>
              </div>
              <div className="detail-row">
                <span className="detail-lbl">Volume</span>
                <span className="detail-val">{detailItem.volume_m3 != null ? `${detailItem.volume_m3} m³` : '—'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-lbl">Catatan</span>
                <span className="detail-val" style={{ whiteSpace: 'pre-wrap' }}>{detailItem.catatan || '—'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-lbl">Tanggal Pesan</span>
                <span className="detail-val">{formatTanggal(detailItem.created_at)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-lbl">Status</span>
                <span>
                  <span className="status-pill" style={{ color: STATUS_CONFIG[detailItem.status].color, background: STATUS_CONFIG[detailItem.status].bg, borderColor: STATUS_CONFIG[detailItem.status].border }}>
                    <span className="status-dot" style={{ background: STATUS_CONFIG[detailItem.status].color }}/>
                    {STATUS_CONFIG[detailItem.status].label}
                  </span>
                </span>
              </div>
            </div>
            <div className="modal-actions">
              {detailItem.status === 'menunggu' && (
                <button className="modal-btn primary" disabled={updatingId === detailItem.id}
                  onClick={() => updateStatus(detailItem.id, 'dikonfirmasi')}>
                  {updatingId === detailItem.id ? <span className="spin"/> : <IconCheck/>} Konfirmasi
                </button>
              )}
              {detailItem.status === 'dikonfirmasi' && (
                <button className="modal-btn primary" disabled={updatingId === detailItem.id}
                  onClick={() => updateStatus(detailItem.id, 'selesai')}>
                  {updatingId === detailItem.id ? <span className="spin"/> : <IconDone/>} Tandai Selesai
                </button>
              )}
              {(detailItem.status === 'menunggu' || detailItem.status === 'dikonfirmasi') && (
                <button className="modal-btn" style={{ color: 'rgba(231,76,60,.9)', borderColor: 'rgba(231,76,60,.25)' }}
                  disabled={updatingId === detailItem.id}
                  onClick={() => updateStatus(detailItem.id, 'dibatalkan')}>
                  {updatingId === detailItem.id ? <span className="spin"/> : <IconX/>} Batalkan
                </button>
              )}
              <button className="modal-btn" style={{ color: 'var(--text2)', borderColor: 'var(--border)', marginLeft: 'auto' }}
                onClick={() => setDetailItem(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      <div className="wrap">
        {/* Sidebar */}
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
                className={`nav-item${item.id === 'pesanan' ? ' active' : ''}`}
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

        {/* Main */}
        <main className="main">
          <header className="topbar">
            <div className="topbar-left">
              <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <IconClose/> : <IconMenu/>}
              </button>
              <span className="topbar-title">Kelola Pesanan</span>
            </div>
            <div className="topbar-right">
              <button className={`btn-refresh${dataLoading ? ' spinning' : ''}`}
                onClick={loadPesanan} disabled={dataLoading}>
                <IconRefresh/>{dataLoading ? 'Memuat...' : 'Refresh'}
              </button>
            </div>
          </header>

          <div className="content">
            <div className="page-header">
              <div>
                <div className="page-eyebrow">Manajemen</div>
                <h1 className="page-title">Pesanan Masuk</h1>
              </div>
            </div>

            {/* Summary cards */}
            <div className="summary-grid">
              {[
                { lbl: 'Total Pesanan', val: counts.semua },
                { lbl: 'Menunggu', val: counts.menunggu, color: '#C8892A' },
                { lbl: 'Dikonfirmasi', val: counts.dikonfirmasi, color: '#2980B9' },
                { lbl: 'Selesai', val: counts.selesai, color: '#27AE60' },
                { lbl: 'Dibatalkan', val: counts.dibatalkan, color: '#E74C3C' },
              ].map(s => (
                <div className="summary-card" key={s.lbl}>
                  <div className="summary-val" style={s.color ? { color: s.color } : {}}>{dataLoading ? '—' : s.val}</div>
                  <div className="summary-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>

            {/* Filter tabs */}
            <div className="filter-tabs">
              {(['semua', 'menunggu', 'dikonfirmasi', 'selesai', 'dibatalkan'] as const).map(s => (
                <button key={s} className={`filter-tab${filterStatus === s ? ' active' : ''}`}
                  onClick={() => setFilterStatus(s)}>
                  {s === 'semua' ? 'Semua' : STATUS_CONFIG[s].label}
                  <span className="badge">{counts[s]}</span>
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="table-wrap">
              {dataLoading ? (
                <div style={{ padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{ height: 20, width: `${90-i*10}%`, background: 'linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.04) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 2 }}/>
                  ))}
                  <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
                </div>
              ) : filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><IconBox/></div>
                  <div className="empty-title">Tidak Ada Pesanan</div>
                  <div className="empty-desc">
                    {filterStatus === 'semua' ? 'Belum ada pesanan masuk dari pelanggan.' : `Tidak ada pesanan dengan status "${STATUS_CONFIG[filterStatus as StatusPesanan]?.label}".`}
                  </div>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Pemesan</th>
                      <th>Jenis Kayu</th>
                      <th>Volume</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => {
                      const sc = STATUS_CONFIG[p.status]
                      const busy = updatingId === p.id
                      return (
                        <tr key={p.id}>
                          <td>
                            <div className="pemesan-name">{p.nama_pemesan}</div>
                            <div className="pemesan-date">{formatTanggal(p.created_at)}</div>
                          </td>
                          <td>
                            {p.kayu ? (
                              <>
                                <div className="kayu-name">{p.kayu.nama}</div>
                                <div className="kayu-code">{p.kayu.kode}</div>
                              </>
                            ) : <span style={{ color: 'var(--text3)' }}>—</span>}
                          </td>
                          <td>
                            {p.volume_m3 != null
                              ? <span className="vol-val">{p.volume_m3} m³</span>
                              : <span style={{ color: 'var(--text3)' }}>—</span>}
                          </td>
                          <td>
                            <span className="status-pill" style={{ color: sc.color, background: sc.bg, borderColor: sc.border }}>
                              <span className="status-dot" style={{ background: sc.color }}/>
                              {sc.label}
                            </span>
                          </td>
                          <td>
                            <div className="action-row">
                              <button className="act-btn view" onClick={() => setDetailItem(p)}>
                                <IconEye/> Detail
                              </button>
                              {p.status === 'menunggu' && (
                                <button className="act-btn confirm" disabled={busy}
                                  onClick={() => updateStatus(p.id, 'dikonfirmasi')}>
                                  {busy ? <span className="spin"/> : <IconCheck/>} Konfirmasi
                                </button>
                              )}
                              {p.status === 'dikonfirmasi' && (
                                <button className="act-btn done" disabled={busy}
                                  onClick={() => updateStatus(p.id, 'selesai')}>
                                  {busy ? <span className="spin"/> : <IconDone/>} Selesai
                                </button>
                              )}
                              {(p.status === 'menunggu' || p.status === 'dikonfirmasi') && (
                                <button className="act-btn cancel" disabled={busy}
                                  onClick={() => updateStatus(p.id, 'dibatalkan')}>
                                  {busy ? <span className="spin"/> : <IconX/>} Batal
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}