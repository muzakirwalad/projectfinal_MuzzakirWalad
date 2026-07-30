'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { fetchKayu, fetchKriteria } from '@/lib/supabase/queries'
import { calculateSAW, getMatchPercentage, getMatchLabel, KAYU_DEFAULT, KRITERIA_DEFAULT } from '@/lib/saw'
import type { Kayu, Kriteria, HasilSAW } from '@/lib/saw'

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

// ── Kamus kebutuhan → kriteria ──
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

function findKriteriaMatch(daftarKriteria: Kriteria[], query: string): Kriteria | null {
  const q = query.toLowerCase().trim()
  if (!q) return null

  const direct = daftarKriteria.find(k => k.nama.toLowerCase().includes(q) || q.includes(k.nama.toLowerCase()))
  if (direct) return direct

  for (const group of NEED_SYNONYMS) {
    const isMatch = group.keywords.some(kw => q.includes(kw) || kw.includes(q))
    if (!isMatch) continue
    const found = daftarKriteria.find(k => group.matches.some(m => k.nama.toLowerCase().includes(m)))
    if (found) return found
  }
  return null
}

export default function HomePage() {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null)

  // Data Kayu & Kriteria
  const [daftarKayu, setDaftarKayu] = useState<Kayu[]>([])
  const [daftarKriteria, setDaftarKriteria] = useState<Kriteria[]>([])
  const [hasilSAW, setHasilSAW] = useState<HasilSAW[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Pencarian Kebutuhan Publik
  const [searchQuery, setSearchQuery] = useState('')

  // Carousel State
  const [carouselIdx, setCarouselIdx] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)

  // Tracking error gambar menggunakan URL spesifik sebagai Key
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({})
  const markImgError = (urlKey: string) => {
    setImgErrors(prev => (prev[urlKey] ? prev : { ...prev, [urlKey]: true }))
  }

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setIsLoggedIn(true)
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role === 'admin') setUserRole('admin')
        else setUserRole('user')
      }
    }

    const loadSAW = async () => {
      setLoadingData(true)
      try {
        const [kList, cList] = await Promise.all([fetchKayu(), fetchKriteria()])
        const kayuData = kList.length > 0 ? kList : KAYU_DEFAULT
        const kriteriaData = cList.length > 0 ? cList : KRITERIA_DEFAULT
        setDaftarKayu(kayuData)
        setDaftarKriteria(kriteriaData)
        setHasilSAW(calculateSAW(kayuData, kriteriaData))
        
        // Reset state error gambar saat data kayu baru terisi dari database
        setImgErrors({})
      } catch (err) {
        console.error(err)
        setDaftarKayu(KAYU_DEFAULT)
        setDaftarKriteria(KRITERIA_DEFAULT)
        setHasilSAW(calculateSAW(KAYU_DEFAULT, KRITERIA_DEFAULT))
      } finally {
        setLoadingData(false)
      }
    }

    checkAuth()
    loadSAW()
  }, [])

  const handlePesan = (kayuId: string) => {
    if (isLoggedIn) {
      router.push(`/user?pesan=${kayuId}`)
    } else {
      router.push('/login?redirect=/user')
    }
  }

  // Rekomendasi berdasarkan pencarian
  const rekTerbaik = hasilSAW[0] ?? null
  const viTerbaik = rekTerbaik?.vi ?? 0

  type DisplayItem = { kayuId: string; kode: string; nama: string; rank: number; persen: number; foto?: string; deskripsi?: string }
  const searchResult = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    if (!q) {
      const items: DisplayItem[] = hasilSAW.map(h => {
        const found = daftarKayu.find(k => k.id === h.kayuId)
        return {
          kayuId: h.kayuId, kode: h.kode, nama: h.nama, rank: h.rank,
          persen: getMatchPercentage(h.vi, viTerbaik),
          foto: found?.foto,
          deskripsi: found?.deskripsi,
        }
      })
      return { mode: 'all' as const, items, kriteria: null as Kriteria | null }
    }

    const woodMatches = daftarKayu.filter(k =>
      k.nama.toLowerCase().includes(q) ||
      k.kode.toLowerCase().includes(q) ||
      (k.deskripsi ?? '').toLowerCase().includes(q)
    )
    if (woodMatches.length > 0) {
      const items: DisplayItem[] = hasilSAW
        .filter(h => woodMatches.some(w => w.id === h.kayuId))
        .map(h => {
          const found = daftarKayu.find(k => k.id === h.kayuId)
          return {
            kayuId: h.kayuId, kode: h.kode, nama: h.nama, rank: h.rank,
            persen: getMatchPercentage(h.vi, viTerbaik),
            foto: found?.foto,
            deskripsi: found?.deskripsi,
          }
        })
      return { mode: 'wood' as const, items, kriteria: null as Kriteria | null }
    }

    const kriteriaMatch = findKriteriaMatch(daftarKriteria, q)
    if (kriteriaMatch) {
      const items: DisplayItem[] = hasilSAW
        .map(h => ({ h, val: h.nilaiNormal[kriteriaMatch.id] ?? 0 }))
        .sort((a, b) => b.val - a.val)
        .map(({ h, val }, i) => {
          const found = daftarKayu.find(k => k.id === h.kayuId)
          return {
            kayuId: h.kayuId, kode: h.kode, nama: h.nama, rank: i + 1,
            persen: Math.round(val * 100),
            foto: found?.foto,
            deskripsi: found?.deskripsi,
          }
        })
      return { mode: 'criteria' as const, items, kriteria: kriteriaMatch }
    }

    return { mode: 'none' as const, items: [] as DisplayItem[], kriteria: null as Kriteria | null }
  }, [searchQuery, hasilSAW, daftarKayu, daftarKriteria, viTerbaik])

  // Slide Carousel Actions
  const slideNext = () => {
    if (daftarKayu.length === 0) return
    setCarouselIdx((prev) => (prev + 1) % daftarKayu.length)
  }

  const slidePrev = () => {
    if (daftarKayu.length === 0) return
    setCarouselIdx((prev) => (prev - 1 + daftarKayu.length) % daftarKayu.length)
  }

  const heroCards = useMemo(() => {
  if (daftarKayu.length === 0) {
    return [
      { id: '1', cls: 'wcard wcard-c', img: '', fallback: '#C4956A', ring: '#7C5730', name: 'Pinus', grade: 'Ekonomis' },
      { id: '2', cls: 'wcard wcard-b', img: '', fallback: '#A0714F', ring: '#5E3D26', name: 'Meranti', grade: 'Standar' },
      { id: '3', cls: 'wcard wcard-a', img: '', fallback: '#6B3A2A', ring: '#3D2115', name: 'Jati', grade: 'Premium' },
    ]
  }

  const classes = ['wcard wcard-c', 'wcard wcard-b', 'wcard wcard-a']
  const fallbacks = ['#C4956A', '#A0714F', '#6B3A2A']
  const rings = ['#7C5730', '#5E3D26', '#3D2115']

  const semuaHasil = hasilSAW.length > 0
    ? hasilSAW
    : daftarKayu.map((k, i) => ({ kayuId: k.id, nama: k.nama, kode: k.kode, rank: i + 1, vi: 1, nilaiNormal: {} }))

  // Prioritaskan kayu yang punya foto, urutkan tetap berdasarkan rank
  const adaFoto = semuaHasil
    .map(h => ({ h, kayuObj: daftarKayu.find(k => k.id === h.kayuId) }))
    .filter(({ kayuObj }) => kayuObj?.foto)
    .sort((a, b) => a.h.rank - b.h.rank)

  const tanpaFoto = semuaHasil
    .map(h => ({ h, kayuObj: daftarKayu.find(k => k.id === h.kayuId) }))
    .filter(({ kayuObj }) => !kayuObj?.foto)
    .sort((a, b) => a.h.rank - b.h.rank)

  const topItems = [...adaFoto, ...tanpaFoto].slice(0, 3)

  return topItems.map(({ h: item, kayuObj }, idx) => ({
    id: item.kayuId,
    cls: classes[idx % 3],
    img: kayuObj?.foto || '',
    fallback: fallbacks[idx % 3],
    ring: rings[idx % 3],
    name: item.nama,
    grade: item.rank === 1 ? 'Rekomendasi Utama' : `Peringkat #${item.rank}`,
  }))
}, [daftarKayu, hasilSAW])

  const galleryPhotos = useMemo(() => {
  const defaultMeta = [
    { cls: 'gal-photo gal-a', fallback: '#6B3A2A', ring: '#3D2115', label: 'Serat Kayu Jati', keywords: ['jati'] },
    { cls: 'gal-photo gal-b', fallback: '#5C3317', ring: '#2D170B', label: 'Serat Kayu Ulin', keywords: ['ulin', 'besi'] },
    { cls: 'gal-photo gal-c', fallback: '#C4956A', ring: '#7C5730', label: 'Serat Kayu Pinus', keywords: ['pinus'] },
  ]

  // Kayu yang benar-benar punya foto di Supabase
  const kayuBerFoto = daftarKayu.filter(k => k.foto && k.foto.trim())

  const dipakai = new Set<string>()

  const hasil = defaultMeta.map(meta => {
    // 1. Coba cocokkan nama kayu sesuai keyword (jati/ulin/pinus)
    let cocok = kayuBerFoto.find(
      k => !dipakai.has(k.id) && meta.keywords.some(kw => k.nama.toLowerCase().includes(kw))
    )
    // 2. Kalau tidak ada yang cocok, pakai kayu manapun yang masih punya foto & belum dipakai
    if (!cocok) {
      cocok = kayuBerFoto.find(k => !dipakai.has(k.id))
    }
    if (cocok) dipakai.add(cocok.id)

    return {
      cls: meta.cls,
      img: cocok?.foto || '',
      fallback: meta.fallback,
      ring: meta.ring,
      label: cocok ? `Serat Kayu ${cocok.nama}` : meta.label,
    }
  })

  return hasil
}, [daftarKayu])

  const lokasi = {
    nama: 'Kilang Kayu Beuna Jaya',
    alamat: 'Upah, Dusun Amal, Kec. Bendahara, Simpang Empat, Kota Kuala Simpang, Kabupaten Aceh Tamiang, Aceh 24470',
    mapsLink: 'https://maps.app.goo.gl/ZSVP5RCz2HZebjkKA?g_st=ac',
    embedSrc: 'https://www.google.com/maps?q=Kilang+Kayu+Beuna+Jaya,+Upah,+Dusun+Amal,+Kec.+Bendahara,+Simpang+Empat,+Kota+Kuala+Simpang,+Kabupaten+Aceh+Tamiang,+Aceh+24470&output=embed',
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=Lato:wght@300;400;700&display=swap');

        :root {
          --cream: #FAF6EF;
          --bark: #3D2B1F;
          --wood: #7C4A2D;
          --honey: #C4893A;
          --sand: #E8D5B7;
          --light: #F5EEE3;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        body {
          font-family: 'Lato', sans-serif;
          background: var(--cream);
          color: var(--bark);
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        /* ── NAVBAR ── */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 6%; height: 68px;
          background: rgba(250,246,239,0.94);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(61,43,31,0.07);
        }

        .nav-logo { display: flex; align-items: center; gap: 11px; text-decoration: none; }
        .nav-logo-mark { width: 34px; height: 34px; background: var(--bark); display: flex; align-items: center; justify-content: center; }
        .nav-logo-mark svg { width: 16px; height: 16px; color: var(--honey); }
        .nav-brand-name { font-family: 'Playfair Display', serif; font-size: 14.5px; font-weight: 600; color: var(--bark); line-height: 1; }
        .nav-brand-sub { font-size: 8.5px; color: var(--wood); letter-spacing: 2px; text-transform: uppercase; margin-top: 3px; display: block; }

        .nav-links { display: flex; align-items: center; gap: 30px; list-style: none; }
        .nav-links a { font-size: 12.5px; font-weight: 400; color: var(--bark); text-decoration: none; letter-spacing: 0.3px; position: relative; padding-bottom: 3px; transition: color 0.2s; }
        .nav-links a::after { content: ''; position: absolute; bottom: 0; left: 0; width: 0; height: 1px; background: var(--honey); transition: width 0.25s; }
        .nav-links a:hover { color: var(--wood); }
        .nav-links a:hover::after { width: 100%; }

        .btn-nav-login {
          display: inline-flex; align-items: center; gap: 7px;
          background: var(--bark); color: var(--cream) !important;
          font-size: 10.5px !important; font-weight: 700 !important;
          letter-spacing: 1.5px !important; text-transform: uppercase;
          padding: 10px 19px; text-decoration: none;
          transition: background 0.2s !important;
        }
        .btn-nav-login::after { display: none !important; }
        .btn-nav-login:hover { background: var(--wood) !important; color: var(--cream) !important; }

        .hamburger { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 4px; }
        .hamburger span { display: block; width: 20px; height: 1.5px; background: var(--bark); }

        @media (max-width: 820px) {
          .nav-links { display: none; }
          .hamburger { display: flex; }
          .nav-links.open {
            display: flex; flex-direction: column; align-items: flex-start;
            position: fixed; top: 68px; left: 0; right: 0;
            background: var(--cream); padding: 22px 6% 30px;
            border-bottom: 1px solid var(--sand); gap: 17px;
            box-shadow: 0 12px 32px rgba(61,43,31,0.07);
          }
        }

        /* ── HERO ── */
        .hero-bg { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle at 82% 22%, rgba(196,137,58,0.08) 0%, transparent 46%); }
        .hero-content { flex: 1; max-width: 600px; position: relative; z-index: 2; }
        .hero-badge { display: inline-flex; align-items: center; gap: 8px; border: 1px solid rgba(196,137,58,0.32); padding: 7px 16px; margin-bottom: 26px; animation: fadeUp 0.7s ease both; }
        .badge-dot { width: 5px; height: 5px; background: var(--honey); border-radius: 50%; }
        .badge-text { font-size: 9.5px; font-weight: 700; color: var(--honey); letter-spacing: 2px; text-transform: uppercase; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }

        .hero-title { font-family: 'Playfair Display', serif; font-size: clamp(38px, 5.6vw, 66px); font-weight: 400; line-height: 1.08; color: var(--bark); animation: fadeUp 0.7s 0.06s ease both; }
        .hero-title em { font-style: italic; color: var(--wood); display: block; }
        .hero-title span { color: var(--honey); }
        .hero-line { width: 50px; height: 2px; background: var(--honey); margin: 24px 0; animation: fadeUp 0.7s 0.1s ease both; }
        .hero-desc { font-size: 15px; font-weight: 300; line-height: 1.8; color: rgba(61,43,31,0.6); max-width: 460px; animation: fadeUp 0.7s 0.14s ease both; }

        .hero-cta { display: flex; align-items: center; gap: 14px; margin-top: 38px; flex-wrap: wrap; animation: fadeUp 0.7s 0.18s ease both; }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--bark); color: var(--cream);
          font-family: 'Lato', sans-serif; font-size: 10.5px; font-weight: 700;
          letter-spacing: 1.6px; text-transform: uppercase;
          padding: 15px 28px; text-decoration: none;
          transition: background 0.2s, transform 0.2s; border: none; cursor: pointer;
        }
        .btn-primary:hover { background: var(--wood); transform: translateY(-1px); }
        .btn-primary svg { transition: transform 0.2s; }
        .btn-primary:hover svg { transform: translateX(3px); }

        .btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; color: var(--bark);
          font-family: 'Lato', sans-serif; font-size: 10.5px; font-weight: 700;
          letter-spacing: 1.6px; text-transform: uppercase;
          padding: 15px 24px; text-decoration: none;
          border: 1px solid rgba(61,43,31,0.2);
          transition: border-color 0.2s, color 0.2s;
        }
        .btn-outline:hover { border-color: var(--honey); color: var(--wood); }

        .hero-stats { display: flex; gap: 38px; margin-top: 48px; padding-top: 26px; border-top: 1px solid rgba(61,43,31,0.08); animation: fadeUp 0.7s 0.26s ease both; }
        .stat-num { font-family: 'Playfair Display', serif; font-size: 27px; font-weight: 600; color: var(--bark); line-height: 1; }
        .stat-lbl { font-size: 10.5px; color: rgba(61,43,31,0.4); margin-top: 5px; }

        .hero-visual { flex: 1; display: flex; justify-content: flex-end; align-items: center; position: relative; z-index: 2; animation: fadeUp 0.7s 0.1s ease both; }
        @media (max-width: 880px) { .hero-visual { display: none; } }

        .card-stack { position: relative; width: 300px; height: 380px; }
        .wcard { position: absolute; background: white; box-shadow: 0 16px 44px rgba(61,43,31,0.13); overflow: hidden; transition: transform 0.25s; }
        .wcard:hover { transform: translateY(-5px) !important; }
        .wcard-a { width: 220px; height: 280px; top: 70px; right: 0; transform: rotate(3deg); }
        .wcard-b { width: 185px; height: 240px; top: 20px; right: 110px; transform: rotate(-4deg); }
        .wcard-c { width: 165px; height: 200px; top: 120px; right: 190px; transform: rotate(1deg); }
        .wcard-top { height: 64%; background-size: cover, cover; background-position: center; background-repeat: no-repeat; position: relative; }
        .wcard-top::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.16) 100%); }
        .wcard-bot { padding: 12px 14px; }
        .wcard-name { font-family: 'Playfair Display', serif; font-size: 14.5px; font-weight: 600; color: var(--bark); }
        .wcard-grade { font-size: 8.5px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: var(--honey); margin-top: 2px; }

        /* ── SECTIONS ── */
        section { padding: 92px 6%; }
        .eyebrow { font-size: 9.5px; font-weight: 700; letter-spacing: 2.8px; text-transform: uppercase; color: var(--honey); margin-bottom: 10px; display: flex; align-items: center; gap: 10px; }
        .eyebrow::before { content: ''; display: block; width: 20px; height: 1px; background: var(--honey); }
        .sec-title { font-family: 'Playfair Display', serif; font-size: clamp(27px, 3.8vw, 40px); font-weight: 400; color: var(--bark); line-height: 1.15; margin-bottom: 14px; }
        .sec-title em { font-style: italic; color: var(--wood); }
        .sec-desc { font-size: 13.5px; font-weight: 300; color: rgba(61,43,31,0.58); line-height: 1.75; max-width: 500px; }

        /* ── CAROUSEL JENIS KAYU ── */
        #jenis-kayu { background: var(--light); position: relative; }
        .slider-controls { display: flex; gap: 10px; align-items: center; }
        .slider-arrow { width: 42px; height: 42px; border: 1px solid rgba(61,43,31,0.2); background: white; color: var(--bark); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .slider-arrow:hover { background: var(--bark); color: var(--cream); border-color: var(--bark); }

        .slider-container { overflow: hidden; margin-top: 30px; position: relative; padding: 10px 0 30px; }
        .slider-track { display: flex; transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); gap: 24px; }

        .slide-card {
          flex: 0 0 calc(33.333% - 16px); min-width: 280px; background: white;
          border-radius: 6px; overflow: hidden; box-shadow: 0 10px 30px rgba(61,43,31,0.06);
          transition: transform 0.3s, box-shadow 0.3s; position: relative; display: flex; flex-direction: column;
        }
        @media (max-width: 900px) { .slide-card { flex: 0 0 calc(50% - 12px); } }
        @media (max-width: 600px) { .slide-card { flex: 0 0 100%; } }

        .slide-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(61,43,31,0.12); }
        .slide-img { height: 200px; background-size: cover; background-position: center; position: relative; }
        .slide-body { padding: 22px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
        .slide-title { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 500; color: var(--bark); margin-bottom: 6px; }
        .slide-code { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--honey); margin-bottom: 10px; }
        .slide-desc { font-size: 12.5px; color: rgba(61,43,31,0.6); line-height: 1.6; margin-bottom: 18px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

        .btn-detail { display: inline-flex; align-items: center; justify-content: space-between; width: 100%; padding: 10px 16px; background: var(--cream); border: 1px solid rgba(61,43,31,0.1); color: var(--bark); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; transition: background 0.2s; }
        .btn-detail:hover { background: var(--bark); color: var(--cream); }

        .slider-dots { display: flex; justify-content: center; gap: 8px; margin-top: 20px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(61,43,31,0.2); cursor: pointer; transition: all 0.2s; }
        .dot.active { width: 24px; border-radius: 4px; background: var(--honey); }

        /* ── REKOMENDASI SAW ── */
        #rekomendasi { background: var(--bark); color: var(--cream); }
        #rekomendasi .sec-title { color: var(--cream); }
        #rekomendasi .sec-desc { color: rgba(250,246,239,0.5); }

        .pub-search-box {
          display: flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15);
          padding: 14px 18px; margin: 26px 0 16px; border-radius: 4px; transition: border-color 0.2s;
        }
        .pub-search-box:focus-within { border-color: var(--honey); }
        .pub-search-input {
          flex: 1; background: none; border: none; outline: none;
          color: var(--cream); font-family: 'Lato', sans-serif; font-size: 14px;
        }
        .pub-search-input::placeholder { color: rgba(250,246,239,0.35); }

        .pub-chip-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 28px; }
        .pub-chip {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12);
          color: rgba(250,246,239,0.7); font-size: 11.5px; padding: 7px 14px; cursor: pointer;
          transition: all 0.2s; border-radius: 30px;
        }
        .pub-chip:hover { border-color: var(--honey); color: var(--cream); }
        .pub-chip.active { background: var(--honey); color: var(--bark); border-color: var(--honey); font-weight: 700; }

        .rek-list { display: flex; flex-direction: column; gap: 16px; }
        .rek-card {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          padding: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 20px; transition: border-color 0.2s;
        }
        .rek-card:hover { border-color: var(--honey); }
        .rek-rank { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 600; color: var(--honey); width: 44px; }
        .rek-info { flex: 1; min-width: 200px; }
        .rek-name { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 500; color: var(--cream); margin-bottom: 4px; }
        .rek-score { font-size: 12px; color: rgba(250,246,239,0.5); }
        .rek-score b { color: var(--honey); }

        /* ── CTA ── */
        #pesan { background: var(--cream); text-align: center; position: relative; overflow: hidden; }
        #pesan::before { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 520px; height: 520px; background: radial-gradient(circle, rgba(196,137,58,0.06) 0%, transparent 70%); }
        .cta-inner { position: relative; z-index: 1; }
        .cta-title { font-family: 'Playfair Display', serif; font-size: clamp(28px, 4.6vw, 48px); font-weight: 400; color: var(--bark); margin-bottom: 18px; line-height: 1.1; }
        .cta-title em { font-style: italic; color: var(--wood); }
        .cta-desc { font-size: 13.5px; font-weight: 300; color: rgba(61,43,31,0.52); max-width: 460px; margin: 0 auto 34px; line-height: 1.75; }
        .cta-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }

        /* ── TENTANG & LOKASI ── */
        #tentang { background: var(--light); }
        .tentang-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 56px; align-items: center; }
        @media (max-width: 880px) { .tentang-grid { grid-template-columns: 1fr; } }
        .gal-wrap { position: relative; height: 420px; }
        @media (max-width: 880px) { .gal-wrap { height: 340px; max-width: 380px; } }
        .gal-photo { position: absolute; background-size: cover, cover; background-position: center; background-repeat: no-repeat; box-shadow: 0 18px 44px rgba(61,43,31,0.14); }
        .gal-a { width: 62%; height: 56%; top: 0; left: 0; }
        .gal-b { width: 56%; height: 50%; top: 34%; right: 0; border: 6px solid var(--light); }
        .gal-c { width: 46%; height: 42%; bottom: 0; left: 8%; border: 6px solid var(--light); }
        .gal-label { position: absolute; bottom: 12px; left: 14px; font-size: 10px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #fff; text-shadow: 0 1px 6px rgba(0,0,0,0.5); }
        .gal-photo::before { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.32) 100%); }

        #lokasi { background: var(--cream); }
        .lokasi-grid { display: grid; grid-template-columns: 1fr 1.15fr; gap: 1px; background: rgba(61,43,31,0.08); border: 1px solid rgba(61,43,31,0.08); margin-top: 8px; }
        @media (max-width: 880px) { .lokasi-grid { grid-template-columns: 1fr; } }
        .lokasi-info { background: var(--bark); padding: 40px 36px; display: flex; flex-direction: column; justify-content: center; }
        .lokasi-name { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 500; color: var(--cream); margin: 4px 0 14px; }
        .lokasi-addr { font-size: 13px; font-weight: 300; color: rgba(250,246,239,0.5); line-height: 1.7; max-width: 340px; margin-bottom: 26px; }
        .lokasi-btn { display: inline-flex; align-items: center; gap: 8px; width: fit-content; background: var(--honey); color: var(--bark); font-size: 10.5px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; padding: 13px 22px; text-decoration: none; transition: opacity 0.2s; }
        .lokasi-btn:hover { opacity: 0.85; }
        .lokasi-map { min-height: 340px; background: var(--light); }
        .lokasi-map iframe { width: 100%; height: 100%; min-height: 340px; border: 0; display: block; filter: grayscale(0.15) contrast(1.02); }

        footer { background: var(--bark); color: rgba(250,246,239,0.45); padding: 52px 6% 26px; }
        .ft-top { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 42px; margin-bottom: 42px; }
        .ft-name { font-family: 'Playfair Display', serif; font-size: 19px; font-weight: 500; color: var(--cream); margin-bottom: 10px; }
        .ft-desc { font-size: 12px; font-weight: 300; line-height: 1.7; max-width: 260px; }
        .ft-col h4 { font-size: 8.5px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--honey); margin-bottom: 17px; }
        .ft-col ul { list-style: none; display: flex; flex-direction: column; gap: 11px; }
        .ft-col a { font-size: 12px; font-weight: 300; color: rgba(250,246,239,0.45); text-decoration: none; transition: color 0.2s; }
        .ft-col a:hover { color: var(--cream); }
        .ft-bottom { border-top: 1px solid rgba(255,255,255,0.06); padding-top: 20px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; font-size: 10.5px; }
      `}</style>

      {/* NAVBAR */}
      <nav className="nav">
        <a href="#home" className="nav-logo">
          <div className="nav-logo-mark" style={{ borderRadius: 6, overflow: 'hidden', background: 'transparent' }}>
            <img src="/logo.png" alt="Logo Beuna Jaya Kayu" style={{ width: 28, height: 28, objectFit: 'contain', display: 'block' }} />
          </div>
          <div>
            <span className="nav-brand-name">Beuna Jaya Kayu</span>
            <span className="nav-brand-sub">Sistem Pendukung Keputusan</span>
          </div>
        </a>

        <ul className={`nav-links${menuOpen ? ' open' : ''}`}>
          <li><a href="#home">Home</a></li>
          <li><a href="#jenis-kayu">Jenis Kayu</a></li>
          <li><a href="#rekomendasi">Rekomendasi Kayu</a></li>
          <li><a href="#pesan">Pesan Kayu</a></li>
          <li><a href="#tentang">Tentang Kami</a></li>
          <li><a href="#lokasi">Lokasi</a></li>
          <li>
            {isLoggedIn ? (
              <Link href={userRole === 'admin' ? '/admin/dashboard' : '/user'} className="btn-nav-login">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                Dashboard Saya
              </Link>
            ) : (
              <Link href="/login" className="btn-nav-login">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
                Login
              </Link>
            )}
          </li>
        </ul>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span/><span/><span/>
        </button>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '100px 6% 80px', position: 'relative', overflow: 'hidden' }} id="home">
        <div className="hero-bg"/>

        <div className="hero-content">
          <div className="hero-badge">
            <div className="badge-dot"/>
            <span className="badge-text">Sistem Pendukung Keputusan Kayu</span>
          </div>
          <h1 className="hero-title">
            Pilih Kayu
            <em>Terbaik untuk</em>
            Kebutuhan <span>Anda</span>
          </h1>
          <div className="hero-line"/>
          <p className="hero-desc">
            Platform cerdas berbasis teknologi SPK untuk membantu Anda menemukan jenis kayu
            yang paling sesuai — berdasarkan kekuatan, harga, ketahanan, dan ketersediaan.
          </p>
          <div className="hero-cta">
            <a href="#rekomendasi" className="btn-primary">
              Mulai Rekomendasi
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
            <a href="#jenis-kayu" className="btn-outline">Lihat Jenis Kayu</a>
          </div>
          <div className="hero-stats">
            {[
              { num: `${daftarKayu.length > 0 ? daftarKayu.length : 12}+`, lbl: 'Jenis Kayu Terdata' },
              { num: `${daftarKriteria.length > 0 ? daftarKriteria.length : 7}`, lbl: 'Kriteria Evaluasi' },
              { num: '98%', lbl: 'Akurasi Rekomendasi' },
            ].map(s => (
              <div key={s.lbl}>
                <div className="stat-num">{s.num}</div>
                <div className="stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* HERO CARDS VISUAL */}
        <div className="hero-visual">
  <div className="card-stack">
    {heroCards.map((c, idx) => {
      return (
        <div 
          className={c.cls} 
          key={c.id || idx}
          style={{
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* BAGIAN ATAS: GAMBAR */}
          <div
            className="wcard-top"
            style={{
              position: 'relative',
              width: '100%',
              height: '180px', // 👈 WAJIB ADA HEIGHT PASTI
              backgroundColor: c.fallback,
              overflow: 'hidden',
            }}
          >
            {c.img ? (
              <img
                src={c.img}
                alt={c.name}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover', // 👈 Memastikan gambar tidak gepeng dan memenuhi box
                  display: 'block',
                  zIndex: 5,
                }}
              />
            ) : (
              /* Fallback jika URL gambar kosong */
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${ringPattern(c.fallback, c.ring)})`,
                  backgroundSize: 'cover',
                }}
              />
            )}
          </div>

          {/* BAGIAN BWAH: NAMA KAYU */}
          <div 
            className="wcard-bot" 
            style={{ 
              position: 'relative', 
              zIndex: 10, 
              backgroundColor: '#ffffff',
              padding: '12px',
            }}
          >
            <div className="wcard-name">{c.name}</div>
            <div className="wcard-grade">{c.grade}</div>
          </div>
        </div>
      )
    })}
  </div>
</div>
      </section>

      {/* CAROUSEL JENIS KAYU */}
      <section id="jenis-kayu">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20, marginBottom: 20 }}>
          <div>
            <div className="eyebrow">Katalog Kayu</div>
            <h2 className="sec-title">Jenis Kayu <em>Unggulan</em></h2>
            <p className="sec-desc">Geser kartu di bawah ini untuk menjelajahi detail spesifikasi setiap jenis kayu.</p>
          </div>
          <div className="slider-controls">
            <button className="slider-arrow" onClick={slidePrev} aria-label="Sebelumnya">←</button>
            <button className="slider-arrow" onClick={slideNext} aria-label="Selanjutnya">→</button>
          </div>
        </div>

        <div className="slider-container">
          <div
            className="slider-track"
            ref={sliderRef}
            style={{ transform: `translateX(-${carouselIdx * (100 / (daftarKayu.length || 1))}%)` }}
          >
            {daftarKayu.map((k) => {
              const photo = k.foto?.trim()
              const slideImgKey = photo ? `slide-${k.id}-${photo}` : `slide-fallback-${k.id}`

              return (
                <div className="slide-card" key={k.id}>
                  <div
                    className="slide-img"
                    style={{
                      backgroundColor: '#7C4A2D',
                      position: 'relative',
                      overflow: 'hidden',
                      backgroundImage: `url(${ringPattern('#7C4A2D', '#3D2115')})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {photo && !imgErrors[slideImgKey] ? (
                      <img
                        key={photo}
                        src={photo}
                        alt={k.nama}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'relative', zIndex: 1 }}
                        onError={() => markImgError(slideImgKey)}
                      />
                    ) : null}
                  </div>
                  <div className="slide-body">
                    <div>
                      <span className="slide-code">KODE: {k.kode}</span>
                      <h3 className="slide-title">{k.nama}</h3>
                      <p className="slide-desc">{k.deskripsi || 'Spesifikasi kayu berkualitas tinggi untuk berbagai keperluan proyek Anda.'}</p>
                    </div>
                    <Link href={`/kayu/${k.id}`} className="btn-detail">
                      Lihat Detail Kayu
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="slider-dots">
          {daftarKayu.map((_, i) => (
            <div
              key={i}
              className={`dot${i === carouselIdx ? ' active' : ''}`}
              onClick={() => setCarouselIdx(i)}
            />
          ))}
        </div>
      </section>

      {/* REKOMENDASI SAW PUBLIK INTERAKTIF */}
      <section id="rekomendasi">
        <div className="eyebrow" style={{ color: 'var(--honey)' }}>Pusat Rekomendasi Cerdas</div>
        <h2 className="sec-title">Cari Rekomendasi <em>Kayu Sesuai Kebutuhan</em></h2>
        <p className="sec-desc">Ketik kata kunci proyek atau pilih kategori kebutuhan Anda untuk mendapatkan urutan kayu terbaik secara ilmiah.</p>

        {/* Search Bar */}
        <div className="pub-search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="pub-search-input"
            placeholder="Cari kebutuhan proyek (contoh: 'murah', 'konstruksi kuat', 'tahan air', 'lantai')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: 'rgba(250,246,239,0.5)', cursor: 'pointer', fontSize: 13 }}
            >
              ✕ Reset
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="pub-chip-row">
          {[
            { label: 'Semua Kayu', q: '' },
            { label: '🏷️ Murah / Terjangkau', q: 'murah' },
            { label: '💪 Kuat & Kokoh', q: 'kuat' },
            { label: '🛡️ Tahan Air & Awet', q: 'awet' },
            { label: '📦 Siap Stok', q: 'stok' },
            { label: '✨ Estetika Indah', q: 'estetika' },
          ].map((chip) => (
            <button
              key={chip.label}
              className={`pub-chip${searchQuery.toLowerCase() === chip.q ? ' active' : ''}`}
              onClick={() => setSearchQuery(chip.q)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="rek-list">
          {loadingData ? (
            <p style={{ color: 'rgba(250,246,239,0.5)', padding: '20px 0' }}>Memuat kalkulasi rekomendasi SAW...</p>
          ) : searchResult.items.length === 0 ? (
            <div style={{ background: 'rgba(255,255,255,0.04)', padding: 32, textAlign: 'center', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ color: 'rgba(250,246,239,0.7)', fontSize: 15, marginBottom: 8 }}>Tidak ada jenis kayu yang cocok dengan kata kunci "{searchQuery}".</p>
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'var(--honey)', color: 'var(--bark)', border: 'none', padding: '8px 16px', fontWeight: 700, borderRadius: 4, cursor: 'pointer' }}
              >
                Tampilkan Semua Kayu
              </button>
            </div>
          ) : (
            searchResult.items.map((item, idx) => {
              const label = getMatchLabel(item.rank, item.persen)
              return (
                <div className="rek-card" key={item.kayuId}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div className="rek-rank">#{item.rank}</div>
                    <div className="rek-info">
                      <div className="rek-name">
                        {item.nama} <span style={{ fontSize: 12, color: 'var(--honey)', fontWeight: 400 }}>({item.kode})</span>
                      </div>
                      <div className="rek-score">
                        Kesesuaian: <b>{item.persen}%</b> — <span style={{ color: 'var(--honey)', fontWeight: 700 }}>{label.label}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Link
                      href={`/kayu/${item.kayuId}`}
                      className="btn-outline"
                      style={{ color: 'var(--cream)', borderColor: 'rgba(250,246,239,0.2)', padding: '12px 20px' }}
                    >
                      Detail Kayu
                    </Link>
                    <button
                      className="btn-primary"
                      style={{ background: 'var(--honey)', color: 'var(--bark)', border: 'none', padding: '12px 22px' }}
                      onClick={() => handlePesan(item.kayuId)}
                    >
                      Pesan Kayu Ini
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* FEATURE HIGHLIGHTS */}
      <section style={{ background: '#2E1F16' }}>
        <div className="eyebrow" style={{ color: 'var(--honey)' }}>Keunggulan Sistem</div>
        <h2 className="sec-title" style={{ color: 'var(--cream)' }}>Mengapa Menggunakan <em>Sistem Ini?</em></h2>
        <p className="sec-desc" style={{ color: 'rgba(250,246,239,0.5)' }}>Didukung metode ilmiah dan data terverifikasi untuk rekomendasi yang akurat.</p>
        <div className="feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16, marginTop: 40 }}>
          <div className="feat-item" style={{ background: 'var(--bark)', padding: '34px 26px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="feat-icon" style={{ width: 44, height: 44, border: '1px solid rgba(196,137,58,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--honey)', marginBottom: 20 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18"/>
              </svg>
            </div>
            <h3 className="feat-title" style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, color: 'var(--cream)', marginBottom: 10 }}>Analisis Kriteria</h3>
            <p className="feat-desc" style={{ fontSize: 12, color: 'rgba(250,246,239,0.45)', lineHeight: 1.75 }}>Sistem mengevaluasi kayu berdasarkan kekuatan, harga, ketahanan, dan ketersediaan secara ilmiah.</p>
          </div>

          <div className="feat-item" style={{ background: 'var(--bark)', padding: '34px 26px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="feat-icon" style={{ width: 44, height: 44, border: '1px solid rgba(196,137,58,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--honey)', marginBottom: 20 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <h3 className="feat-title" style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, color: 'var(--cream)', marginBottom: 10 }}>Rekomendasi Cerdas</h3>
            <p className="feat-desc" style={{ fontSize: 12, color: 'rgba(250,246,239,0.45)', lineHeight: 1.75 }}>Algoritma SPK memproses bobot kriteria dan menghasilkan rekomendasi terbaik sesuai kebutuhan.</p>
          </div>

          <div className="feat-item" style={{ background: 'var(--bark)', padding: '34px 26px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="feat-icon" style={{ width: 44, height: 44, border: '1px solid rgba(196,137,58,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--honey)', marginBottom: 20 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3 className="feat-title" style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, color: 'var(--cream)', marginBottom: 10 }}>Data Terverifikasi</h3>
            <p className="feat-desc" style={{ fontSize: 12, color: 'rgba(250,246,239,0.45)', lineHeight: 1.75 }}>Seluruh data spesifikasi kayu diverifikasi oleh para ahli kehutanan dan konstruksi berpengalaman.</p>
          </div>

          <div className="feat-item" style={{ background: 'var(--bark)', padding: '34px 26px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="feat-icon" style={{ width: 44, height: 44, border: '1px solid rgba(196,137,58,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--honey)', marginBottom: 20 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
            </div>
            <h3 className="feat-title" style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, color: 'var(--cream)', marginBottom: 10 }}>Pemesanan Langsung</h3>
            <p className="feat-desc" style={{ fontSize: 12, color: 'rgba(250,246,239,0.45)', lineHeight: 1.75 }}>Setelah mendapat rekomendasi, pesan kayu langsung melalui sistem terintegrasi kami.</p>
          </div>
        </div>
      </section>

      {/* PESAN KAYU */}
      <section id="pesan">
        <div className="cta-inner">
          <div className="eyebrow" style={{ justifyContent: 'center' }}>Mulai Sekarang</div>
          <h2 className="cta-title">Siap Menemukan Kayu<br/><em>Yang Tepat?</em></h2>
          <p className="cta-desc">
            Gunakan sistem rekomendasi kami dan dapatkan saran pemilihan kayu yang akurat
            berdasarkan kebutuhan spesifik proyek Anda.
          </p>
          <div className="cta-btns">
            <button onClick={() => handlePesan('')} className="btn-primary">
              Buat Pesanan Baru
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            <a href="#tentang" className="btn-outline">Tentang Kami</a>
          </div>
        </div>
      </section>

      {/* TENTANG KAMI */}
      <section id="tentang">
        <div className="tentang-grid">
          <div>
            <div className="eyebrow">Tentang Kami</div>
            <h2 className="sec-title">Beuna Jaya Kayu — <em>Ahli Kayu</em></h2>
            <p className="sec-desc" style={{ maxWidth: 480, marginBottom: 18 }}>
              Beuna Jaya Kayu adalah Usaha Dagang yang berdedikasi dalam penyediaan material kayu berkualitas
              tinggi dengan dukungan sistem teknologi modern. Kami hadir untuk membantu para profesional
              konstruksi, desainer interior, dan masyarakat umum dalam memilih jenis kayu yang paling tepat.
            </p>
            <p className="sec-desc" style={{ maxWidth: 480 }}>
              Sistem Pendukung Keputusan kami menggunakan metode ilmiah yang telah teruji untuk menganalisis
              berbagai kriteria pemilihan kayu secara objektif dan menghasilkan rekomendasi yang dapat
              diandalkan untuk setiap proyek.
            </p>
          </div>

          <div className="gal-wrap">
  {galleryPhotos.map(g => (
    <div
      key={g.label}
      className={g.cls}
      style={{
        backgroundColor: g.fallback,
        backgroundImage: g.img
          ? `url(${g.img})`
          : `url(${ringPattern(g.fallback, g.ring)})`,
      }}
    >
      <span className="gal-label">{g.label}</span>
    </div>
  ))}
</div>
        </div>
      </section>

      {/* LOKASI */}
      <section id="lokasi">
        <div className="eyebrow">Kunjungi Kami</div>
        <h2 className="sec-title">Lokasi <em>Kilang Kayu</em></h2>
        <p className="sec-desc">Datang langsung untuk melihat koleksi kayu kami di lokasi berikut.</p>

        <div className="lokasi-grid">
          <div className="lokasi-info">
            <div className="eyebrow">Alamat</div>
            <div className="lokasi-name">{lokasi.nama}</div>
            <p className="lokasi-addr">{lokasi.alamat}</p>
            <a href={lokasi.mapsLink} target="_blank" rel="noopener noreferrer" className="lokasi-btn">
              Buka di Google Maps
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
          <div className="lokasi-map">
            <iframe
              src={lokasi.embedSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Lokasi Kilang Kayu Beuna Jaya"
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="ft-top">
          <div>
            <div className="ft-name">Beuna Jaya Kayu</div>
            <p className="ft-desc">Sistem Pendukung Keputusan pemilihan jenis kayu berbasis web — akurat, terpercaya, mudah digunakan.</p>
          </div>
          <div className="ft-col">
            <h4>Navigasi</h4>
            <ul>
              {['Home','Jenis Kayu','Rekomendasi Kayu','Pesan Kayu','Tentang Kami','Lokasi'].map(l => (
                <li key={l}><a href="#">{l}</a></li>
              ))}
            </ul>
          </div>
          <div className="ft-col">
            <h4>Sistem</h4>
            <ul>
              <li><Link href={isLoggedIn ? (userRole === 'admin' ? '/admin/dashboard' : '/user') : '/login'} style={{ color: 'inherit', textDecoration: 'none' }}>{isLoggedIn ? 'Dashboard Saya' : 'Login'}</Link></li>
              <li><a href="#">Panduan Penggunaan</a></li>
            </ul>
          </div>
        </div>
        <div className="ft-bottom">
          <span>© {new Date().getFullYear()} Beuna Jaya Kayu. Seluruh hak cipta dilindungi.</span>
          <span>Sistem Pendukung Keputusan v1.0</span>
        </div>
      </footer>
    </>
  )
}