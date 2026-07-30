// app/kayu/[id]/page.tsx
'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { fetchKayu, fetchKriteria } from '@/lib/supabase/queries'
import { KAYU_DEFAULT, KRITERIA_DEFAULT } from '@/lib/saw'
import type { Kayu, Kriteria } from '@/lib/saw'

function ringPattern(baseColor: string, ringColor: string) {
  const rings = Array.from({ length: 7 })
    .map((_, i) => `<circle cx="150" cy="150" r="${16 + i * 19}" />`)
    .join('')
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>
    <rect width='300' height='300' fill='${baseColor}'/>
    <g fill='none' stroke='${ringColor}' stroke-width='2.2' opacity='0.45'>${rings}</g>
    <circle cx='150' cy='150' r='5' fill='${ringColor}' opacity='0.55'/>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export default function WoodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const kayuId = resolvedParams.id
  const router = useRouter()

  const [kayu, setKayu] = useState<Kayu | null>(null)
  const [kriteriaList, setKriteriaList] = useState<Kriteria[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [allKayu, allKriteria] = await Promise.all([fetchKayu(), fetchKriteria()])
        const found = allKayu.find((k) => k.id === kayuId || k.kode.toLowerCase() === kayuId.toLowerCase())
        if (found) {
          setKayu(found)
        } else {
          const def = KAYU_DEFAULT.find((k) => k.id === kayuId || k.kode.toLowerCase() === kayuId.toLowerCase())
          if (def) setKayu(def)
        }
        setKriteriaList(allKriteria.length > 0 ? allKriteria : KRITERIA_DEFAULT)
      } catch (err) {
        console.error(err)
        const def = KAYU_DEFAULT.find((k) => k.id === kayuId || k.kode.toLowerCase() === kayuId.toLowerCase())
        if (def) setKayu(def)
        setKriteriaList(KRITERIA_DEFAULT)
      } finally {
        setLoading(false)
      }
    }

    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setIsLoggedIn(true)
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role === 'admin') setUserRole('admin')
        else setUserRole('user')
      }
    }

    load()
    checkAuth()
  }, [kayuId])

  const handleOrder = () => {
    if (isLoggedIn) {
      router.push(`/user?pesan=${kayu?.id || ''}`)
    } else {
      router.push('/login?redirect=/user')
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#3D2B1F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FAF6EF' }}>
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, letterSpacing: 2, textTransform: 'uppercase' }}>Memuat Detail Kayu...</p>
      </div>
    )
  }

  if (!kayu) {
    return (
      <div style={{ minHeight: '100vh', background: '#3D2B1F', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#FAF6EF', gap: 20 }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28 }}>Kayu Tidak Ditemukan</h2>
        <Link href="/" style={{ color: '#C4893A', textDecoration: 'none', fontWeight: 700 }}>← Kembali ke Landing Page</Link>
      </div>
    )
  }

  const bgFallback = '#7C4A2D'
  const ringColor = '#3D2115'
  const photoUrl = kayu.foto || ''

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Lato:wght@300;400;700&display=swap');

        :root {
          --cream: #FAF6EF;
          --bark: #3D2B1F;
          --wood: #7C4A2D;
          --honey: #C4893A;
          --light: #F5EEE3;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Lato', sans-serif; background: var(--cream); color: var(--bark); min-height: 100vh; }

        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 6%; height: 68px;
          background: rgba(250,246,239,0.95); backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(61,43,31,0.08);
        }

        .nav-logo { display: flex; align-items: center; gap: 11px; text-decoration: none; }
        .nav-logo-mark { width: 34px; height: 34px; background: var(--bark); display: flex; align-items: center; justify-content: center; }
        .nav-logo-mark svg { width: 16px; height: 16px; color: var(--honey); }
        .nav-brand-name { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 600; color: var(--bark); }
        .nav-brand-sub { font-size: 8.5px; color: var(--wood); letter-spacing: 2px; text-transform: uppercase; display: block; }

        .nav-actions { display: flex; align-items: center; gap: 16px; }
        .btn-back {
          display: inline-flex; align-items: center; gap: 6px;
          color: var(--bark); text-decoration: none; font-size: 12px; font-weight: 700;
        }

        .btn-action {
          background: var(--bark); color: var(--cream);
          padding: 10px 20px; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
          text-decoration: none; transition: background 0.2s;
        }
        .btn-action:hover { background: var(--wood); }

        .detail-page { padding: 110px 6% 80px; max-width: 1200px; margin: 0 auto; }

        .detail-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 50px; align-items: start; }
        @media (max-width: 860px) { .detail-grid { grid-template-columns: 1fr; } }

        .photo-card {
          width: 100%; height: 420px; border-radius: 4px; overflow: hidden;
          box-shadow: 0 20px 48px rgba(61,43,31,0.15);
          position: relative; background-size: cover; background-position: center;
        }

        .badge-code {
          display: inline-block; padding: 5px 14px; background: rgba(196,137,58,0.15);
          color: var(--honey); border: 1px solid rgba(196,137,58,0.3); font-size: 11px; font-weight: 700;
          letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px;
        }

        .wood-title {
          font-family: 'Playfair Display', serif; font-size: clamp(32px, 4vw, 48px);
          font-weight: 500; color: var(--bark); line-height: 1.1; margin-bottom: 16px;
        }

        .wood-desc { font-size: 15px; font-weight: 300; line-height: 1.8; color: rgba(61,43,31,0.7); margin-bottom: 30px; }

        .specs-hdr { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 500; margin-bottom: 16px; border-bottom: 2px solid var(--honey); padding-bottom: 6px; display: inline-block; }

        .specs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; margin-bottom: 36px; }

        .spec-item {
          background: #fff; padding: 14px 18px; border: 1px solid rgba(61,43,31,0.08);
          display: flex; justify-content: space-between; align-items: center;
        }
        .spec-label { font-size: 12px; color: rgba(61,43,31,0.6); }
        .spec-val { font-weight: 700; color: var(--bark); font-size: 14px; }

        .order-box {
          background: #fff; padding: 24px; border: 1px solid rgba(196,137,58,0.3);
          box-shadow: 0 10px 30px rgba(61,43,31,0.06); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;
        }

        .btn-order {
          background: var(--honey); color: var(--bark);
          font-weight: 700; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase;
          padding: 14px 28px; border: none; cursor: pointer; transition: opacity 0.2s;
        }
        .btn-order:hover { opacity: 0.9; }
      `}</style>

      {/* NAVBAR */}
      <nav className="nav">
        <Link href="/" className="nav-logo">
          <div className="nav-logo-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L3 9v11h6v-6h6v6h6V9z"/>
            </svg>
          </div>
          <div>
            <span className="nav-brand-name">Beuna Jaya Kayu</span>
            <span className="nav-brand-sub">Detail Spesifikasi Kayu</span>
          </div>
        </Link>

        <div className="nav-actions">
          <Link href="/" className="btn-back">← Kembali</Link>
          {isLoggedIn ? (
            <Link href={userRole === 'admin' ? '/admin/dashboard' : '/user'} className="btn-action">
              Dashboard Saya
            </Link>
          ) : (
            <Link href="/login" className="btn-action">
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* CONTENT */}
      <div className="detail-page">
        <div className="detail-grid">
          {/* Photo */}
          <div
            className="photo-card"
            style={{
              backgroundColor: bgFallback,
              position: 'relative',
              overflow: 'hidden',
              backgroundImage: `url(${ringPattern(bgFallback, ringColor)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {kayu.foto ? (
              <img
                src={kayu.foto.trim()}
                alt={kayu.nama}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'relative', zIndex: 1 }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none'
                }}
              />
            ) : null}
          </div>

          {/* Details */}
          <div>
            <span className="badge-code">Kode Kayu: {kayu.kode}</span>
            <h1 className="wood-title">{kayu.nama}</h1>
            <p className="wood-desc">
              {kayu.deskripsi || 'Merupakan jenis kayu unggulan yang siap memenuhi standar konstruksi, industri furnitur, maupun kebutuhan arsitektur Anda.'}
            </p>

            <h3 className="specs-hdr">Nilai Kriteria Evaluasi</h3>
            <div className="specs-grid">
              {kriteriaList.map((k) => (
                <div className="spec-item" key={k.id}>
                  <span className="spec-label">{k.nama} ({k.id})</span>
                  <span className="spec-val">
                    {kayu.nilai[k.id] !== undefined
                      ? k.id === 'C3'
                        ? `Rp ${Number(kayu.nilai[k.id]).toLocaleString('id-ID')}`
                        : kayu.nilai[k.id]
                      : '—'}
                  </span>
                </div>
              ))}
            </div>

            <div className="order-box">
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--honey)' }}>Tertarik dengan jenis kayu ini?</div>
                <div style={{ fontSize: 13, color: 'rgba(61,43,31,0.6)', marginTop: 2 }}>Pesan sekarang melalui sistem terintegrasi kami.</div>
              </div>
              <button className="btn-order" onClick={handleOrder}>
                Pesan {kayu.nama} →
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
