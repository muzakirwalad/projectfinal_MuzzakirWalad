// app/register/page.tsx
'use client'

import { useState, FormEvent } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RegisterPage() {
  const [fullName, setFullName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  const getStrength = (pwd: string): { level: number; label: string; color: string } => {
    if (!pwd) return { level: 0, label: '', color: 'transparent' }
    let s = 0
    if (pwd.length >= 8) s++
    if (/[A-Z]/.test(pwd)) s++
    if (/[0-9]/.test(pwd)) s++
    if (/[^A-Za-z0-9]/.test(pwd)) s++
    if (s <= 1) return { level: 1, label: 'Lemah', color: '#C0392B' }
    if (s === 2) return { level: 2, label: 'Cukup', color: '#E67E22' }
    if (s === 3) return { level: 3, label: 'Kuat', color: '#27AE60' }
    return { level: 4, label: 'Sangat Kuat', color: '#1A8A4A' }
  }

  const strength = getStrength(password)

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi tidak cocok.')
      return
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter.')
      return
    }

    setLoading(true)

    const isSuperAdminEmail = email.trim().toLowerCase() === 'muzakirwalad28@gmail.com'

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          requested_role: isSuperAdminEmail ? 'admin' : 'user',
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message || 'Registrasi gagal. Silakan coba lagi.')
      setLoading(false)
      return
    }

    if (signUpData.user && isSuperAdminEmail) {
      await supabase.from('profiles').upsert({
        id: signUpData.user.id,
        email: signUpData.user.email,
        full_name: fullName || 'Super Admin',
        role: 'admin',
      }, { onConflict: 'id' })
    }

    setSuccess(true)
    setLoading(false)
  }

  const EyeOpen = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
  const EyeOff = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
  const LockIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400&family=Lato:wght@300;400;700&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Lato', sans-serif; background: #3D2B1F; min-height: 100vh; }

        .page { min-height: 100vh; display: flex; }

        .left {
          flex: 1; background: #3D2B1F;
          display: none; flex-direction: column;
          justify-content: space-between; padding: 52px;
          position: relative; overflow: hidden;
        }
        @media (min-width: 960px) { .left { display: flex; } }

        .grain {
          position: absolute; inset: 0; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");
        }
        .deco-rings {
          position: absolute; bottom: -80px; left: -80px;
          width: 420px; height: 420px; pointer-events: none;
        }
        .ring { position: absolute; border-radius: 50%; border: 1px solid rgba(200,137,42,0.07); }
        .r1{inset:0}.r2{inset:42px}.r3{inset:84px}.r4{inset:126px}.r5{inset:168px}
        .r6{inset:210px; background: rgba(200,137,42,0.04);}
        .deco-glow {
          position: absolute; top: -60px; right: -60px;
          width: 300px; height: 300px; pointer-events: none;
          background: radial-gradient(circle, rgba(200,137,42,0.08) 0%, transparent 70%);
        }

        .l-top { position: relative; z-index: 2; }
        .l-logo { display: flex; align-items: center; gap: 11px; margin-bottom: 52px; text-decoration: none; }
        .l-logo-mark {
          width: 38px; height: 38px; border: 1px solid rgba(200,137,42,0.4);
          display: flex; align-items: center; justify-content: center;
        }
        .l-logo-mark svg { width: 18px; height: 18px; color: #C8892A; }
        .l-logo-name { font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 500; color: #FAF6EF; }
        .l-logo-sub { font-size: 9px; color: rgba(250,246,239,0.3); letter-spacing: 2px; text-transform: uppercase; margin-top: 2px; display: block; }

        .l-heading { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 400; color: #FAF6EF; line-height: 1.15; }
        .l-heading em { font-style: italic; color: #C8892A; display: block; }
        .l-line { width: 44px; height: 1px; background: linear-gradient(90deg, rgba(200,137,42,0.6), transparent); margin: 20px 0; }
        .l-desc { font-size: 13px; font-weight: 300; color: rgba(250,246,239,0.38); line-height: 1.8; max-width: 290px; }

        .l-bottom { position: relative; z-index: 2; }
        .role-preview { display: flex; flex-direction: column; gap: 12px; }
        .role-prev-card {
          display: flex; align-items: flex-start; gap: 14px;
          padding: 16px; border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          transition: border-color 0.25s, background 0.25s;
        }
        .role-prev-card.highlighted {
          border-color: rgba(200,137,42,0.3);
          background: rgba(200,137,42,0.05);
        }
        .role-prev-icon {
          width: 36px; height: 36px; flex-shrink: 0;
          border: 1px solid rgba(200,137,42,0.2);
          display: flex; align-items: center; justify-content: center;
          color: rgba(200,137,42,0.6);
        }
        .role-prev-icon svg { width: 16px; height: 16px; }
        .role-prev-name {
          font-size: 12px; font-weight: 700;
          letter-spacing: 1px; text-transform: uppercase;
          color: rgba(250,246,239,0.7); margin-bottom: 3px;
        }
        .role-prev-dest {
          font-size: 11px; font-weight: 300;
          color: rgba(250,246,239,0.3); line-height: 1.5;
          display: flex; align-items: center; gap: 5px;
        }
        .role-prev-dest svg { width: 10px; height: 10px; flex-shrink: 0; }

        .right {
          width: 100%; max-width: 520px;
          background: #FAF6EF;
          display: flex; flex-direction: column; justify-content: center;
          padding: 56px 48px; position: relative; overflow-y: auto;
        }
        @media (max-width: 960px) { .right { max-width: 100%; padding: 56px 28px; } }

        .back-btn {
          position: absolute; top: 26px; left: 26px;
          display: flex; align-items: center; gap: 6px;
          font-size: 11.5px; color: rgba(61,43,31,0.38);
          text-decoration: none; transition: color 0.2s;
        }
        .back-btn:hover { color: #7C4A2D; }
        .back-btn svg { width: 13px; height: 13px; }

        .page-tabs {
          display: flex; border: 1px solid rgba(61,43,31,0.1);
          margin-bottom: 28px; overflow: hidden;
        }
        .page-tab {
          flex: 1; padding: 11px 0; text-align: center;
          font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
          text-decoration: none; transition: all 0.2s;
          border: none; cursor: pointer; font-family: 'Lato', sans-serif;
        }
        .page-tab.active { background: #3D2B1F; color: #FAF6EF; }
        .page-tab.inactive { background: transparent; color: rgba(61,43,31,0.4); }
        .page-tab.inactive:hover { background: rgba(61,43,31,0.04); color: #3D2B1F; }

        .r-eyebrow {
          font-size: 10px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase;
          color: #C8892A; margin-bottom: 9px; display: flex; align-items: center; gap: 8px;
        }
        .r-eyebrow::before { content: ''; display: block; width: 18px; height: 1px; background: #C8892A; }

        .r-title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 400; color: #3D2B1F; line-height: 1.1; margin-bottom: 6px; }
        .r-title em { font-style: italic; color: #7C4A2D; }
        .r-sub { font-size: 12.5px; font-weight: 300; color: rgba(61,43,31,0.42); line-height: 1.6; margin-bottom: 24px; }

        .role-label {
          font-size: 10px; font-weight: 700; letter-spacing: 1.8px; text-transform: uppercase;
          color: rgba(61,43,31,0.48); margin-bottom: 10px; display: block;
        }
        .role-cards {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 22px;
        }
        .role-card {
          border: 1.5px solid rgba(61,43,31,0.1);
          padding: 14px 16px; cursor: pointer;
          transition: all 0.2s; position: relative;
          background: white; text-align: left;
          font-family: 'Lato', sans-serif;
        }
        .role-card:hover { border-color: rgba(61,43,31,0.25); }
        .role-card.selected-admin {
          border-color: #C8892A;
          background: rgba(200,137,42,0.04);
          box-shadow: 0 0 0 3px rgba(200,137,42,0.08);
        }
        .role-card.selected-user {
          border-color: #27AE60;
          background: rgba(39,174,96,0.04);
          box-shadow: 0 0 0 3px rgba(39,174,96,0.08);
        }
        .role-card-check {
          position: absolute; top: 10px; right: 10px;
          width: 18px; height: 18px; border-radius: 50%;
          border: 1.5px solid rgba(61,43,31,0.15);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .role-card.selected-admin .role-card-check {
          background: #C8892A; border-color: #C8892A;
        }
        .role-card.selected-user .role-card-check {
          background: #27AE60; border-color: #27AE60;
        }
        .role-card-check svg { width: 10px; height: 10px; color: white; opacity: 0; transition: opacity 0.2s; }
        .role-card.selected-admin .role-card-check svg,
        .role-card.selected-user .role-card-check svg { opacity: 1; }

        .role-card-icon {
          width: 32px; height: 32px; margin-bottom: 10px;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(61,43,31,0.1);
          transition: all 0.2s;
        }
        .role-card.selected-admin .role-card-icon { border-color: rgba(200,137,42,0.35); color: #C8892A; }
        .role-card.selected-user .role-card-icon { border-color: rgba(39,174,96,0.35); color: #27AE60; }
        .role-card-icon svg { width: 15px; height: 15px; color: rgba(61,43,31,0.35); transition: color 0.2s; }
        .role-card.selected-admin .role-card-icon svg,
        .role-card.selected-user .role-card-icon svg { color: inherit; }

        .role-card-name {
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.5px; color: #3D2B1F; margin-bottom: 3px;
        }
        .role-card-desc {
          font-size: 10.5px; font-weight: 300;
          color: rgba(61,43,31,0.45); line-height: 1.5;
        }
        .role-card-dest {
          margin-top: 8px; padding-top: 8px;
          border-top: 1px solid rgba(61,43,31,0.06);
          font-size: 10px; font-weight: 700;
          letter-spacing: 0.5px; text-transform: uppercase;
          display: flex; align-items: center; gap: 4px;
          transition: color 0.2s;
        }
        .role-card.selected-admin .role-card-dest { color: #C8892A; }
        .role-card.selected-user .role-card-dest { color: #27AE60; }
        .role-card:not(.selected-admin):not(.selected-user) .role-card-dest { color: rgba(61,43,31,0.3); }
        .role-card-dest svg { width: 9px; height: 9px; }

        .admin-code-box {
          background: rgba(200,137,42,0.05);
          border: 1px solid rgba(200,137,42,0.25);
          padding: 14px 16px; margin-bottom: 22px;
          animation: slin 0.25s ease;
        }
        .admin-code-hint {
          display: flex; align-items: flex-start; gap: 8px;
          font-size: 10.5px; font-weight: 300; color: rgba(61,43,31,0.5);
          line-height: 1.6; margin-top: 8px;
        }
        .admin-code-hint svg { width: 12px; height: 12px; flex-shrink: 0; margin-top: 1px; color: #C8892A; }

        .fg { margin-bottom: 16px; }
        .flbl { display: block; font-size: 10px; font-weight: 700; letter-spacing: 1.8px; text-transform: uppercase; color: rgba(61,43,31,0.48); margin-bottom: 7px; }
        .iw { position: relative; }
        .finput {
          width: 100%; background: white;
          border: 1px solid rgba(61,43,31,0.1);
          border-bottom: 2px solid rgba(61,43,31,0.14);
          color: #3D2B1F; font-family: 'Lato', sans-serif;
          font-size: 14px; font-weight: 300; padding: 12px 14px; outline: none;
          transition: all 0.25s; -webkit-appearance: none;
        }
        .finput::placeholder { color: rgba(61,43,31,0.2); }
        .finput:focus { border-bottom-color: #C8892A; box-shadow: 0 4px 14px rgba(61,43,31,0.06); }
        .finput.pt { padding-right: 46px; }
        .finput.ok { border-bottom-color: #27AE60; }
        .finput.no { border-bottom-color: #C0392B; }

        .eye-btn {
          position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(61,43,31,0.22); padding: 4px;
          display: flex; align-items: center; transition: color 0.2s;
        }
        .eye-btn:hover { color: #7C4A2D; }
        .eye-btn svg { width: 15px; height: 15px; }

        .str-wrap { margin-top: 7px; }
        .str-bars { display: flex; gap: 3px; margin-bottom: 5px; }
        .str-bar { flex: 1; height: 3px; background: rgba(61,43,31,0.08); transition: background 0.3s; }
        .str-meta { display: flex; justify-content: space-between; }
        .str-hint { font-size: 10.5px; font-weight: 300; color: rgba(61,43,31,0.35); }
        .str-lbl { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }

        .match { display: flex; align-items: center; gap: 6px; margin-top: 6px; }
        .match-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

        .err {
          display: flex; align-items: flex-start; gap: 9px;
          background: rgba(192,57,43,0.06); border: 1px solid rgba(192,57,43,0.17);
          padding: 12px 14px; margin-bottom: 14px; animation: slin 0.2s ease;
        }
        @keyframes slin { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }
        .err-ico { color: #C0392B; flex-shrink: 0; }
        .err-ico svg { width: 14px; height: 14px; }
        .err-txt { font-size: 12.5px; color: rgba(192,57,43,0.82); line-height: 1.5; }

        .sbtn {
          width: 100%; color: #FAF6EF;
          font-family: 'Lato', sans-serif; font-size: 11px; font-weight: 700;
          letter-spacing: 2px; text-transform: uppercase;
          padding: 15px; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.25s; margin-top: 6px;
        }
        .sbtn-admin { background: #3D2B1F; }
        .sbtn-admin:hover:not(:disabled) { background: #7C4A2D; transform: translateY(-1px); box-shadow: 0 8px 26px rgba(61,43,31,0.2); }
        .sbtn-user { background: #27AE60; }
        .sbtn-user:hover:not(:disabled) { background: #219a52; transform: translateY(-1px); box-shadow: 0 8px 26px rgba(39,174,96,0.25); }
        .sbtn:disabled { opacity: 0.5; cursor: not-allowed; }
        .sbtn svg { transition: transform 0.25s; }
        .sbtn:hover:not(:disabled) svg { transform: translateX(3px); }

        .spin {
          width: 13px; height: 13px;
          border: 1.5px solid rgba(250,246,239,0.3); border-top-color: #FAF6EF;
          border-radius: 50%; animation: rot 0.7s linear infinite; display: inline-block;
        }
        @keyframes rot { to{transform:rotate(360deg)} }

        .success-box { text-align: center; padding: 28px 12px; animation: slin 0.4s ease; }
        .success-icon {
          width: 60px; height: 60px; margin: 0 auto 16px;
          border: 1px solid rgba(39,174,96,0.35);
          display: flex; align-items: center; justify-content: center; color: #27AE60;
          animation: popIn 0.5s ease;
        }
        @keyframes popIn { from{transform:scale(0.7);opacity:0} to{transform:scale(1);opacity:1} }
        .success-icon svg { width: 26px; height: 26px; }
        .success-title { font-family: 'Playfair Display', serif; font-size: 22px; color: #3D2B1F; margin-bottom: 10px; }
        .success-desc { font-size: 13px; font-weight: 300; color: rgba(61,43,31,0.5); line-height: 1.7; margin-bottom: 24px; }
        .success-desc strong { font-weight: 700; color: #3D2B1F; }

        .role-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 12px; margin-bottom: 16px;
          font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;
          border: 1px solid;
        }
        .role-pill.admin { color: #C8892A; border-color: rgba(200,137,42,0.35); background: rgba(200,137,42,0.06); }
        .role-pill.user { color: #27AE60; border-color: rgba(39,174,96,0.35); background: rgba(39,174,96,0.06); }
        .role-pill svg { width: 11px; height: 11px; }

        .note-box {
          text-align: left; font-size: 11.5px; font-weight: 300;
          color: rgba(61,43,31,0.45); line-height: 1.6;
          background: rgba(61,43,31,0.03); border: 1px solid rgba(61,43,31,0.08);
          padding: 10px 14px; margin-bottom: 20px;
        }

        .divider { display: flex; align-items: center; gap: 12px; margin: 18px 0; }
        .div-line { flex: 1; height: 1px; background: rgba(61,43,31,0.08); }
        .div-txt { font-size: 11px; color: rgba(61,43,31,0.28); white-space: nowrap; }

        .switch-row { text-align: center; font-size: 12.5px; color: rgba(61,43,31,0.45); font-weight: 300; }
        .switch-row a { color: #7C4A2D; font-weight: 700; text-decoration: none; border-bottom: 1px solid rgba(124,74,45,0.3); transition: all 0.2s; }
        .switch-row a:hover { color: #3D2B1F; border-bottom-color: #3D2B1F; }

        .r-foot { margin-top: 22px; padding-top: 18px; border-top: 1px solid rgba(61,43,31,0.07); text-align: center; font-size: 11px; color: rgba(61,43,31,0.25); }
      `}</style>

      <div className="page">
        {/* ══ LEFT PANEL ══ */}
        <div className="left">
          <div className="grain"/>
          <div className="deco-rings">
            <div className="ring r1"/><div className="ring r2"/><div className="ring r3"/>
            <div className="ring r4"/><div className="ring r5"/><div className="ring r6"/>
          </div>
          <div className="deco-glow"/>

          <div className="l-top">
            <Link href="/" className="l-logo">
              <div className="l-logo-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L3 9v11h6v-6h6v6h6V9z"/>
                </svg>
              </div>
              <div>
                <span className="l-logo-name">Beuna Jaya Kayu</span>
                <span className="l-logo-sub">Portal Pendaftaran</span>
              </div>
            </Link>

            <h2 className="l-heading">Buat Akun<em>Pengguna</em></h2>
            <div className="l-line"/>
            <p className="l-desc">
              Daftar sebagai <strong style={{color:'rgba(39,174,96,0.8)'}}>Pengguna</strong> untuk
              mendapatkan rekomendasi kayu terbaik dan melakukan pemesanan kayu secara cepat.
            </p>
          </div>

          <div className="l-bottom">
            <div className="role-preview">
              <div className="role-prev-card highlighted">
                <div className="role-prev-icon" style={{ color: 'rgba(39,174,96,0.7)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div>
                  <div className="role-prev-name">Pengguna SPK Kayu</div>
                  <div className="role-prev-dest">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                    Akses rekomendasi & pemesanan
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div className="right">
          <Link href="/" className="back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Kembali ke Home
          </Link>

          <div className="page-tabs">
            <Link href="/login" className="page-tab inactive">Masuk</Link>
            <button className="page-tab active">Daftar</button>
          </div>

          {success ? (
            <div className="success-box">
              <div className="success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>

              <div className="role-pill user">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Pengguna
              </div>

              <h2 className="success-title">Registrasi Berhasil!</h2>
              <p className="success-desc">
                Akun untuk <strong>{email}</strong> telah berhasil dibuat. Silakan login untuk mulai menjelajahi dan memesan kayu.
              </p>

              <Link href="/login">
                <button className="sbtn sbtn-user" style={{ maxWidth: 260, margin: '0 auto' }}>
                  Pergi ke Login
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </Link>
            </div>
          ) : (
            <>
              <div className="r-eyebrow">Buat Akun Baru</div>
              <h1 className="r-title">Daftar Akun<br/><em>Pengguna</em></h1>
              <p className="r-sub">Lengkapi data diri Anda untuk pendaftaran.</p>

              <form onSubmit={handleRegister}>
                <div className="fg">
                  <label className="flbl" htmlFor="fullName">Nama Lengkap</label>
                  <input id="fullName" type="text" className="finput"
                    placeholder="Nama lengkap Anda" value={fullName}
                    onChange={e => setFullName(e.target.value)} required autoComplete="name"/>
                </div>

                <div className="fg">
                  <label className="flbl" htmlFor="email">Alamat Email</label>
                  <input id="email" type="email"
                    className={`finput ${email.length > 4 ? (email.includes('@') && email.includes('.') ? 'ok' : 'no') : ''}`}
                    placeholder="email@contoh.com" value={email}
                    onChange={e => setEmail(e.target.value)} required autoComplete="email"/>
                </div>

                <div className="fg">
                  <label className="flbl" htmlFor="password">Password</label>
                  <div className="iw">
                    <input id="password" type={showPassword ? 'text' : 'password'}
                      className="finput pt" placeholder="Minimal 8 karakter" value={password}
                      onChange={e => setPassword(e.target.value)} required autoComplete="new-password"/>
                    <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff/> : <EyeOpen/>}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="str-wrap">
                      <div className="str-bars">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="str-bar"
                            style={{ background: i <= strength.level ? strength.color : 'rgba(61,43,31,0.08)' }}/>
                        ))}
                      </div>
                      <div className="str-meta">
                        <span className="str-hint">Huruf besar, angka & simbol</span>
                        <span className="str-lbl" style={{ color: strength.color }}>{strength.label}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="fg">
                  <label className="flbl" htmlFor="confirmPassword">Konfirmasi Password</label>
                  <div className="iw">
                    <input id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      className={`finput pt ${confirmPassword.length > 0 ? (confirmPassword === password ? 'ok' : 'no') : ''}`}
                      placeholder="Ulangi password" value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password"/>
                    <button type="button" className="eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? <EyeOff/> : <EyeOpen/>}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && (
                    <div className="match">
                      <div className="match-dot"
                        style={{ background: confirmPassword === password ? '#27AE60' : '#C0392B' }}/>
                      <span style={{ color: confirmPassword === password ? '#27AE60' : '#C0392B', fontSize: 11, fontWeight: 300 }}>
                        {confirmPassword === password ? 'Password cocok' : 'Password tidak cocok'}
                      </span>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="err" role="alert">
                    <span className="err-ico">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                    </span>
                    <span className="err-txt">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="sbtn sbtn-user"
                  disabled={loading}
                >
                  {loading ? (
                    <><span className="spin"/> Membuat Akun...</>
                  ) : (
                    <>
                      Daftar Akun Pengguna
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <div className="divider">
                <div className="div-line"/>
                <span className="div-txt">Sudah punya akun?</span>
                <div className="div-line"/>
              </div>

              <p className="switch-row">
                Masuk melalui <Link href="/login">halaman login</Link>
              </p>
            </>
          )}

          <div className="r-foot">
            © {new Date().getFullYear()} Beuna Jaya Kayu — Sistem Pendukung Keputusan
          </div>
        </div>
      </div>
    </>
  )
}