'use client'
import { useState, useEffect } from 'react'
import { getEntry, addMeal, deleteMeal, todayStr, formatDateID } from '@/lib/storage'
import { classify, statusClass } from '@/lib/classify'

const CARB_TAGS = [
  { label: 'Rendah', value: 'rendah', color: '#3FB950', desc: '< 15g' },
  { label: 'Sedang', value: 'sedang', color: '#D29922', desc: '15–45g' },
  { label: 'Tinggi', value: 'tinggi', color: '#F85149', desc: '> 45g' },
]

const MEAL_PRESETS = [
  'Nasi putih', 'Nasi goreng', 'Mie ayam', 'Roti tawar', 'Bubur ayam',
  'Soto ayam', 'Gado-gado', 'Pecel lele', 'Ayam bakar', 'Tempe tahu',
  'Sayur lodeh', 'Sup ayam', 'Es teh manis', 'Jus buah', 'Kopi susu',
  'Snack biskuit', 'Buah-buahan', 'Salad', 'Kentang goreng', 'Pizza',
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

export default function MealsPage() {
  const [date, setDate] = useState(todayStr())
  const [entry, setEntry_] = useState({ meals: [], pagi: null, siang: null, malam: null })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ time: '', name: '', carbs: 'sedang', notes: '' })
  const [toast, setToast] = useState({ msg: '', visible: false })
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => { reload() }, [date])

  function reload() {
    const e = getEntry(date)
    setEntry_({ ...e, meals: e.meals || [] })
  }

  function showToast(msg) {
    setToast({ msg, visible: true })
    setTimeout(() => setToast(p => ({ ...p, visible: false })), 2000)
  }

  function handleAdd() {
    if (!form.name.trim()) { showToast('❌ Nama makanan wajib diisi'); return }
    if (!form.time) { showToast('❌ Waktu makan wajib diisi'); return }
    const meal = { id: Date.now().toString(), ...form, name: form.name.trim() }
    addMeal(date, meal)
    reload()
    setForm({ time: '', name: '', carbs: 'sedang', notes: '' })
    setShowForm(false)
    setSuggestions([])
    showToast('✅ Makanan tercatat!')
  }

  function handleDelete(id) {
    deleteMeal(date, id)
    reload()
    showToast('🗑️ Dihapus')
  }

  function handleNameInput(val) {
    setForm(f => ({ ...f, name: val }))
    if (val.length > 1) {
      setSuggestions(MEAL_PRESETS.filter(p => p.toLowerCase().includes(val.toLowerCase())).slice(0, 5))
    } else {
      setSuggestions([])
    }
  }

  // Korelasi yang benar:
  // GDP pagi = puasa 8 jam, tidak terkait makanan apapun
  // Makan pagi (< jam 11) = tidak ada GD yang langsung mengukur efeknya
  // Makan siang (jam 11-17) → GD 2 jam setelah makan
  // Makan malam (> jam 17) → GD sebelum tidur
  function getCorrelation(meal) {
    if (!meal.time) return { noLink: true, reason: 'Waktu tidak diset' }
    const mealHour = parseInt(meal.time.split(':')[0])
    if (mealHour < 11) {
      return { noLink: true, reason: 'Makan pagi tidak berkorelasi dengan GDP (GDP = puasa, bukan dipengaruhi makan pagi)' }
    } else if (mealHour < 17) {
      const v = entry.siang
      if (v === null || v === undefined) return { noLink: true, reason: 'GD 2 jam setelah makan belum diisi' }
      return { val: v, cls: statusClass(classify('siang', v)), label: 'GD 2 Jam Stlh Makan' }
    } else {
      const v = entry.malam
      if (v === null || v === undefined) return { noLink: true, reason: 'GD sebelum tidur belum diisi' }
      return { val: v, cls: statusClass(classify('malam', v)), label: 'GD Sebelum Tidur' }
    }
  }

  function carbColor(c) {
    return CARB_TAGS.find(t => t.value === c)?.color || 'var(--muted)'
  }
  function carbLabel(c) {
    return CARB_TAGS.find(t => t.value === c)?.label || c
  }

  const meals = entry.meals || []

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700 }}>Catatan Makanan</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
          Catat asupan harian & lihat korelasi dengan gula darah
        </p>
      </div>

      {/* Date picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <label style={{ fontSize: 13, color: 'var(--muted)' }}>Tanggal:</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={dateInputStyle} />
      </div>

      {/* Add button */}
      <button onClick={() => setShowForm(v => !v)} style={{
        width: '100%', padding: '13px 20px', marginBottom: 16,
        background: showForm ? 'var(--surface2)' : 'var(--blue)',
        color: showForm ? 'var(--muted)' : '#0D1117',
        border: showForm ? '1px solid var(--border)' : 'none',
        borderRadius: 12, fontFamily: 'Syne, sans-serif',
        fontSize: 14, fontWeight: 700, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        {showForm ? '✕ Batal' : '+ Tambah Makanan'}
      </button>

      {/* Add Form */}
      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--blue)',
          borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
            Catat Makanan Baru
          </div>

          {/* Time */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Waktu Makan</label>
            <input type="time" value={form.time}
              onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
              style={inputStyle} />
          </div>

          {/* Name with autocomplete */}
          <div style={{ marginBottom: 14, position: 'relative' }}>
            <label style={labelStyle}>Nama Makanan / Minuman</label>
            <input type="text" value={form.name}
              onChange={e => handleNameInput(e.target.value)}
              placeholder="contoh: Nasi goreng, Es teh manis..."
              style={inputStyle} />
            {suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 8, zIndex: 10, overflow: 'hidden' }}>
                {suggestions.map(s => (
                  <div key={s} onClick={() => { setForm(f => ({ ...f, name: s })); setSuggestions([]) }}
                    style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                      borderBottom: '1px solid var(--border)',
                      transition: 'background 0.15s' }}
                    onMouseEnter={e => e.target.style.background = 'var(--border)'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}>
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Carbs level */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Kandungan Karbohidrat</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {CARB_TAGS.map(t => (
                <button key={t.value} onClick={() => setForm(f => ({ ...f, carbs: t.value }))}
                  style={{
                    flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                    border: form.carbs === t.value ? `2px solid ${t.color}` : '1px solid var(--border)',
                    background: form.carbs === t.value ? `${t.color}22` : 'var(--bg)',
                    color: form.carbs === t.value ? t.color : 'var(--muted)',
                    fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700,
                    transition: 'all 0.15s',
                  }}>
                  {t.label}<br/>
                  <span style={{ fontSize: 10, fontWeight: 400 }}>{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Catatan (opsional)</label>
            <input type="text" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="contoh: porsi besar, extra santan..."
              style={inputStyle} />
          </div>

          <button onClick={handleAdd} style={{
            width: '100%', padding: '12px', background: 'var(--blue)',
            color: '#0D1117', border: 'none', borderRadius: 10,
            fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            Simpan Makanan
          </button>
        </div>
      )}

      {/* Meals list */}
      {meals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 14, color: 'var(--muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🍽️</div>
          <p style={{ fontSize: 14 }}>Belum ada catatan makanan hari ini</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Tap "+ Tambah Makanan" untuk mulai</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {meals.sort((a,b) => a.time.localeCompare(b.time)).map(meal => {
            const corr = getCorrelation(meal)
            return (
              <div key={meal.id} style={{ background: 'var(--surface)',
                border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {/* Time badge */}
                  <div style={{ background: 'var(--surface2)', borderRadius: 8,
                    padding: '6px 10px', textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700 }}>
                      {meal.time}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700 }}>
                        {meal.name}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px',
                        borderRadius: 20, background: `${carbColor(meal.carbs)}22`,
                        color: carbColor(meal.carbs), border: `1px solid ${carbColor(meal.carbs)}44` }}>
                        Karbo {carbLabel(meal.carbs)}
                      </span>
                    </div>
                    {meal.notes && (
                      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{meal.notes}</p>
                    )}

                    {/* Correlation */}
                    {corr && !corr.noLink ? (
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>→ {corr.label}:</span>
                        <span style={{
                          fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                          background: corr.cls==='normal'?'var(--green-dim)':corr.cls==='low'?'var(--yellow-dim)':'var(--red-dim)',
                          color: corr.cls==='normal'?'var(--green)':corr.cls==='low'?'var(--yellow)':'var(--red)',
                        }}>
                          {corr.val} mg/dL
                        </span>
                        <span style={{ fontSize: 11 }}>
                          {corr.cls==='normal'?'✅ Normal':corr.cls==='low'?'⚠️ Rendah':'🔴 Tinggi'}
                        </span>
                      </div>
                    ) : (
                      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>
                        ℹ️ {corr?.reason || 'Belum ada data gula darah'}
                      </div>
                    )}
                  </div>

                  {/* Delete */}
                  <button onClick={() => handleDelete(meal.id)} style={{
                    background: 'none', border: 'none', color: 'var(--muted)',
                    cursor: 'pointer', fontSize: 16, padding: '4px', flexShrink: 0,
                    borderRadius: 6, transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.target.style.color = 'var(--red)'}
                  onMouseLeave={e => e.target.style.color = 'var(--muted)'}>
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Info box */}
      {meals.length > 0 && (
        <div style={{ marginTop: 16, background: 'var(--blue-dim)', border: '1px solid rgba(88,166,255,0.3)',
          borderRadius: 12, padding: '12px 16px', fontSize: 12, color: 'var(--blue)', lineHeight: 1.6 }}>
          💡 Korelasi dihitung otomatis — makanan pagi dikaitkan dengan GD puasa, makan siang dengan GD 2 jam,
          makan malam dengan GD sebelum tidur. Pastikan input gula darah sudah diisi di tab <b>✏️ Input</b>.
        </div>
      )}

      <Toast msg={toast.msg} visible={toast.visible} />
    </>
  )
}

const labelStyle = { fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }
const inputStyle = {
  width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--ink)', padding: '9px 12px',
  fontFamily: 'Outfit, sans-serif', fontSize: 14, outline: 'none',
}
const dateInputStyle = {
  flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--ink)', padding: '8px 12px',
  fontFamily: 'Outfit, sans-serif', fontSize: 14, outline: 'none',
}
