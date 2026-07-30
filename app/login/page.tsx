// app/login/page.tsx
'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message || 'Login gagal. Periksa email dan password Anda.')
      setLoading(false)
      return
    }

    if (!data.user) {
      setError('Login gagal. Silakan coba lagi.')
      setLoading(false)
      return
    }

    let userRole = 'user'
    const isSuperAdminEmail = data.user.email?.toLowerCase() === 'muzakirwalad28@gmail.com'

    if (isSuperAdminEmail) {
      userRole = 'admin'
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || 'Super Admin',
          role: 'admin',
        }, { onConflict: 'id' })
      } catch (e) {
        console.warn('DB Trigger prevented client profile update:', e)
      }
    } else {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle()

        if (profile?.role) {
          userRole = profile.role
        } else {
          const metaRole = data.user.user_metadata?.requested_role || data.user.user_metadata?.role
          if (metaRole === 'admin') userRole = 'admin'
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
            role: userRole,
          }, { onConflict: 'id' })
        }
      } catch (err) {
        console.warn('Gagal membaca profil, fallback ke metadata:', err)
        const metaRole = data.user.user_metadata?.requested_role || data.user.user_metadata?.role
        if (metaRole === 'admin') userRole = 'admin'
      }
    }

    if (userRole === 'admin') {
      router.push('/admin/dashboard')
    } else {
      router.push('/user')
    }
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
          --light: #F5EEE3;
        }

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Lato', sans-serif; background: var(--bark); min-height: 100vh; -webkit-font-smoothing: antialiased; }

        .page { min-height: 100vh; display: flex; }

        /* ══ LEFT PANEL ══ */
        .left {
          flex: 1; background: var(--bark);
          display: none; flex-direction: column;
          justify-content: space-between; padding: 56px;
          position: relative; overflow: hidden;
        }
        @media (min-width: 960px) { .left { display: flex; } }

        /* Tekstur kayu halus — repeating grain, bukan noise generik */
        .grain {
          position: absolute; inset: 0; pointer-events: none; opacity: 0.5;
          background-image: repeating-linear-gradient(
            100deg,
            transparent 0px, transparent 3px,
            rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px,
            transparent 4px, transparent 9px,
            rgba(0,0,0,0.05) 9px, rgba(0,0,0,0.05) 10px
          );
        }

        /* Satu motif lingkaran cincin kayu — signature element, bukan dekorasi berlapis */
        .tree-ring {
          position: absolute; bottom: -140px; right: -140px;
          width: 420px; height: 420px; pointer-events: none;
        }
        .tree-ring svg { width: 100%; height: 100%; }
        .tree-ring circle { fill: none; stroke: rgba(196,137,58,0.1); }

        .l-top { position: relative; z-index: 2; }
        .l-logo { display: flex; align-items: center; gap: 11px; margin-bottom: 64px; text-decoration: none; width: fit-content; }
        .l-logo-mark {
          width: 36px; height: 36px; border: 1px solid rgba(196,137,58,0.35);
          display: flex; align-items: center; justify-content: center;
        }
        .l-logo-mark svg { width: 17px; height: 17px; color: var(--honey); }
        .l-logo-name { font-family: 'Playfair Display', serif; font-size: 13.5px; font-weight: 500; color: var(--cream); }
        .l-logo-sub { font-size: 8.5px; color: rgba(250,246,239,0.28); letter-spacing: 2px; text-transform: uppercase; margin-top: 3px; display: block; }

        .l-eyebrow { font-size: 9.5px; font-weight: 700; letter-spacing: 2.6px; text-transform: uppercase; color: var(--honey); margin-bottom: 16px; display: flex; align-items: center; gap: 9px; }
        .l-eyebrow::before { content: ''; display: block; width: 18px; height: 1px; background: var(--honey); }
        .l-heading { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 400; color: var(--cream); line-height: 1.16; max-width: 380px; }
        .l-heading em { font-style: italic; color: var(--honey); }
        .l-desc { font-size: 12.5px; font-weight: 300; color: rgba(250,246,239,0.4); line-height: 1.8; max-width: 300px; margin-top: 20px; }

        .l-bottom { position: relative; z-index: 2; }

        .l-quote {
          font-family: 'Playfair Display', serif; font-style: italic;
          font-size: 15px; color: rgba(250,246,239,0.5); line-height: 1.6;
          max-width: 320px; margin-bottom: 32px; position: relative; padding-left: 18px;
        }
        .l-quote::before { content: ''; position: absolute; left: 0; top: 3px; bottom: 3px; width: 2px; background: rgba(196,137,58,0.4); }

        /* Role redirect info */
        .redirect-cards { display: flex; flex-direction: column; gap: 1px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.05); }
        .redirect-card {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 16px; background: rgba(20,14,9,0.4);
        }
        .redir-icon {
          width: 28px; height: 28px; flex-shrink: 0;
          border: 1px solid rgba(196,137,58,0.22);
          display: flex; align-items: center; justify-content: center;
          color: rgba(196,137,58,0.65);
        }
        .redir-icon svg { width: 12px; height: 12px; }
        .redir-role { font-size: 10px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: rgba(250,246,239,0.6); margin-bottom: 2px; }
        .redir-dest { font-size: 11px; font-weight: 300; color: rgba(250,246,239,0.3); display: flex; align-items: center; gap: 5px; }
        .redir-dest svg { width: 10px; height: 10px; }

        /* ══ RIGHT PANEL ══ */
        .right {
          width: 100%; max-width: 480px;
          background: var(--cream);
          display: flex; flex-direction: column; justify-content: center;
          padding: 60px 48px; position: relative;
        }
        @media (max-width: 960px) { .right { max-width: 100%; padding: 60px 28px; } }

        .back-btn {
          position: absolute; top: 26px; left: 26px;
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; color: rgba(61,43,31,0.36);
          text-decoration: none; transition: color 0.2s;
        }
        .back-btn:hover { color: var(--wood); }
        .back-btn svg { width: 12px; height: 12px; }

        /* Tabs */
        .page-tabs {
          display: flex; border: 1px solid rgba(61,43,31,0.1);
          margin-bottom: 34px; overflow: hidden;
        }
        .page-tab {
          flex: 1; padding: 11px 0; text-align: center;
          font-size: 10.5px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase;
          text-decoration: none; transition: background 0.2s, color 0.2s;
          border: none; cursor: pointer; font-family: 'Lato', sans-serif;
        }
        .page-tab.active { background: var(--bark); color: var(--cream); }
        .page-tab.inactive { background: transparent; color: rgba(61,43,31,0.4); }
        .page-tab.inactive:hover { background: rgba(61,43,31,0.04); color: var(--bark); }

        .r-eyebrow {
          font-size: 9.5px; font-weight: 700; letter-spacing: 2.4px; text-transform: uppercase;
          color: var(--honey); margin-bottom: 9px; display: flex; align-items: center; gap: 8px;
        }
        .r-eyebrow::before { content: ''; display: block; width: 18px; height: 1px; background: var(--honey); }

        .r-title { font-family: 'Playfair Display', serif; font-size: 30px; font-weight: 400; color: var(--bark); line-height: 1.12; margin-bottom: 8px; }
        .r-title em { font-style: italic; color: var(--wood); }
        .r-sub { font-size: 12.5px; font-weight: 300; color: rgba(61,43,31,0.42); line-height: 1.6; margin-bottom: 30px; }

        /* Info box */
        .info-box {
          display: flex; align-items: flex-start; gap: 9px;
          background: rgba(196,137,58,0.06); border: 1px solid rgba(196,137,58,0.16);
          padding: 11px 14px; margin-bottom: 22px;
        }
        .info-box svg { width: 14px; height: 14px; color: var(--honey); flex-shrink: 0; margin-top: 1px; }
        .info-txt { font-size: 11.5px; font-weight: 300; color: rgba(61,43,31,0.6); line-height: 1.55; }
        .info-txt strong { font-weight: 700; color: var(--bark); }

        /* form */
        .fg { margin-bottom: 20px; }
        .flbl { display: block; font-size: 9.5px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; color: rgba(61,43,31,0.46); margin-bottom: 8px; }
        .iw { position: relative; }
        .finput {
          width: 100%; background: white;
          border: 1px solid rgba(61,43,31,0.1); border-bottom: 2px solid rgba(61,43,31,0.14);
          color: var(--bark); font-family: 'Lato', sans-serif;
          font-size: 13.5px; font-weight: 300; padding: 13px 15px; outline: none;
          transition: border-color 0.2s; -webkit-appearance: none;
        }
        .finput::placeholder { color: rgba(61,43,31,0.2); }
        .finput:focus { border-bottom-color: var(--honey); }
        .finput.pt { padding-right: 46px; }

        .eye-btn {
          position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(61,43,31,0.22); padding: 4px;
          display: flex; align-items: center; transition: color 0.2s;
        }
        .eye-btn:hover { color: var(--wood); }
        .eye-btn svg { width: 15px; height: 15px; }

        .err {
          display: flex; align-items: flex-start; gap: 9px;
          background: rgba(193,115,97,0.07); border: 1px solid rgba(193,115,97,0.22);
          padding: 12px 14px; margin-bottom: 18px;
        }
        .err-ico { color: #C17361; flex-shrink: 0; }
        .err-ico svg { width: 14px; height: 14px; }
        .err-txt { font-size: 12px; color: #A8543F; line-height: 1.5; }

        .sbtn {
          width: 100%; background: var(--bark); color: var(--cream);
          font-family: 'Lato', sans-serif; font-size: 10.5px; font-weight: 700;
          letter-spacing: 1.8px; text-transform: uppercase;
          padding: 16px; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.2s; margin-top: 6px;
        }
        .sbtn:hover:not(:disabled) { background: var(--wood); }
        .sbtn:disabled { opacity: 0.5; cursor: not-allowed; }
        .sbtn svg { transition: transform 0.2s; }
        .sbtn:hover:not(:disabled) svg { transform: translateX(3px); }

        .spin {
          width: 13px; height: 13px;
          border: 1.5px solid rgba(250,246,239,0.3); border-top-color: var(--cream);
          border-radius: 50%; animation: rot 0.7s linear infinite; display: inline-block;
        }
        @keyframes rot { to{transform:rotate(360deg)} }

        .divider { display: flex; align-items: center; gap: 12px; margin: 22px 0; }
        .div-line { flex: 1; height: 1px; background: rgba(61,43,31,0.08); }
        .div-txt { font-size: 10.5px; color: rgba(61,43,31,0.28); white-space: nowrap; }

        .switch-row { text-align: center; font-size: 12px; color: rgba(61,43,31,0.45); font-weight: 300; }
        .switch-row a { color: var(--wood); font-weight: 700; text-decoration: none; border-bottom: 1px solid rgba(124,74,45,0.3); transition: color 0.2s, border-color 0.2s; }
        .switch-row a:hover { color: var(--bark); border-bottom-color: var(--bark); }

        .r-foot { margin-top: 28px; padding-top: 20px; border-top: 1px solid rgba(61,43,31,0.07); text-align: center; font-size: 10.5px; color: rgba(61,43,31,0.25); }
      `}</style>

      <div className="page">
        {/* LEFT */}
        <div className="left">
          <div className="grain"/>
          <div className="tree-ring">
            <svg viewBox="0 0 420 420">
              <circle cx="210" cy="210" r="90"/>
              <circle cx="210" cy="210" r="140"/>
              <circle cx="210" cy="210" r="190"/>
            </svg>
          </div>

          <div className="l-top">
            <Link href="/" className="l-logo">
              <div className="l-logo-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L3 9v11h6v-6h6v6h6V9z"/>
                </svg>
              </div>
              <div>
                <span className="l-logo-name">Beuna Jaya Kayu</span>
                <span className="l-logo-sub">Portal Masuk</span>
              </div>
            </Link>

            <div className="l-eyebrow">Sistem Pendukung Keputusan</div>
            <h2 className="l-heading">Selamat Datang <em>Kembali</em></h2>
            <p className="l-desc">
              Masuk sesuai akun Anda. Sistem akan otomatis mengarahkan ke halaman yang sesuai dengan peran Anda.
            </p>
          </div>

          <div className="l-bottom">
            <p className="l-quote">
              "Setiap jenis kayu punya karakter sendiri — tugas kami membantu Anda menemukan yang tepat."
            </p>

            <div className="redirect-cards">
              <div className="redirect-card">
                <div className="redir-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                  </svg>
                </div>
                <div>
                  <div className="redir-role">Admin</div>
                  <div className="redir-dest">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                    Diarahkan ke Dashboard Admin
                  </div>
                </div>
              </div>
              <div className="redirect-card">
                <div className="redir-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div>
                  <div className="redir-role">Pengguna</div>
                  <div className="redir-dest">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                    Diarahkan ke Halaman Home
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="right">
          <Link href="/" className="back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Kembali ke Home
          </Link>

          <div className="page-tabs">
            <button className="page-tab active">Masuk</button>
            <Link href="/register" className="page-tab inactive">Daftar</Link>
          </div>

          <div className="r-eyebrow">Portal Masuk</div>
          <h1 className="r-title">Masuk ke<br/><em>Akun Anda</em></h1>
          <p className="r-sub">Sistem akan mengarahkan Anda sesuai peran yang terdaftar.</p>

          {/* Info redirect */}
          <div className="info-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span className="info-txt">
              <strong>Admin</strong> → Dashboard Admin &nbsp;|&nbsp; <strong>Pengguna</strong> → Halaman Home
            </span>
          </div>

          <form onSubmit={handleLogin}>
            <div className="fg">
              <label className="flbl" htmlFor="email">Alamat Email</label>
              <div className="iw">
                <input id="email" type="email" className="finput"
                  placeholder="email@contoh.com" value={email}
                  onChange={e => setEmail(e.target.value)} required autoComplete="email"/>
              </div>
            </div>

            <div className="fg">
              <label className="flbl" htmlFor="password">Password</label>
              <div className="iw">
                <input id="password" type={showPassword ? 'text' : 'password'}
                  className="finput pt" placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} required autoComplete="current-password"/>
                <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
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

            <button type="submit" className="sbtn" disabled={loading}>
              {loading ? (
                <><span className="spin"/> Memverifikasi...</>
              ) : (
                <>
                  Masuk ke Akun
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="divider">
            <div className="div-line"/>
            <span className="div-txt">Belum punya akun?</span>
            <div className="div-line"/>
          </div>

          <p className="switch-row">
            Daftar akun baru di <Link href="/register">halaman registrasi</Link>
          </p>

          <div className="r-foot">
            © {new Date().getFullYear()} Beuna Jaya Kayu — Sistem Pendukung Keputusan
          </div>
        </div>
      </div>
    </>
  )
}