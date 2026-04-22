'use client'
import { useState, useEffect, useRef } from 'react'
import { classify, statusClass, shortLabel, avgValues } from '@/lib/classify'
import { loadAll, getDaysInMonth, formatDateID, monthName, todayStr } from '@/lib/storage'

export default function MonthlyReport() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())
  const [days, setDays] = useState([])
  const [showExportModal, setShowExportModal] = useState(false)
  const canvasRef = useRef(null)

  useEffect(() => {
    setDays(getDaysInMonth(year, month))
  }, [year, month])

  useEffect(() => {
    if (days.length > 0) drawChart()
  }, [days])

  function shiftMonth(n) {
    let m = month + n, y = year
    if (m > 11) { m = 0; y++ }
    if (m < 0)  { m = 11; y-- }
    setMonth(m); setYear(y)
  }

  // ── Stats ──
  const allVals = [], pagiArr = [], siangArr = [], malamArr = []
  let cNormal = 0, cHigh = 0, cLow = 0, total = 0

  days.forEach(e => {
    ;['pagi','siang','malam'].forEach(t => {
      const v = e[t]
      if (v !== null && v !== undefined) {
        allVals.push(v); total++
        const cls = statusClass(classify(t, v))
        if (cls === 'normal') cNormal++
        else if (cls === 'high') cHigh++
        else cLow++
      }
    })
    if (e.pagi  !== null && e.pagi  !== undefined) pagiArr.push(e.pagi)
    if (e.siang !== null && e.siang !== undefined) siangArr.push(e.siang)
    if (e.malam !== null && e.malam !== undefined) malamArr.push(e.malam)
  })

  const globalAvg = avgValues(allVals)
  const pctNormal = total ? Math.round((cNormal / total) * 100) : null

  // ── Canvas line chart ──
  function drawChart() {
    const canvas = canvasRef.current
    if (!canvas || days.length === 0) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const W = canvas.parentElement.clientWidth - 40
    const H = 200
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    const PAD = { l: 32, r: 10, t: 10, b: 24 }
    const CW = W - PAD.l - PAD.r
    const CH = H - PAD.t - PAD.b

    const series = { pagi: [], siang: [], malam: [] }
    days.forEach(e => {
      ;['pagi','siang','malam'].forEach(t => {
        series[t].push(e[t] !== null && e[t] !== undefined ? e[t] : null)
      })
    })

    const allV = Object.values(series).flat().filter(v => v !== null)
    if (allV.length === 0) return
    const minV = Math.max(0, Math.min(...allV) - 20)
    const maxV = Math.max(...allV) + 20

    const xPos = i => PAD.l + (days.length > 1 ? (i / (days.length - 1)) * CW : CW / 2)
    const yPos = v => PAD.t + CH - ((v - minV) / (maxV - minV)) * CH

    // grid
    ctx.strokeStyle = '#2A3441'; ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = PAD.t + (i / 4) * CH
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(W - PAD.r, y); ctx.stroke()
      ctx.fillStyle = '#7D8590'; ctx.font = '10px Outfit, sans-serif'; ctx.textAlign = 'right'
      ctx.fillText(Math.round(maxV - (i / 4) * (maxV - minV)), PAD.l - 4, y + 4)
    }

    // x labels
    ctx.fillStyle = '#7D8590'; ctx.font = '10px Outfit'; ctx.textAlign = 'center'
    const step = Math.max(1, Math.floor(days.length / 6))
    days.forEach((e, i) => {
      if (i % step === 0 || i === days.length - 1)
        ctx.fillText(parseInt(e.date.split('-')[2]), xPos(i), H - 4)
    })

    // lines
    const colors = { pagi: '#FFC164', siang: '#3FB950', malam: '#58A6FF' }
    Object.entries(series).forEach(([t, vals]) => {
      ctx.strokeStyle = colors[t]; ctx.lineWidth = 2; ctx.lineJoin = 'round'
      ctx.beginPath(); let started = false
      vals.forEach((v, i) => {
        if (v === null) { started = false; return }
        const x = xPos(i), y = yPos(v)
        if (!started) { ctx.moveTo(x, y); started = true } else ctx.lineTo(x, y)
      })
      ctx.stroke()
      vals.forEach((v, i) => {
        if (v === null) return
        ctx.beginPath(); ctx.arc(xPos(i), yPos(v), 3, 0, Math.PI * 2)
        ctx.fillStyle = colors[t]; ctx.fill()
      })
    })
  }

  // ── Calendar heatmap ──
  const todayDate = todayStr()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const all = loadAll()
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`

  function getDayStatus(d) {
    const dateStr = `${prefix}-${String(d).padStart(2, '0')}`
    const e = all[dateStr]
    if (!e) return 'no-data'
    const hasAny = ['pagi','siang','malam'].some(t => e[t] !== null && e[t] !== undefined)
    if (!hasAny) return 'no-data'
    const hasHigh = ['pagi','siang','malam'].some(t => statusClass(classify(t, e[t])) === 'high')
    const hasLow  = ['pagi','siang','malam'].some(t => statusClass(classify(t, e[t])) === 'low')
    return hasHigh ? 'has-high' : hasLow ? 'has-low' : 'all-normal'
  }

  const calStyles = {
    'no-data':    { bg: 'var(--surface2)', color: 'var(--muted)' },
    'all-normal': { bg: 'rgba(63,185,80,0.25)',  color: 'var(--green)', border: 'rgba(63,185,80,0.4)' },
    'has-high':   { bg: 'rgba(248,81,73,0.2)',   color: 'var(--red)',   border: 'rgba(248,81,73,0.35)' },
    'has-low':    { bg: 'rgba(210,153,34,0.2)',  color: 'var(--yellow)',border: 'rgba(210,153,34,0.35)' },
  }

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700 }}>Laporan Bulanan</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Analisis tren & progres gula darahmu</p>
      </div>

      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => shiftMonth(-1)} style={navBtn}>‹</button>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700 }}>
          {monthName(month)} {year}
        </div>
        <button onClick={() => shiftMonth(1)} style={navBtn}>›</button>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { title: 'HARI TERCATAT', val: days.length, sub: `dari ${new Date(year, month+1, 0).getDate()} hari`, color: 'var(--blue)' },
          { title: 'RATA-RATA', val: globalAvg !== null ? `${globalAvg}` : '—', sub: 'mg/dL semua ukur',
            color: globalAvg === null ? 'var(--muted)' : globalAvg > 140 ? 'var(--red)' : 'var(--green)' },
          { title: '% NORMAL', val: pctNormal !== null ? `${pctNormal}%` : '—', sub: `${cNormal} dari ${total} ukur`, color: 'var(--green)' },
          { title: 'TINGGI / RENDAH', val: `${cHigh} / ${cLow}`, sub: 'kali melewati batas',
            color: cHigh > 0 ? 'var(--red)' : 'var(--green)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>{s.title}</div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Line chart */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 10 }}>
          Tren Harian (mg/dL)
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
          {[['#FFC164','Bangun Tidur'],['#3FB950','Setelah Makan'],['#58A6FF','Sebelum Tidur']].map(([c,l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: c }} />{l}
            </div>
          ))}
        </div>
        {days.length > 0
          ? <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} height={200} />
          : <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 14 }}>
              📭 Belum ada data bulan ini
            </div>
        }
      </div>

      {/* Calendar heatmap */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 10 }}>
          Kalender Status
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          {[['rgba(63,185,80,0.4)','Normal'],['rgba(248,81,73,0.35)','Tinggi'],['rgba(210,153,34,0.35)','Rendah']].map(([c,l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: c }} />{l}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
          {['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', paddingBottom: 6 }}>{d}</div>
          ))}
          {Array(firstDay).fill(null).map((_, i) => <div key={'e'+i} />)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const d = i + 1
            const st = getDayStatus(d)
            const cs = calStyles[st]
            const dateStr = `${prefix}-${String(d).padStart(2,'0')}`
            return (
              <div key={d} style={{
                aspectRatio: '1', borderRadius: 6, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 11, fontWeight: 600,
                background: cs.bg, color: cs.color,
                border: cs.border ? `1px solid ${cs.border}` : 'none',
                boxShadow: dateStr === todayDate ? '0 0 0 2px var(--blue)' : 'none',
              }}>
                {d}
              </div>
            )
          })}
        </div>
      </div>

      {/* History list */}
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--muted)',
        textTransform: 'uppercase', letterSpacing: 1 }}>Riwayat</div>
      {days.length === 0
        ? <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', fontSize: 14 }}>
            📭 Belum ada data bulan ini.<br/>Mulai catat dari tab Input.
          </div>
        : <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
            {[...days].reverse().map(e => {
              const nums = ['pagi','siang','malam'].map(t => e[t]).filter(v => v !== null)
              const avg = avgValues(nums)
              return (
                <div key={e.date} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px',
                  borderBottom: '1px solid var(--border)', gap: 12 }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, minWidth: 110 }}>
                    {formatDateID(e.date)}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                    {['pagi','siang','malam'].map(t => {
                      const v = e[t]
                      const cls = v !== null ? statusClass(classify(t, v)) : 'empty'
                      const bg = cls==='normal'?'var(--green-dim)':cls==='low'?'var(--yellow-dim)':cls==='high'?'var(--red-dim)':'var(--surface2)'
                      const co = cls==='normal'?'var(--green)':cls==='low'?'var(--yellow)':cls==='high'?'var(--red)':'var(--muted)'
                      return (
                        <div key={t} style={{ width: 32, height: 28, borderRadius: 6, background: bg,
                          color: co, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700 }}>
                          {v !== null ? v : '?'}
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>
                    {avg !== null ? `avg ${avg}` : '—'}
                  </div>
                </div>
              )
            })}
          </div>
      }

      {/* Export button */}
      <button onClick={() => setShowExportModal(true)} style={{
        width: '100%', padding: '14px 20px',
        background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
        color: '#fff', border: 'none', borderRadius: 14,
        fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700,
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 10, marginBottom: 10,
      }}>
        📄 Export PDF untuk Dokter
      </button>
      <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>
        Laporan profesional siap cetak / kirim ke dokter
      </p>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          year={year} month={month}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </>
  )
}

function ExportModal({ year, month, onClose }) {
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function doExport() {
    setLoading(true)
    try {
      const { exportMonthlyPDF } = await import('./ExportPDF')
      await exportMonthlyPDF({ year, month, patientName: name, patientDOB: dob, patientNote: note })
      onClose()
    } catch (e) {
      console.error(e)
      alert('Gagal export PDF. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 20, padding: 28, width: '100%', maxWidth: 440 }}>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
          📄 Export Laporan PDF
        </h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
          Laporan bulan {monthName(month)} {year} — opsional isi data pasien
        </p>

        {[
          { label: 'Nama Pasien (opsional)', val: name, set: setName, ph: 'contoh: Budi Santoso', type: 'text' },
          { label: 'Tanggal Lahir (opsional)', val: dob, set: setDob, ph: '', type: 'date' },
          { label: 'Catatan untuk Dokter (opsional)', val: note, set: setNote, ph: 'contoh: penderita DM tipe 2 sejak 2020', type: 'text' },
        ].map((f, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>{f.label}</label>
            <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--ink)', padding: '9px 12px',
                fontFamily: 'Outfit, sans-serif', fontSize: 14, outline: 'none' }} />
          </div>
        ))}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px 0', background: 'var(--surface2)',
            border: '1px solid var(--border)', borderRadius: 10, color: 'var(--ink)',
            fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Batal
          </button>
          <button onClick={doExport} disabled={loading} style={{ flex: 2, padding: '11px 0',
            background: loading ? 'var(--border)' : 'linear-gradient(135deg, #1d4ed8, #2563eb)',
            border: 'none', borderRadius: 10, color: '#fff',
            fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? '⏳ Membuat PDF...' : '📥 Download PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}

const navBtn = {
  background: 'var(--surface2)', border: '1px solid var(--border)',
  color: 'var(--ink)', borderRadius: 8, padding: '8px 14px',
  cursor: 'pointer', fontSize: 18, lineHeight: 1,
}
