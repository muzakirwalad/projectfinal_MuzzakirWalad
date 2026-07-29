// app/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'

// Menghasilkan pola "cincin kayu" (tree-ring) sebagai SVG data-URI.
// Dipakai sebagai layer background di bawah foto asli — jadi kalau foto
// belum diupload ke /public/images/..., yang tampil bukan kotak warna polos,
// melainkan ilustrasi potongan batang kayu (lingkaran serat + inti kayu).
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

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false)

  const woodTypes = [
    { name: 'Jati', grade: 'Premium', use: 'Furnitur & Konstruksi', color: '#8B5E3C' },
    { name: 'Meranti', grade: 'Standar', use: 'Bangunan & Plywood', color: '#A0714F' },
    { name: 'Merbau', grade: 'Premium', use: 'Lantai & Decking', color: '#6B3A2A' },
    { name: 'Pinus', grade: 'Ekonomis', use: 'Kerajinan & Furnitur Ringan', color: '#C4956A' },
    { name: 'Ulin', grade: 'Premium', use: 'Konstruksi Berat', color: '#5C3317' },
    { name: 'Sengon', grade: 'Ekonomis', use: 'Papan & Peti Kemas', color: '#B8860B' },
  ]

  const features = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2v-4M9 21H5a2 2 0 01-2-2v-4m0 0h18"/>
        </svg>
      ),
      title: 'Analisis Kriteria',
      desc: 'Sistem mengevaluasi kayu berdasarkan kekuatan, harga, ketahanan, dan ketersediaan secara ilmiah.',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
      ),
      title: 'Rekomendasi Cerdas',
      desc: 'Algoritma SPK memproses bobot kriteria dan menghasilkan rekomendasi terbaik sesuai kebutuhan.',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
      title: 'Data Terverifikasi',
      desc: 'Seluruh data spesifikasi kayu diverifikasi oleh para ahli kehutanan dan konstruksi berpengalaman.',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/>
        </svg>
      ),
      title: 'Pemesanan Langsung',
      desc: 'Setelah mendapat rekomendasi, pesan kayu langsung melalui sistem terintegrasi kami.',
    },
  ]

  // Foto kayu untuk hero — letakkan file asli di /public/images/kayu/
  // Selama file belum ada, pola cincin batang kayu (ringPattern) di bawah
  // yang akan tampil, jadi kartu tetap terlihat seperti potongan kayu asli.
  // Foto tekstur/batang kayu asli — letakkan file di /public/images/kayu/
  // (file sudah disiapkan: pinus.jpg, meranti.webp, jati.jpg) supaya kartu
  // hero tidak lagi polos warna gradasi, melainkan menampilkan foto serat & batang kayu asli.
  const heroCards = [
    { cls: 'wcard wcard-c', img: '/images/kayu/pinus.jpg',    fallback: '#C4956A', ring: '#7C5730', name: 'Pinus',   grade: 'Ekonomis' },
    { cls: 'wcard wcard-b', img: '/images/kayu/meranti.webp', fallback: '#A0714F', ring: '#5E3D26', name: 'Meranti', grade: 'Standar' },
    { cls: 'wcard wcard-a', img: '/images/kayu/jati.jpg',     fallback: '#6B3A2A', ring: '#3D2115', name: 'Jati',    grade: 'Premium' },
  ]

  // Foto serat kayu untuk galeri "Tentang Kami" — letakkan file asli di /public/images/galeri/
  const galleryPhotos = [
    { cls: 'gal-photo gal-a', img: '/images/galeri/serat-jati.jpg',  fallback: '#6B3A2A', ring: '#3D2115', label: 'Serat Kayu Jati' },
    { cls: 'gal-photo gal-b', img: '/images/galeri/serat-ulin.webp', fallback: '#5C3317', ring: '#2D170B', label: 'Serat Kayu Ulin' },
    { cls: 'gal-photo gal-c', img: '/images/galeri/serat-pinus.jpg', fallback: '#C4956A', ring: '#7C5730', label: 'Serat Kayu Pinus' },
  ]

  // Lokasi kilang — dari Google Maps
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
          padding: 0 6%;
          height: 68px;
          background: rgba(250,246,239,0.94);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(61,43,31,0.07);
        }

        .nav-logo { display: flex; align-items: center; gap: 11px; text-decoration: none; }

        .nav-logo-mark {
          width: 34px; height: 34px;
          background: var(--bark);
          display: flex; align-items: center; justify-content: center;
        }
        .nav-logo-mark svg { width: 16px; height: 16px; color: var(--honey); }

        .nav-brand-name {
          font-family: 'Playfair Display', serif;
          font-size: 14.5px; font-weight: 600;
          color: var(--bark); line-height: 1;
        }
        .nav-brand-sub {
          font-size: 8.5px; color: var(--wood);
          letter-spacing: 2px; text-transform: uppercase; margin-top: 3px; display: block;
        }

        .nav-links { display: flex; align-items: center; gap: 30px; list-style: none; }

        .nav-links a {
          font-size: 12.5px; font-weight: 400;
          color: var(--bark); text-decoration: none;
          letter-spacing: 0.3px; position: relative; padding-bottom: 3px;
          transition: color 0.2s;
        }
        .nav-links a::after {
          content: ''; position: absolute; bottom: 0; left: 0;
          width: 0; height: 1px; background: var(--honey); transition: width 0.25s;
        }
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

        .hamburger {
          display: none; flex-direction: column; gap: 5px;
          background: none; border: none; cursor: pointer; padding: 4px;
        }
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
        .hero-bg {
          position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(circle at 82% 22%, rgba(196,137,58,0.08) 0%, transparent 46%);
        }

        .hero-content { flex: 1; max-width: 600px; position: relative; z-index: 2; }

        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          border: 1px solid rgba(196,137,58,0.32);
          padding: 7px 16px; margin-bottom: 26px;
          animation: fadeUp 0.7s ease both;
        }
        .badge-dot { width: 5px; height: 5px; background: var(--honey); border-radius: 50%; }
        .badge-text { font-size: 9.5px; font-weight: 700; color: var(--honey); letter-spacing: 2px; text-transform: uppercase; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .hero-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(38px, 5.6vw, 66px);
          font-weight: 400; line-height: 1.08;
          color: var(--bark);
          animation: fadeUp 0.7s 0.06s ease both;
        }
        .hero-title em { font-style: italic; color: var(--wood); display: block; }
        .hero-title span { color: var(--honey); }

        .hero-line {
          width: 50px; height: 2px;
          background: var(--honey);
          margin: 24px 0;
          animation: fadeUp 0.7s 0.1s ease both;
        }

        .hero-desc {
          font-size: 15px; font-weight: 300; line-height: 1.8;
          color: rgba(61,43,31,0.6); max-width: 460px;
          animation: fadeUp 0.7s 0.14s ease both;
        }

        .hero-cta {
          display: flex; align-items: center; gap: 14px;
          margin-top: 38px; flex-wrap: wrap;
          animation: fadeUp 0.7s 0.18s ease both;
        }

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

        .hero-stats {
          display: flex; gap: 38px; margin-top: 48px;
          padding-top: 26px; border-top: 1px solid rgba(61,43,31,0.08);
          animation: fadeUp 0.7s 0.26s ease both;
        }
        .stat-num {
          font-family: 'Playfair Display', serif; font-size: 27px; font-weight: 600;
          color: var(--bark); line-height: 1;
        }
        .stat-lbl { font-size: 10.5px; color: rgba(61,43,31,0.4); margin-top: 5px; }

        .hero-visual {
          flex: 1; display: flex; justify-content: flex-end; align-items: center;
          position: relative; z-index: 2;
          animation: fadeUp 0.7s 0.1s ease both;
        }
        @media (max-width: 880px) { .hero-visual { display: none; } }

        .card-stack { position: relative; width: 300px; height: 380px; }
        .wcard {
          position: absolute; background: white;
          box-shadow: 0 16px 44px rgba(61,43,31,0.13);
          overflow: hidden; transition: transform 0.25s;
        }
        .wcard:hover { transform: translateY(-5px) !important; }
        .wcard-a { width: 220px; height: 280px; top: 70px; right: 0; transform: rotate(3deg); }
        .wcard-b { width: 185px; height: 240px; top: 20px; right: 110px; transform: rotate(-4deg); }
        .wcard-c { width: 165px; height: 200px; top: 120px; right: 190px; transform: rotate(1deg); }
        .wcard-top {
          height: 64%; background-size: cover, cover; background-position: center;
          background-repeat: no-repeat; position: relative;
        }
        .wcard-top::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.16) 100%);
        }
        .wcard-bot { padding: 12px 14px; }
        .wcard-name { font-family: 'Playfair Display', serif; font-size: 14.5px; font-weight: 600; color: var(--bark); }
        .wcard-grade { font-size: 8.5px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: var(--honey); margin-top: 2px; }

        /* ── SECTIONS ── */
        section { padding: 92px 6%; }

        .eyebrow {
          font-size: 9.5px; font-weight: 700; letter-spacing: 2.8px; text-transform: uppercase;
          color: var(--honey); margin-bottom: 10px;
          display: flex; align-items: center; gap: 10px;
        }
        .eyebrow::before { content: ''; display: block; width: 20px; height: 1px; background: var(--honey); }

        .sec-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(27px, 3.8vw, 40px); font-weight: 400;
          color: var(--bark); line-height: 1.15; margin-bottom: 14px;
        }
        .sec-title em { font-style: italic; color: var(--wood); }

        .sec-desc { font-size: 13.5px; font-weight: 300; color: rgba(61,43,31,0.58); line-height: 1.75; max-width: 500px; }

        /* ── WOODS ── */
        #jenis-kayu { background: var(--light); }

        .woods-hdr {
          display: flex; justify-content: space-between;
          align-items: flex-end; flex-wrap: wrap; gap: 20px; margin-bottom: 46px;
        }

        .woods-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1px;
          background: rgba(61,43,31,0.06); border: 1px solid rgba(61,43,31,0.06);
        }

        .wood-card {
          background: white; padding: 26px;
          cursor: pointer; transition: background 0.2s;
          position: relative; overflow: hidden;
        }
        .wood-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: var(--c); opacity: 0; transition: opacity 0.2s;
        }
        .wood-card:hover { background: #FFFDFA; }
        .wood-card:hover::before { opacity: 1; }

        .wswatch { width: 32px; height: 32px; border-radius: 50%; margin-bottom: 14px; position: relative; }
        .wswatch::after { content: ''; position: absolute; inset: 3px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.5); }

        .wname { font-family: 'Playfair Display', serif; font-size: 19px; font-weight: 500; color: var(--bark); margin-bottom: 5px; }
        .wgrade { font-size: 8.5px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; margin-bottom: 10px; }
        .wuse { font-size: 12px; font-weight: 300; color: rgba(61,43,31,0.52); line-height: 1.5; }

        .warrow {
          position: absolute; right: 20px; bottom: 20px;
          width: 26px; height: 26px; border: 1px solid rgba(61,43,31,0.1);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.2s;
        }
        .wood-card:hover .warrow { opacity: 1; }

        /* ── FEATURES ── */
        #rekomendasi { background: var(--bark); }
        #rekomendasi .sec-title { color: var(--cream); }
        #rekomendasi .sec-desc { color: rgba(250,246,239,0.45); }

        .feat-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
          gap: 1px; margin-top: 52px; background: rgba(255,255,255,0.05);
        }
        .feat-item {
          background: var(--bark); padding: 34px 26px;
          transition: background 0.2s;
        }
        .feat-item:hover { background: rgba(255,255,255,0.03); }
        .feat-icon {
          width: 44px; height: 44px; border: 1px solid rgba(196,137,58,0.25);
          display: flex; align-items: center; justify-content: center;
          color: var(--honey); margin-bottom: 20px; transition: border-color 0.2s;
        }
        .feat-item:hover .feat-icon { border-color: var(--honey); }
        .feat-title { font-family: 'Playfair Display', serif; font-size: 17px; font-weight: 500; color: var(--cream); margin-bottom: 10px; }
        .feat-desc { font-size: 12px; font-weight: 300; color: rgba(250,246,239,0.45); line-height: 1.75; }

        /* ── CTA ── */
        #pesan { background: var(--cream); text-align: center; position: relative; overflow: hidden; }
        #pesan::before {
          content: ''; position: absolute; top: 50%; left: 50%;
          transform: translate(-50%,-50%);
          width: 520px; height: 520px;
          background: radial-gradient(circle, rgba(196,137,58,0.06) 0%, transparent 70%);
        }
        .cta-inner { position: relative; z-index: 1; }
        .cta-title { font-family: 'Playfair Display', serif; font-size: clamp(28px, 4.6vw, 48px); font-weight: 400; color: var(--bark); margin-bottom: 18px; line-height: 1.1; }
        .cta-title em { font-style: italic; color: var(--wood); }
        .cta-desc { font-size: 13.5px; font-weight: 300; color: rgba(61,43,31,0.52); max-width: 460px; margin: 0 auto 34px; line-height: 1.75; }
        .cta-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }

        /* ── TENTANG ── */
        #tentang { background: var(--light); }
        .tentang-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 56px; align-items: center; }
        @media (max-width: 880px) { .tentang-grid { grid-template-columns: 1fr; } }

        .gal-wrap { position: relative; height: 420px; }
        @media (max-width: 880px) { .gal-wrap { height: 340px; max-width: 380px; } }
        .gal-photo {
          position: absolute; background-size: cover, cover; background-position: center;
          background-repeat: no-repeat; box-shadow: 0 18px 44px rgba(61,43,31,0.14);
        }
        /* Pola cincin kayu sebagai lapisan fallback — tetap terlihat seperti batang kayu tanpa foto asli */
        .gal-a { width: 62%; height: 56%; top: 0; left: 0; }
        .gal-b { width: 56%; height: 50%; top: 34%; right: 0; border: 6px solid var(--light); }
        .gal-c { width: 46%; height: 42%; bottom: 0; left: 8%; border: 6px solid var(--light); }
        .gal-label {
          position: absolute; bottom: 12px; left: 14px;
          font-size: 10px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase;
          color: #fff; text-shadow: 0 1px 6px rgba(0,0,0,0.5);
        }
        .gal-photo::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.32) 100%);
        }

        /* ── LOKASI ── */
        #lokasi { background: var(--cream); }
        .lokasi-grid { display: grid; grid-template-columns: 1fr 1.15fr; gap: 1px; background: rgba(61,43,31,0.08); border: 1px solid rgba(61,43,31,0.08); margin-top: 8px; }
        @media (max-width: 880px) { .lokasi-grid { grid-template-columns: 1fr; } }
        .lokasi-info { background: var(--bark); padding: 40px 36px; display: flex; flex-direction: column; justify-content: center; }
        .lokasi-info .eyebrow { color: var(--honey); }
        .lokasi-name { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 500; color: var(--cream); margin: 4px 0 14px; }
        .lokasi-addr { font-size: 13px; font-weight: 300; color: rgba(250,246,239,0.5); line-height: 1.7; max-width: 340px; margin-bottom: 26px; }
        .lokasi-btn {
          display: inline-flex; align-items: center; gap: 8px; width: fit-content;
          background: var(--honey); color: var(--bark);
          font-family: 'Lato', sans-serif; font-size: 10.5px; font-weight: 700;
          letter-spacing: 1.4px; text-transform: uppercase;
          padding: 13px 22px; text-decoration: none; transition: opacity 0.2s;
        }
        .lokasi-btn:hover { opacity: 0.85; }
        .lokasi-map { min-height: 340px; background: var(--light); }
        .lokasi-map iframe { width: 100%; height: 100%; min-height: 340px; border: 0; display: block; filter: grayscale(0.15) contrast(1.02); }

        /* ── FOOTER ── */
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
        <a href="/" className="nav-logo">
          <div className="nav-logo-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L3 9v11h6v-6h6v6h6V9z"/>
            </svg>
          </div>
          <div>
            <span className="nav-brand-name">Beuna Jaya Kayu</span>
            <span className="nav-brand-sub">Sistem Pendukung Keputusan</span>
          </div>
        </a>

        <ul className={`nav-links${menuOpen ? ' open' : ''}`}>
          <li><a href="#home">Home</a></li>
          <li><Link href="/login">Rekomendasi Kayu</Link></li>
          <li><a href="#jenis-kayu">Jenis Kayu</a></li>
          <li><a href="#jenis-kayu">Kriteria Penilaian</a></li>
          <li><a href="#pesan">Pesan Kayu</a></li>
          <li><a href="#tentang">Tentang Kami</a></li>
          <li><a href="#lokasi">Lokasi</a></li>
          <li>
            <Link href="/login" className="btn-nav-login">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              Login
            </Link>
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
            <Link href="/login" className="btn-primary">
              Mulai Rekomendasi
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
            <a href="#jenis-kayu" className="btn-outline">Lihat Jenis Kayu</a>
          </div>
          <div className="hero-stats">
            {[
              { num: '12+', lbl: 'Jenis Kayu Terdata' },
              { num: '8', lbl: 'Kriteria Evaluasi' },
              { num: '98%', lbl: 'Akurasi Rekomendasi' },
            ].map(s => (
              <div key={s.lbl}>
                <div className="stat-num">{s.num}</div>
                <div className="stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-visual">
          <div className="card-stack">
            {heroCards.map(c => (
              <div className={c.cls} key={c.name}>
                <div
                  className="wcard-top"
                  style={{
                    backgroundColor: c.fallback,
                    backgroundImage: `url(${c.img}), url(${ringPattern(c.fallback, c.ring)})`,
                  }}
                />
                <div className="wcard-bot">
                  <div className="wcard-name">{c.name}</div>
                  <div className="wcard-grade">{c.grade}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JENIS KAYU */}
      <section id="jenis-kayu">
        <div className="woods-hdr">
          <div>
            <div className="eyebrow">Katalog Kayu</div>
            <h2 className="sec-title">Jenis Kayu <em>Unggulan</em></h2>
            <p className="sec-desc">Temukan karakteristik dan keunggulan setiap jenis kayu yang tersedia.</p>
          </div>
          <a href="#jenis-kayu" className="btn-outline" style={{ whiteSpace: 'nowrap' }}>Lihat Semua</a>
        </div>
        <div className="woods-grid">
          {woodTypes.map(w => (
            <div className="wood-card" key={w.name} style={{ '--c': w.color } as React.CSSProperties}>
              <div className="wswatch" style={{ background: w.color }}/>
              <div className="wname">{w.name}</div>
              <div className="wgrade" style={{ color: w.color }}>{w.grade}</div>
              <div className="wuse">{w.use}</div>
              <div className="warrow">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--bark)" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* REKOMENDASI */}
      <section id="rekomendasi">
        <div className="eyebrow" style={{ color: 'var(--honey)' }}>Keunggulan Sistem</div>
        <h2 className="sec-title">Mengapa Menggunakan <em>Sistem Ini?</em></h2>
        <p className="sec-desc">Didukung metode ilmiah dan data terverifikasi untuk rekomendasi yang akurat.</p>
        <div className="feat-grid">
          {features.map(f => (
            <div className="feat-item" key={f.title}>
              <div className="feat-icon">{f.icon}</div>
              <h3 className="feat-title">{f.title}</h3>
              <p className="feat-desc">{f.desc}</p>
            </div>
          ))}
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
            <Link href="/login" className="btn-primary">
              Mulai Rekomendasi
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
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
                  backgroundImage: `url(${g.img}), url(${ringPattern(g.fallback, g.ring)})`,
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
              <li><Link href="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Login</Link></li>
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