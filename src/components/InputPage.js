'use client'
import { useState, useEffect } from 'react'
import { classify, statusClass, STATUS_LABELS, STATUS_DESCS } from '@/lib/classify'
import { getEntry, setEntry, todayStr } from '@/lib/storage'

const SESSIONS = [
  { id: 'pagi',  icon: '🌅', title: 'Bangun Tidur',        sub: 'Gula darah puasa (≥8 jam)',   bg: 'rgba(255,193,100,0.12)', ph: '80' },
  { id: 'siang', icon: '☀️', title: '2 Jam Setelah Makan', sub: 'Gula darah postprandial',     bg: 'rgba(63,185,80,0.12)',   ph: '120' },
  { id: 'malam', icon: '🌙', title: 'Sebelum Tidur',        sub: 'Gula darah bedtime',          bg: 'rgba(88,166,255,0.12)', ph: '110' },
]

function Toast({ msg, visible }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%',
      transform: `translateX(-50%) translateY(${visible ? 0 : 80}px)`,
      opacity: visible ? 1 : 0,
      background: 'var(--surface2)', border: '1px solid var(--border)',
      color: 'var(--ink)', borderRadius: 10, padding: '12px 20px',
      fontSize: 13, fontWeight: 500, zIndex: 999,
      transition: 'all 0.3s', whiteSpace: 'nowrap',
    }}>{msg}</div>
  )
}

export default function InputPage() {
  const [date, setDate] = useState(todayStr())
  const [vals, setVals] = useState({ pagi: '', siang: '', malam: '' })
  const [results, setResults] = useState({})
  const [toast, setToast] = useState({ msg: '', visible: false })

  useEffect(() => {
    const e = getEntry(date)
    setVals({
      pagi:  e.pagi  !== null ? String(e.pagi)  : '',
      siang: e.siang !== null ? String(e.siang) : '',
      malam: e.malam !== null ? String(e.malam) : '',
    })
    const r = {}
    ;['pagi','siang','malam'].forEach(t => {
      if (e[t] !== null) r[t] = e[t]
    })
    setResults(r)
  }, [date])

  function showToast(msg) {
    setToast({ msg, visible: true })
    setTimeout(() => setToast(p => ({ ...p, visible: false })), 2200)
  }

  function save(type) {
    const v = parseFloat(vals[type])
    if (isNaN(v) || v <= 0) { showToast('❌ Masukkan nilai yang valid'); return }
    setEntry(date, type, v)
    setResults(r => ({ ...r, [type]: v }))
    showToast('✅ Tersimpan!')
  }

  function getStatusColor(cls) {
    if (cls === 'normal') return 'var(--green)'
    if (cls === 'low') return 'var(--yellow)'
    return 'var(--red)'
  }
  function getStatusBg(cls) {
    if (cls === 'normal') return 'var(--green-dim)'
    if (cls === 'low') return 'var(--yellow-dim)'
    return 'var(--red-dim)'
  }
  function getStatusBorder(cls) {
    if (cls === 'normal') return 'rgba(63,185,80,0.3)'
    if (cls === 'low') return 'rgba(210,153,34,0.3)'
    return 'rgba(248,81,73,0.3)'
  }

  return (
    <>
      {/* Section header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700 }}>Catat Gula Darah</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Masukkan nilai pengukuran hari ini</p>
      </div>

      {/* Date picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: 'var(--muted)' }}>Tanggal:</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 8, color: 'var(--ink)', padding: '8px 12px',
          fontFamily: 'Outfit, sans-serif', fontSize: 14, outline: 'none',
        }} />
      </div>

      {SESSIONS.map(s => {
        const v = results[s.id]
        const status = classify(s.id, v)
        const cls = statusClass(status)
        const isCritical = status === 'terlalu_rendah' || status === 'terlalu_tinggi'
          || (status === 'rendah' && s.id === 'malam')

        return (
          <div key={s.id} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 20, marginBottom: 14,
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 600 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{s.sub}</div>
              </div>
            </div>

            {/* Input row */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input type="number"
                  value={vals[s.id]}
                  onChange={e => setVals(p => ({ ...p, [s.id]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && save(s.id)}
                  placeholder={s.ph}
                  min="20" max="600"
                  style={{
                    width: '100%', background: 'var(--bg)',
                    border: '1px solid var(--border)', borderRadius: 10,
                    color: 'var(--ink)', padding: '10px 52px 10px 14px',
                    fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700, outline: 'none',
                  }}
                />
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 12, color: 'var(--muted)', pointerEvents: 'none' }}>mg/dL</span>
              </div>
              <button onClick={() => save(s.id)} style={{
                background: 'var(--blue)', color: '#0D1117',
                border: 'none', borderRadius: 10, padding: '10px 18px',
                fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}>Simpan</button>
            </div>

            {/* Result */}
            {v !== undefined && status && (
              <div style={{
                marginTop: 12, borderRadius: 10, padding: '10px 14px',
                background: getStatusBg(cls), border: `1px solid ${getStatusBorder(cls)}`,
                display: 'flex', alignItems: 'flex-start', gap: 8,
              }}>
                <span>{cls === 'normal' ? '✅' : cls === 'low' ? '⚠️' : '🔴'}</span>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 13, color: getStatusColor(cls) }}>
                    {STATUS_LABELS[status]}
                  </span>
                  {' '}
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                    {STATUS_DESCS[s.id][status]}
                  </span>
                </div>
              </div>
            )}

            {/* Critical warning */}
            {v !== undefined && isCritical && (
              <div style={{
                marginTop: 8, background: 'var(--red)', color: '#fff',
                borderRadius: 10, padding: '10px 14px',
                fontSize: 12, fontWeight: 500, lineHeight: 1.5,
                display: 'flex', gap: 8, alignItems: 'flex-start',
                animation: 'pulse 1.4s ease-in-out infinite',
              }}>
                <span>⚠️</span>
                <span>
                  {status === 'terlalu_rendah'
                    ? 'PERINGATAN: Gula darah sangat rendah! Segera konsumsi 15–20g gula cepat (jus/madu) dan hubungi dokter.'
                    : status === 'terlalu_tinggi'
                    ? 'PERINGATAN: Gula darah sangat tinggi! Ini bisa darurat medis. Segera hubungi dokter atau klinik terdekat.'
                    : 'PERHATIAN: Gula darah rendah sebelum tidur. Konsumsi camilan ringan berkarbohidrat.'}
                </span>
              </div>
            )}
          </div>
        )
      })}

      <Toast msg={toast.msg} visible={toast.visible} />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.75}}`}</style>
    </>
  )
}
