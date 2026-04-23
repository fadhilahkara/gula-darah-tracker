const KEY = 'gula_darah_v2'

export function loadAll() {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} }
}

export function saveAll(data) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function getEntry(date) {
  const d = loadAll()
  return d[date] || { pagi: null, siang: null, malam: null, meals: [] }
}

export function setEntry(date, type, val) {
  const d = loadAll()
  if (!d[date]) d[date] = { pagi: null, siang: null, malam: null, meals: [] }
  if (!d[date].meals) d[date].meals = []
  d[date][type] = val
  saveAll(d)
  return d
}

// ── Meals ──
export function addMeal(date, meal) {
  // meal = { id, time, name, carbs, notes }
  const d = loadAll()
  if (!d[date]) d[date] = { pagi: null, siang: null, malam: null, meals: [] }
  if (!d[date].meals) d[date].meals = []
  d[date].meals.push(meal)
  saveAll(d)
}

export function deleteMeal(date, mealId) {
  const d = loadAll()
  if (!d[date]?.meals) return
  d[date].meals = d[date].meals.filter(m => m.id !== mealId)
  saveAll(d)
}

export function getDaysInMonth(year, month) {
  const all = loadAll()
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
  return Object.keys(all)
    .filter(k => k.startsWith(prefix))
    .sort()
    .map(k => ({ date: k, ...all[k] }))
}

export function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export function formatDateID(str) {
  if (!str) return ''
  const [y, m, d] = str.split('-')
  const months = ['Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember']
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`
}

export function monthName(month) {
  return ['Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'][month]
}
