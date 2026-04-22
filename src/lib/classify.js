// ─────────────────────────────────────────
//  Blood Sugar Classification Engine
// ─────────────────────────────────────────

export const CFG = {
  pagi:  { normal: [70, 99],   predi: [100, 125], lowWarn: 40,  highWarn: 300 },
  siang: { normal: [0, 139],   predi: [140, 199], lowWarn: 40,  highWarn: 300 },
  malam: { normal: [100, 140], predi: [141, 160], lowWarn: 80,  highWarn: 270 },
}

export const STATUS_LABELS = {
  terlalu_rendah: 'Sangat Rendah',
  rendah:         'Rendah',
  normal:         'Normal',
  prediabetes:    'Prediabetes',
  tinggi:         'Tinggi',
  terlalu_tinggi: 'Sangat Tinggi',
}

export const STATUS_DESCS = {
  pagi: {
    terlalu_rendah: 'Gula darah puasa sangat rendah. Segera konsumsi sumber gula cepat.',
    rendah:         'Di bawah normal. Perhatikan asupan makan malam sebelumnya.',
    normal:         'Gula darah puasa dalam rentang sehat (70–99 mg/dL).',
    prediabetes:    'Nilai 100–125 mg/dL menandakan prediabetes. Konsultasi dokter.',
    tinggi:         'Nilai ≥126 mg/dL mengindikasikan diabetes. Segera konsultasi.',
    terlalu_tinggi: 'Sangat tinggi, risiko komplikasi serius. Hubungi tenaga medis.',
  },
  siang: {
    terlalu_rendah: 'Hipoglikemia reaktif. Perhatikan jenis dan porsi makanan.',
    rendah:         'Di bawah 70 mg/dL setelah makan tergolong rendah.',
    normal:         'Di bawah 140 mg/dL setelah makan adalah normal.',
    prediabetes:    'Nilai 140–199 mg/dL — toleransi glukosa terganggu.',
    tinggi:         'Nilai ≥200 mg/dL 2 jam setelah makan indikasi diabetes.',
    terlalu_tinggi: 'Sangat tinggi, risiko komplikasi. Hubungi tenaga medis segera.',
  },
  malam: {
    terlalu_rendah: 'Risiko hipoglikemia nokturnal. Konsumsi camilan berkarbohidrat.',
    rendah:         'Di bawah 100 mg/dL sebelum tidur bisa berbahaya.',
    normal:         'Nilai 100–140 mg/dL sebelum tidur adalah ideal.',
    prediabetes:    'Sedikit di atas normal. Batasi camilan manis malam hari.',
    tinggi:         'Terlalu tinggi sebelum tidur. Hindari karbohidrat malam.',
    terlalu_tinggi: 'Sangat tinggi. Bisa menyebabkan hiperglikemia saat tidur.',
  },
}

export function classify(type, val) {
  if (val === null || val === undefined || isNaN(val)) return null
  const c = CFG[type]
  if (val < 40)           return 'terlalu_rendah'
  if (val < c.normal[0])  return 'rendah'
  if (val <= c.normal[1]) return 'normal'
  if (val <= c.predi[1])  return 'prediabetes'
  if (val < c.highWarn)   return 'tinggi'
  return 'terlalu_tinggi'
}

export function statusClass(s) {
  if (!s) return 'empty'
  if (s === 'normal') return 'normal'
  if (s === 'terlalu_rendah' || s === 'rendah') return 'low'
  return 'high'
}

export function isCritical(type, val) {
  if (val === null || val === undefined) return false
  const c = CFG[type]
  return val < c.lowWarn || val >= c.highWarn
}

export function shortLabel(s) {
  return STATUS_LABELS[s] || '—'
}

export function avgValues(vals) {
  const v = vals.filter(x => x !== null && x !== undefined && !isNaN(x))
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null
}
