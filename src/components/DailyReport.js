'use client'
import { useState, useEffect } from 'react'
import { classify, statusClass, shortLabel } from '@/lib/classify'
import { getEntry, todayStr, formatDateID } from '@/lib/storage'

export default function DailyReport() {
  const [date, setDate] = useState(todayStr())
  const [entry, setEntry_] = useState({ pagi: null, siang: null, malam: null })

  useEffect(() => { setEntry_(getEntry(date)) }, [date])

  function shift(n) {
    const d = new Date(date + 'T00:00:00')
    d.setDate(d.getDate() + n)
    setDate(d.toISOString().split('T')[0])
  }

  const sessions = [
    { id: 'pagi',  icon: '🌅', label: 'Bangun\nTidur' },
    { id: 'siang', icon: '☀️', label: '2 Jam\nSetelah Makan' },
    { id: 'malam', icon: '🌙', label: 'Sebelum\nTidur' },
  ]

  function getColor(cls) {
    if (cls === 'normal') return 'var(--green)'
    if (cls === 'low') return 'var(--yellow)'
    if (cls === 'high') return 'var(--red)'
    return 'var(--muted)'
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700 }}>Laporan Harian</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Detail pengukuran — {formatDateID(date)}</p>
      </div>

      {/* Date nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => shift(-1)} style={navBtn}>‹</button>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={dateInput} />
        <button onClick={() => shift(1)} style={navBtn}>›</button>
      </div>

      {/* 3 summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {sessions.map(s => {
          const v = entry[s.id]
          const st = classify(s.id, v)
          const cls = statusClass(st)
          const color = getColor(cls)
          return (
            <div key={s.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: v !== null ? 24 : 20,
                fontWeight: 800, color: v !== null ? color : 'var(--muted)' }}>
                {v !== null ? v : '—'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, whiteSpace: 'pre-line', lineHeight: 1.3 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, marginTop: 6, color: v !== null ? color : 'var(--muted)' }}>
                {v !== null ? shortLabel(st) : 'Belum diisi'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bar chart */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 600,
          color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
          Visualisasi Hari Ini
        </div>
        {sessions.map(s => {
          const v = entry[s.id]
          const st = classify(s.id, v)
          const cls = statusClass(st)
          const pct = v !== null ? Math.min((v / 300) * 100, 100) : 0
          const fillColor = cls === 'normal' ? 'var(--green)' : cls === 'low' ? 'var(--yellow)' : cls === 'high' ? 'var(--red)' : 'var(--border)'
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 18, width: 28, textAlign: 'right', flexShrink: 0 }}>{s.icon}</div>
              <div style={{ flex: 1, height: 28, background: 'var(--surface2)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  width: `${pct}%`, height: '100%', background: fillColor,
                  borderRadius: 6, display: 'flex', alignItems: 'center',
                  paddingLeft: 10, fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700,
                  color: '#0D1117', transition: 'width 0.6s ease', minWidth: v !== null ? 60 : 0,
                  whiteSpace: 'nowrap',
                }}>
                  {v !== null ? `${v} mg/dL` : ''}
                </div>
              </div>
              {v === null && <span style={{ fontSize: 12, color: 'var(--muted)' }}>—</span>}
            </div>
          )
        })}
      </div>
    </>
  )
}

const navBtn = {
  background: 'var(--surface2)', border: '1px solid var(--border)',
  color: 'var(--ink)', borderRadius: 8, padding: '8px 14px',
  cursor: 'pointer', fontSize: 18, lineHeight: 1,
}
const dateInput = {
  flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--ink)', padding: '8px 12px',
  fontFamily: 'Outfit, sans-serif', fontSize: 14, outline: 'none',
}
