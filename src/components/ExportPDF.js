'use client'
import { loadAll, formatDateID, monthName } from '@/lib/storage'
import { classify, statusClass, shortLabel, avgValues, CFG } from '@/lib/classify'

// ─────────────────────────────────────────
//  PDF Export — Professional Medical Report
//  Uses jsPDF + jspdf-autotable (CDN-free,
//  imported dynamically to avoid SSR issues)
// ─────────────────────────────────────────

export async function exportMonthlyPDF({ year, month, patientName, patientDOB, patientNote }) {
  const { default: jsPDF } = await import('jspdf')
  await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, ML = 14, MR = 196
  let y = 0

  const all = loadAll()
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const days = Object.keys(all).filter(k => k.startsWith(prefix)).sort()

  // ── Colors ──
  const C = {
    primary:  [15, 23, 42],
    accent:   [37, 99, 235],
    green:    [22, 163, 74],
    yellow:   [202, 138, 4],
    red:      [220, 38, 38],
    lightGray:[248, 250, 252],
    border:   [226, 232, 240],
    muted:    [100, 116, 139],
  }

  function setColor(arr, type = 'fill') {
    if (type === 'fill') doc.setFillColor(...arr)
    else doc.setTextColor(...arr)
  }

  // ── HEADER BANNER ──
  setColor(C.primary, 'fill')
  doc.rect(0, 0, W, 38, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  setColor([255,255,255], 'text')
  doc.text('LAPORAN MONITORING GULA DARAH', ML, 16)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  setColor([148,163,184], 'text')
  doc.text(`${monthName(month)} ${year}  ·  Dicetak: ${formatDateID(new Date().toISOString().split('T')[0])}`, ML, 24)
  doc.text('Dokumen ini dihasilkan secara otomatis oleh Gula Darah Tracker', ML, 31)

  // Accent strip
  setColor(C.accent, 'fill')
  doc.rect(0, 38, W, 2, 'F')
  y = 50

  // ── PATIENT INFO ──
  if (patientName || patientDOB || patientNote) {
    setColor(C.lightGray, 'fill')
    doc.roundedRect(ML, y, MR - ML, patientNote ? 28 : 22, 3, 3, 'F')
    doc.setDrawColor(...C.border)
    doc.roundedRect(ML, y, MR - ML, patientNote ? 28 : 22, 3, 3, 'S')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    setColor(C.muted, 'text')
    doc.text('DATA PASIEN', ML + 6, y + 8)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    setColor(C.primary, 'text')
    const nameText = patientName ? `Nama: ${patientName}` : 'Nama: —'
    const dobText  = patientDOB  ? `Tgl Lahir: ${formatDateID(patientDOB)}` : ''
    doc.text(nameText, ML + 6, y + 15)
    if (dobText) doc.text(dobText, 110, y + 15)
    if (patientNote) {
      doc.setFontSize(9)
      setColor(C.muted, 'text')
      doc.text(`Catatan: ${patientNote}`, ML + 6, y + 22)
    }
    y += (patientNote ? 28 : 22) + 10
  }

  // ── STATISTICS SUMMARY ──
  const allVals = [], pagiArr = [], siangArr = [], malamArr = []
  let cNormal = 0, cHigh = 0, cLow = 0, total = 0

  days.forEach(d => {
    const e = all[d]
    ;['pagi','siang','malam'].forEach(t => {
      const v = e[t]
      if (v !== null && v !== undefined) {
        allVals.push(v); total++
        const s = classify(t, v)
        const cls = statusClass(s)
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
  const pctNormal = total ? Math.round((cNormal / total) * 100) : 0

  // Section title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  setColor(C.primary, 'text')
  doc.text('RINGKASAN STATISTIK BULAN INI', ML, y)
  setColor(C.accent, 'fill')
  doc.rect(ML, y + 1.5, 55, 0.5, 'F')
  y += 8

  // 4 stat boxes
  const boxes = [
    { label: 'HARI TERCATAT',   val: days.length.toString(),     sub: `dari ${new Date(year, month+1, 0).getDate()} hari`,      color: C.accent },
    { label: 'RATA-RATA (mg/dL)',val: globalAvg?.toString() ?? '—', sub: 'semua pengukuran',   color: globalAvg && globalAvg > 140 ? C.red : C.green },
    { label: '% NORMAL',         val: total ? pctNormal + '%' : '—', sub: `${cNormal} dari ${total} ukur`, color: C.green },
    { label: 'TINGGI / RENDAH',  val: `${cHigh} / ${cLow}`,       sub: 'kali melebihi batas', color: cHigh > 0 ? C.red : C.green },
  ]
  const bW = (MR - ML - 9) / 4
  boxes.forEach((b, i) => {
    const bx = ML + i * (bW + 3)
    setColor(C.lightGray, 'fill')
    doc.roundedRect(bx, y, bW, 22, 2, 2, 'F')
    doc.setDrawColor(...C.border)
    doc.roundedRect(bx, y, bW, 22, 2, 2, 'S')

    setColor(b.color, 'fill')
    doc.rect(bx, y, bW, 3, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    setColor(C.muted, 'text')
    doc.text(b.label, bx + 3, y + 9)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    setColor(b.color, 'text')
    doc.text(b.val, bx + 3, y + 17)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    setColor(C.muted, 'text')
    doc.text(b.sub, bx + 3, y + 21)
  })
  y += 28

  // Average per session
  const sessions = [
    { label: '🌅 Bangun Tidur (Puasa)',   avg: avgValues(pagiArr),  normal: '70–99 mg/dL',  arr: pagiArr },
    { label: '☀️ 2 Jam Setelah Makan',    avg: avgValues(siangArr), normal: '<140 mg/dL',   arr: siangArr },
    { label: '🌙 Sebelum Tidur',          avg: avgValues(malamArr), normal: '100–140 mg/dL',arr: malamArr },
  ]

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setColor(C.primary, 'text')

  sessions.forEach((s, i) => {
    const sx = ML + i * ((MR - ML - 6) / 3 + 3)
    const sw = (MR - ML - 6) / 3
    setColor(C.lightGray, 'fill')
    doc.roundedRect(sx, y, sw, 18, 2, 2, 'F')
    doc.setDrawColor(...C.border)
    doc.roundedRect(sx, y, sw, 18, 2, 2, 'S')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setColor(C.muted, 'text')
    // strip emoji for PDF
    doc.text(s.label.replace(/[^\x00-\x7F]/g, '').trim(), sx + 3, y + 7)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    setColor(C.primary, 'text')
    doc.text(s.avg !== null ? `${s.avg} mg/dL` : '— ', sx + 3, y + 14)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    setColor(C.muted, 'text')
    doc.text(`Normal: ${s.normal}`, sx + 3, y + 17.5)
  })
  y += 24

  // ── REFERENCE TABLE ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  setColor(C.primary, 'text')
  doc.text('TABEL REFERENSI NILAI NORMAL', ML, y)
  setColor(C.accent, 'fill')
  doc.rect(ML, y + 1.5, 55, 0.5, 'F')
  y += 6

  doc.autoTable({
    startY: y,
    margin: { left: ML, right: 14 },
    head: [['Waktu Pengukuran', 'Normal', 'Prediabetes / Waspada', 'Tinggi (Diabetes)']],
    body: [
      ['Bangun Tidur (Puasa)',   '70–99 mg/dL',   '100–125 mg/dL', '≥126 mg/dL'],
      ['2 Jam Setelah Makan',   '<140 mg/dL',    '140–199 mg/dL', '≥200 mg/dL'],
      ['Sebelum Tidur',         '100–140 mg/dL', '141–160 mg/dL', '>160 mg/dL'],
    ],
    styles: { fontSize: 9, cellPadding: 4, font: 'helvetica' },
    headStyles: { fillColor: C.primary, textColor: [255,255,255], fontStyle: 'bold' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55 },
      1: { textColor: C.green },
      2: { textColor: C.yellow },
      3: { textColor: C.red },
    },
    alternateRowStyles: { fillColor: C.lightGray },
  })
  y = doc.lastAutoTable.finalY + 10

  // ── DAILY DATA TABLE ──
  if (days.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    setColor(C.primary, 'text')
    doc.text('DATA HARIAN', ML, y)
    setColor(C.accent, 'fill')
    doc.rect(ML, y + 1.5, 30, 0.5, 'F')
    y += 6

    const tableRows = days.map(d => {
      const e = all[d]
      function cell(type) {
        const v = e[type]
        if (v === null || v === undefined) return '—'
        const s = classify(type, v)
        return `${v} (${shortLabel(s)})`
      }
      return [formatDateID(d), cell('pagi'), cell('siang'), cell('malam')]
    })

    doc.autoTable({
      startY: y,
      margin: { left: ML, right: 14 },
      head: [['Tanggal', 'Bangun Tidur', '2 Jam Setelah Makan', 'Sebelum Tidur']],
      body: tableRows,
      styles: { fontSize: 8.5, cellPadding: 3.5 },
      headStyles: { fillColor: C.primary, textColor: [255,255,255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: C.lightGray },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index > 0) {
          const txt = data.cell.raw || ''
          if (txt.includes('Tinggi') || txt.includes('Sangat')) {
            data.cell.styles.textColor = C.red
          } else if (txt.includes('Rendah') || txt.includes('Prediabetes')) {
            data.cell.styles.textColor = C.yellow
          } else if (txt.includes('Normal')) {
            data.cell.styles.textColor = C.green
          }
        }
      },
    })
  }

  // ── FOOTER ──
  const pages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    setColor(C.primary, 'fill')
    doc.rect(0, 287, W, 10, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    setColor([148,163,184], 'text')
    doc.text('Gula Darah Tracker  ·  Dokumen ini bersifat informatif, bukan pengganti diagnosis medis', ML, 293)
    doc.text(`Halaman ${p} / ${pages}`, MR, 293, { align: 'right' })
  }

  const filename = `Laporan_GulaDarah_${monthName(month)}_${year}${patientName ? '_' + patientName.replace(/\s+/g,'_') : ''}.pdf`
  doc.save(filename)
}
