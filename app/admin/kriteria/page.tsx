// app/admin/kriteria/page.tsx
'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { totalBobot, type Kriteria, type JenisAtribut } from '@/lib/saw'
import { fetchKriteria, upsertKriteria, deleteKriteria } from '@/lib/supabase/queries'

// ── Icons (sama seperti halaman lain) ──
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
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
  </svg>
)
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)
const IconAlert = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)

type FormState = {
  id?: string
  kode: string
  nama: string
  jenis: JenisAtribut
  bobot: string
  urutan: string
}

const emptyForm = (nextUrutan: number): FormState => ({
  kode: '', nama: '', jenis: 'benefit', bobot: '', urutan: String(nextUrutan),
})

export default function KriteriaPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [daftarKriteria, setDaftarKriteria] = useState<Kriteria[]>([])
  const [dataLoading, setDataLoading]       = useState(true)
  const [dataError, setDataError]           = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm]           = useState<FormState>(emptyForm(1))
  const [isEdit, setIsEdit]       = useState(false)
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<Kriteria | null>(null)
  const [deleting, setDeleting]         = useState(false)

  // ── Auth guard ──
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setUser(user)
      setLoading(false)
    }
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) router.replace('/login')
    })
    return () => subscription.unsubscribe()
  }, [router])

  // ── Fetch data ──
  const loadData = useCallback(async () => {
    setDataLoading(true)
    setDataError(null)
    try {
      const kriteria = await fetchKriteria()
      setDaftarKriteria(kriteria)
    } catch (err) {
      console.error(err)
      setDataError('Gagal memuat data kriteria dari database.')
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!loading) loadData()
  }, [loading, loadData])

  // ── Realtime ──
  useEffect(() => {
    const channel = supabase
      .channel('kriteria_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kriteria' }, () => loadData())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [loadData])

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const bobotTotal = useMemo(() => totalBobot(daftarKriteria), [daftarKriteria])
  const bobotValid  = Math.abs(bobotTotal - 1) < 0.001

  const openCreateModal = () => {
    setForm(emptyForm(daftarKriteria.length + 1))
    setIsEdit(false)
    setFormError(null)
    setModalOpen(true)
  }

  const openEditModal = (k: Kriteria) => {
    setForm({ id: k.id, kode: k.id, nama: k.nama, jenis: k.jenis, bobot: String(k.bobot), urutan: String(k.urutan ?? 99) })
    setIsEdit(true)
    setFormError(null)
    setModalOpen(true)
  }

  const closeModal = () => { if (saving) return; setModalOpen(false) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!form.kode.trim() || !form.nama.trim()) {
      setFormError('Kode dan nama kriteria wajib diisi.')
      return
    }
    const bobotNum = parseFloat(form.bobot)
    if (form.bobot === '' || isNaN(bobotNum) || bobotNum <= 0 || bobotNum > 1) {
      setFormError('Bobot harus berupa angka antara 0 dan 1 (contoh: 0.20).')
      return
    }

    setSaving(true)
    try {
      if (!isEdit) {
        const exists = daftarKriteria.some((k) => k.id.toLowerCase() === form.kode.toLowerCase())
        if (exists) {
          setFormError(`Kode kriteria "${form.kode}" sudah digunakan.`)
          setSaving(false)
          return
        }
      }

      await upsertKriteria({
        id: form.kode.trim().toUpperCase(),
        nama: form.nama.trim(),
        jenis: form.jenis,
        bobot: bobotNum,
        urutan: parseInt(form.urutan) || 99,
      })

      setModalOpen(false)
      await loadData()
    } catch (err) {
      setFormError('Gagal menyimpan data ke database. Silakan coba lagi.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteKriteria(deleteTarget.id)
      setDeleteTarget(null)
      await loadData()
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard',            href: '/admin/dashboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
    { id: 'kayu',      label: 'Jenis Kayu',           href: '/admin/kayu',      icon: <IconWood /> },
    { id: 'kriteria',  label: 'Kriteria & Bobot',     href: '/admin/kriteria',  icon: <IconScale /> },
    { id: 'pesanan',   label: 'Pesanan',               href: '/admin/pesanan',   icon: <IconBox /> },
    { id: 'riwayat',   label: 'Riwayat Perhitungan',   href: '/admin/riwayat',   icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg> },
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
          --bg: #0E0A07; --surface: #16110D; --surface2: #1E1610;
          --border: rgba(255,255,255,0.05); --border2: rgba(255,255,255,0.08);
          --honey: #C8892A; --cream: #FAF6EF;
          --text: rgba(250,246,239,0.85); --text2: rgba(250,246,239,0.45); --text3: rgba(250,246,239,0.22);
          --sidebar-w: 240px;
        }
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Lato', sans-serif; background: var(--bg); color: var(--text); }

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
        .btn-logout { display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 12px; background: none; border: 1px solid rgba(255,255,255,0.06); color: var(--text2); font-size: 11px; letter-spacing: 1px; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
        .btn-logout:hover:not(:disabled) { background: rgba(192,57,43,0.08); border-color: rgba(192,57,43,0.25); color: rgba(220,80,60,0.9); }
        .btn-logout:disabled { opacity: 0.4; cursor: not-allowed; }

        .main { flex: 1; margin-left: var(--sidebar-w); display: flex; flex-direction: column; min-height: 100vh; }
        @media (max-width: 900px) { .main { margin-left: 0; } }
        .topbar { position: sticky; top: 0; z-index: 100; height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; background: rgba(14,10,7,0.88); backdrop-filter: blur(16px); border-bottom: 1px solid var(--border); }
        .topbar-left { display: flex; align-items: center; gap: 16px; }
        .menu-toggle { display: none; background: none; border: none; color: var(--text2); cursor: pointer; padding: 4px; }
        @media (max-width: 900px) { .menu-toggle { display: flex; align-items: center; } }
        .topbar-title { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 400; color: var(--cream); }

        .content { padding: 36px 32px 60px; flex: 1; }
        .error-banner { display: flex; align-items: center; gap: 12px; padding: 14px 20px; margin-bottom: 20px; border: 1px solid rgba(231,76,60,0.3); background: rgba(231,76,60,0.06); color: #E88B82; font-size: 13px; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
        .page-title { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 400; color: var(--cream); margin-bottom: 4px; }
        .page-sub { font-size: 12.5px; color: var(--text2); font-weight: 300; }

        .btn-primary { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: var(--honey); color: #1A1208; border: none; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; cursor: pointer; transition: opacity 0.2s; }
        .btn-primary:hover:not(:disabled) { opacity: 0.85; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .bobot-banner { display: flex; align-items: center; gap: 12px; padding: 14px 20px; margin-bottom: 20px; border: 1px solid; font-size: 13px; }
        .bobot-banner.valid { border-color: rgba(39,174,96,0.25); background: rgba(39,174,96,0.06); color: rgba(39,174,96,0.9); }
        .bobot-banner.invalid { border-color: rgba(231,76,60,0.25); background: rgba(231,76,60,0.06); color: #E88B82; }
        .bobot-banner b { font-family: 'Lato', monospace; }

        .panel { background: var(--surface); border: 1px solid var(--border); overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; min-width: 640px; }
        .data-table th { text-align: left; padding: 12px 20px; font-size: 9px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text3); border-bottom: 1px solid var(--border); white-space: nowrap; }
        .data-table td { padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 13px; font-weight: 300; color: var(--text2); vertical-align: middle; }
        .data-table tr:last-child td { border-bottom: none; }
        .data-table tr:hover td { background: rgba(255,255,255,0.02); }
        .kode-badge { display: inline-block; padding: 2px 8px; font-size: 10px; font-weight: 700; border: 1px solid rgba(200,137,42,0.3); color: var(--honey); background: rgba(200,137,42,0.06); }
        .nama-cell { color: var(--cream); font-weight: 400; }
        .jenis-badge { display: inline-block; padding: 2px 10px; font-size: 9px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; border: 1px solid; }
        .jenis-badge.benefit { color: rgba(39,174,96,0.9); border-color: rgba(39,174,96,0.3); background: rgba(39,174,96,0.06); }
        .jenis-badge.cost { color: rgba(231,76,60,0.9); border-color: rgba(231,76,60,0.3); background: rgba(231,76,60,0.06); }
        .bobot-wrap { display: flex; align-items: center; gap: 10px; }
        .bobot-bar-track { flex: 1; height: 3px; background: rgba(255,255,255,0.06); max-width: 100px; }
        .bobot-bar-fill { height: 100%; background: var(--honey); transition: width 0.5s ease; }
        .bobot-value { font-size: 13px; color: var(--cream); min-width: 36px; text-align: right; font-family: 'Lato', monospace; }
        .action-cell { display: flex; gap: 8px; white-space: nowrap; }
        .icon-btn { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; background: none; border: 1px solid var(--border2); color: var(--text2); cursor: pointer; transition: all 0.2s; }
        .icon-btn:hover { color: var(--cream); border-color: rgba(255,255,255,0.2); }
        .icon-btn.danger:hover { color: #E74C3C; border-color: rgba(231,76,60,0.3); background: rgba(231,76,60,0.06); }
        .total-row td { font-weight: 700; color: var(--cream); border-top: 1px solid var(--border2); }
        .empty-state { padding: 60px 20px; text-align: center; color: var(--text3); font-size: 13px; }
        .loading-state { padding: 40px 20px; text-align: center; color: var(--text3); font-size: 13px; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 300; padding: 20px; }
        .modal-box { background: var(--surface); border: 1px solid var(--border2); max-width: 460px; width: 100%; max-height: 88vh; overflow-y: auto; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--surface); }
        .modal-title { font-family: 'Playfair Display', serif; font-size: 17px; color: var(--cream); }
        .modal-close { background: none; border: none; color: var(--text2); cursor: pointer; }
        .modal-body { padding: 24px; }
        .form-row { margin-bottom: 16px; }
        .form-row.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-label { display: block; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--text2); margin-bottom: 6px; }
        .form-input, .form-select { width: 100%; padding: 10px 12px; background: var(--surface2); border: 1px solid var(--border2); color: var(--cream); font-size: 13px; font-family: 'Lato', sans-serif; }
        .form-input:focus, .form-select:focus { outline: none; border-color: rgba(200,137,42,0.5); }
        .form-hint { font-size: 11px; color: var(--text3); margin-top: 6px; }
        .form-error { background: rgba(231,76,60,0.08); border: 1px solid rgba(231,76,60,0.25); color: #E88B82; font-size: 12px; padding: 10px 12px; margin-bottom: 16px; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid var(--border); }
        .btn-secondary { padding: 10px 18px; background: none; border: 1px solid var(--border2); color: var(--text2); font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; cursor: pointer; }
        .btn-secondary:hover { color: var(--cream); }
        .btn-danger { padding: 10px 18px; background: #C0392B; color: var(--cream); border: none; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; cursor: pointer; }
        .btn-danger:hover:not(:disabled) { opacity: 0.85; }
        .btn-danger:disabled, .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .overlay-sidebar { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 150; }
        .overlay-sidebar.open { display: block; }
        .spin { width: 14px; height: 14px; border: 1.5px solid rgba(255,255,255,0.2); border-top-color: var(--text2); border-radius: 50%; animation: spinA 0.7s linear infinite; display: inline-block; }
        @keyframes spinA { to { transform: rotate(360deg); } }
      `}</style>

      <div className={`overlay-sidebar${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)}/>

      <div className="dash-wrap">
        {/* Sidebar */}
        <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
          <Link href="/admin/dashboard" className="sidebar-logo">
            <div className="logo-mark"><IconWood/></div>
            <div>
              <span className="logo-name">Beuna Jaya Kayu</span>
              <span className="logo-sub">SPK · Metode SAW</span>
            </div>
          </Link>
          <nav className="sidebar-nav">
            <div className="nav-section-label">Menu Utama</div>
            {navItems.map(item => (
              <Link key={item.id} href={item.href}
                className={`nav-item${item.id === 'kriteria' ? ' active' : ''}`}
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
              <IconLogout/> {loggingOut ? 'Keluar...' : 'Logout'}
            </button>
          </div>
        </aside>

        <main className="main">
          <header className="topbar">
            <div className="topbar-left">
              <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                {sidebarOpen ? <IconClose/> : <IconMenu/>}
              </button>
              <span className="topbar-title">Kriteria & Bobot SAW</span>
            </div>
          </header>

          <div className="content">
            {dataError && <div className="error-banner">⚠ {dataError}</div>}

            <div className="page-header">
              <div>
                <h1 className="page-title">Kriteria & Bobot</h1>
                <p className="page-sub">Atur kriteria penilaian (Cj), jenis atribut, dan bobot (Wj) — total bobot wajib 1.00.</p>
              </div>
              <button className="btn-primary" onClick={openCreateModal} disabled={dataLoading}>
                <IconPlus/> Tambah Kriteria
              </button>
            </div>

            {!dataLoading && (
              <div className={`bobot-banner ${bobotValid ? 'valid' : 'invalid'}`}>
                {bobotValid ? <IconCheck/> : <IconAlert/>}
                <span>
                  Total bobot saat ini: <b>{bobotTotal.toFixed(2)}</b>{' '}
                  {bobotValid
                    ? '— valid, sesuai ketentuan SAW (Σ Wj = 1,00).'
                    : '— belum valid. Sesuaikan bobot agar totalnya tepat 1,00.'}
                </span>
              </div>
            )}

            <div className="panel">
              {dataLoading ? (
                <div className="loading-state">
                  <span className="spin" style={{ display: 'inline-block', marginBottom: 8 }}/><br/>
                  Memuat data dari database...
                </div>
              ) : daftarKriteria.length === 0 ? (
                <div className="empty-state">Belum ada kriteria. Tambahkan minimal satu kriteria.</div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Kode</th>
                      <th>Nama Kriteria</th>
                      <th>Jenis Atribut</th>
                      <th>Bobot (Wj)</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daftarKriteria.map((k, i) => (
                      <tr key={k.id}>
                        <td style={{ color: 'var(--text3)', width: 32 }}>{i + 1}</td>
                        <td><span className="kode-badge">{k.id}</span></td>
                        <td className="nama-cell">{k.nama}</td>
                        <td>
                          <span className={`jenis-badge ${k.jenis}`}>
                            {k.jenis === 'benefit' ? 'Benefit' : 'Cost'}
                          </span>
                        </td>
                        <td>
                          <div className="bobot-wrap">
                            <div className="bobot-bar-track">
                              <div className="bobot-bar-fill" style={{ width: `${k.bobot * 100}%` }}/>
                            </div>
                            <span className="bobot-value">{k.bobot.toFixed(2)}</span>
                          </div>
                        </td>
                        <td>
                          <div className="action-cell">
                            <button className="icon-btn" onClick={() => openEditModal(k)} title="Edit">
                              <IconEdit/>
                            </button>
                            <button className="icon-btn danger" onClick={() => setDeleteTarget(k)} title="Hapus">
                              <IconTrash/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr className="total-row">
                      <td colSpan={4}>Total Bobot</td>
                      <td style={{ fontFamily: 'monospace' }}>{bobotTotal.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal tambah/edit */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{isEdit ? 'Edit Kriteria' : 'Tambah Kriteria'}</span>
              <button className="modal-close" onClick={closeModal}><IconClose/></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formError && <div className="form-error">{formError}</div>}

                <div className="form-row two-col">
                  <div>
                    <label className="form-label">Kode Kriteria</label>
                    <input
                      className="form-input"
                      placeholder="C1, C2, ..."
                      value={form.kode}
                      onChange={(e) => setForm({ ...form, kode: e.target.value })}
                      disabled={isEdit}
                    />
                  </div>
                  <div>
                    <label className="form-label">Jenis Atribut</label>
                    <select
                      className="form-select"
                      value={form.jenis}
                      onChange={(e) => setForm({ ...form, jenis: e.target.value as JenisAtribut })}
                    >
                      <option value="benefit">Benefit (semakin besar = baik)</option>
                      <option value="cost">Cost (semakin kecil = baik)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <label className="form-label">Nama Kriteria</label>
                  <input
                    className="form-input"
                    placeholder="Contoh: Kekuatan Kayu"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  />
                </div>

                <div className="form-row two-col">
                  <div>
                    <label className="form-label">Bobot (Wj)</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="1"
                      placeholder="0.20"
                      value={form.bobot}
                      onChange={(e) => setForm({ ...form, bobot: e.target.value })}
                    />
                    <p className="form-hint">0 &lt; Wj ≤ 1, total semua = 1,00</p>
                  </div>
                  <div>
                    <label className="form-label">Urutan Tampil</label>
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={form.urutan}
                      onChange={(e) => setForm({ ...form, urutan: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal} disabled={saving}>
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Kriteria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal hapus */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="modal-box" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Hapus Kriteria</span>
              <button className="modal-close" onClick={() => setDeleteTarget(null)}><IconClose/></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                Apakah Anda yakin ingin menghapus kriteria{' '}
                <strong style={{ color: 'var(--cream)' }}>{deleteTarget.nama}</strong> ({deleteTarget.id})?
                Total bobot akan berubah dan perlu disesuaikan kembali agar tepat 1,00.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Batal
              </button>
              <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}