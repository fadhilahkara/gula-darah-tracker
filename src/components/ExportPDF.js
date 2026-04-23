'use client'
import { loadAll, formatDateID, monthName } from '@/lib/storage'
import { classify, statusClass, shortLabel, avgValues } from '@/lib/classify'

export async function exportMonthlyPDF({ year, month, patientName, patientDOB, patientNote }) {
  const { default: jsPDF } = await import('jspdf')
  await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, ML = 14, MR = 196
  let y = 0

  const all = loadAll()
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const days = Object.keys(all).filter(k => k.startsWith(prefix)).sort()

  const C = {
    primary:   [15, 23, 42],
    accent:    [37, 99, 235],
    green:     [22, 163, 74],
    yellow:    [202, 138, 4],
    red:       [220, 38, 38],
    lightGray: [248, 250, 252],
    border:    [226, 232, 240],
    muted:     [100, 116, 139],
    teal:      [13, 148, 136],
  }

  const setFill = arr => doc.setFillColor(...arr)
  const setText = arr => doc.setTextColor(...arr)
  const setDraw = arr => doc.setDrawColor(...arr)

  // PAGE 1 — SUMMARY
  setFill(C.primary); doc.rect(0, 0, W, 38, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); setText([255,255,255])
  doc.text('LAPORAN MONITORING GULA DARAH', ML, 15)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); setText([148,163,184])
  doc.text(`${monthName(month)} ${year}  ·  Dicetak: ${formatDateID(new Date().toISOString().split('T')[0])}`, ML, 23)
  doc.text('Dokumen informatif — bukan pengganti diagnosis medis', ML, 30)
  setFill(C.accent); doc.rect(0, 38, W, 2, 'F')
  y = 50

  if (patientName || patientDOB || patientNote) {
    setFill(C.lightGray); doc.roundedRect(ML, y, MR-ML, 24, 3, 3, 'F')
    setDraw(C.border);    doc.roundedRect(ML, y, MR-ML, 24, 3, 3, 'S')
    doc.setFont('helvetica','bold'); doc.setFontSize(8); setText(C.muted)
    doc.text('DATA PASIEN', ML+5, y+7)
    doc.setFont('helvetica','normal'); doc.setFontSize(10); setText(C.primary)
    doc.text(patientName ? `Nama: ${patientName}` : 'Nama: —', ML+5, y+14)
    if (patientDOB) doc.text(`Tgl Lahir: ${formatDateID(patientDOB)}`, 115, y+14)
    if (patientNote) { doc.setFontSize(9); setText(C.muted); doc.text(`Catatan: ${patientNote}`, ML+5, y+21) }
    y += 30
  }

  const allVals=[], pagiArr=[], siangArr=[], malamArr=[]
  let cNormal=0, cHigh=0, cLow=0, total=0, totalMeals=0
  days.forEach(d => {
    const e = all[d]
    ;['pagi','siang','malam'].forEach(t => {
      const v = e[t]
      if (v !== null && v !== undefined) {
        allVals.push(v); total++
        const cls = statusClass(classify(t, v))
        if (cls==='normal') cNormal++
        else if (cls==='high') cHigh++
        else cLow++
      }
    })
    if (e.pagi  != null) pagiArr.push(e.pagi)
    if (e.siang != null) siangArr.push(e.siang)
    if (e.malam != null) malamArr.push(e.malam)
    if (e.meals) totalMeals += e.meals.length
  })

  const globalAvg = avgValues(allVals)
  const pctNormal = total ? Math.round((cNormal/total)*100) : 0

  doc.setFont('helvetica','bold'); doc.setFontSize(11); setText(C.primary)
  doc.text('RINGKASAN STATISTIK', ML, y)
  setFill(C.accent); doc.rect(ML, y+1.5, 40, 0.5, 'F')
  y += 8

  const boxes = [
    { label:'HARI TERCATAT',   val:String(days.length),               sub:`dari ${new Date(year,month+1,0).getDate()} hari`, color:C.accent },
    { label:'RATA-RATA',       val:globalAvg?`${globalAvg}mg/dL`:'—', sub:'semua ukur', color:globalAvg&&globalAvg>140?C.red:C.green },
    { label:'% NORMAL',        val:total?`${pctNormal}%`:'—',         sub:`${cNormal}/${total} ukur`, color:C.green },
    { label:'TINGGI / RENDAH', val:`${cHigh} / ${cLow}`,              sub:'kali lewat batas', color:cHigh>0?C.red:C.green },
    { label:'TOTAL MAKANAN',   val:String(totalMeals),                 sub:'entri tercatat', color:C.teal },
  ]
  const bW = (MR-ML-16)/5
  boxes.forEach((b,i) => {
    const bx = ML + i*(bW+4)
    setFill(C.lightGray); doc.roundedRect(bx, y, bW, 22, 2, 2, 'F')
    setDraw(C.border);    doc.roundedRect(bx, y, bW, 22, 2, 2, 'S')
    setFill(b.color);     doc.rect(bx, y, bW, 2.5, 'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(6.5); setText(C.muted)
    doc.text(b.label, bx+2, y+8)
    doc.setFont('helvetica','bold'); doc.setFontSize(11); setText(b.color)
    doc.text(b.val, bx+2, y+16)
    doc.setFont('helvetica','normal'); doc.setFontSize(6); setText(C.muted)
    doc.text(b.sub, bx+2, y+20.5)
  })
  y += 28

  const sessions = [
    { label:'Bangun Tidur (Puasa)', avg:avgValues(pagiArr),  normal:'70-99' },
    { label:'2 Jam Setelah Makan',  avg:avgValues(siangArr), normal:'<140' },
    { label:'Sebelum Tidur',        avg:avgValues(malamArr), normal:'100-140' },
  ]
  const sw = (MR-ML-8)/3
  sessions.forEach((s,i) => {
    const sx = ML + i*(sw+4)
    setFill(C.lightGray); doc.roundedRect(sx, y, sw, 18, 2, 2, 'F')
    setDraw(C.border);    doc.roundedRect(sx, y, sw, 18, 2, 2, 'S')
    doc.setFont('helvetica','normal'); doc.setFontSize(8); setText(C.muted)
    doc.text(s.label, sx+3, y+7)
    doc.setFont('helvetica','bold'); doc.setFontSize(12)
    setText(s.avg?(s.avg>140?C.red:C.green):C.muted)
    doc.text(s.avg?`${s.avg} mg/dL`:'—', sx+3, y+14)
    doc.setFont('helvetica','normal'); doc.setFontSize(7); setText(C.muted)
    doc.text(`Normal: ${s.normal} mg/dL`, sx+3, y+17.5)
  })
  y += 24

  doc.setFont('helvetica','bold'); doc.setFontSize(11); setText(C.primary)
  doc.text('TABEL REFERENSI NILAI NORMAL', ML, y)
  setFill(C.accent); doc.rect(ML, y+1.5, 55, 0.5, 'F')
  y += 6

  doc.autoTable({
    startY: y, margin:{left:ML,right:14},
    head: [['Waktu Pengukuran','Normal','Prediabetes','Tinggi (Diabetes)']],
    body: [
      ['Bangun Tidur (Puasa)','70-99 mg/dL','100-125 mg/dL','>=126 mg/dL'],
      ['2 Jam Setelah Makan','<140 mg/dL','140-199 mg/dL','>=200 mg/dL'],
      ['Sebelum Tidur','100-140 mg/dL','141-160 mg/dL','>160 mg/dL'],
    ],
    styles:{fontSize:9,cellPadding:4},
    headStyles:{fillColor:C.primary,textColor:[255,255,255],fontStyle:'bold'},
    columnStyles:{0:{fontStyle:'bold',cellWidth:55},1:{textColor:C.green},2:{textColor:C.yellow},3:{textColor:C.red}},
    alternateRowStyles:{fillColor:C.lightGray},
  })

  // PAGE 2 — DAILY GLUCOSE TABLE
  if (days.length > 0) {
    doc.addPage()
    setFill(C.primary); doc.rect(0, 0, W, 14, 'F')
    doc.setFont('helvetica','bold'); doc.setFontSize(11); setText([255,255,255])
    doc.text(`DATA HARIAN — ${monthName(month).toUpperCase()} ${year}`, ML, 9)
    if (patientName) { doc.setFontSize(9); setText([148,163,184]); doc.text(patientName, MR, 9, {align:'right'}) }
    y = 22

    doc.setFont('helvetica','bold'); doc.setFontSize(11); setText(C.primary)
    doc.text('Rekap Gula Darah Harian', ML, y)
    setFill(C.accent); doc.rect(ML, y+1.5, 45, 0.5, 'F')
    y += 7

    const glucoseRows = days.map(d => {
      const e = all[d]
      const cell = t => {
        const v = e[t]
        return v == null ? '—' : `${v} (${shortLabel(classify(t, v))})`
      }
      return [formatDateID(d), cell('pagi'), cell('siang'), cell('malam')]
    })

    doc.autoTable({
      startY: y, margin:{left:ML,right:14},
      head: [['Tanggal','Bangun Tidur','2 Jam Stlh Makan','Sebelum Tidur']],
      body: glucoseRows,
      styles:{fontSize:8.5,cellPadding:3.5},
      headStyles:{fillColor:C.primary,textColor:[255,255,255],fontStyle:'bold'},
      columnStyles:{0:{fontStyle:'bold',cellWidth:42}},
      alternateRowStyles:{fillColor:C.lightGray},
      didParseCell(d) {
        if (d.section==='body' && d.column.index>0) {
          const t = d.cell.raw||''
          if (t.includes('Tinggi')||t.includes('Sangat')) d.cell.styles.textColor = C.red
          else if (t.includes('Rendah')||t.includes('Prediabetes')) d.cell.styles.textColor = C.yellow
          else if (t.includes('Normal')) d.cell.styles.textColor = C.green
        }
      },
    })

    // PAGE 3 — MEALS TABLE
    const daysWithMeals = days.filter(d => all[d].meals && all[d].meals.length > 0)
    if (daysWithMeals.length > 0) {
      doc.addPage()
      setFill(C.teal); doc.rect(0, 0, W, 14, 'F')
      doc.setFont('helvetica','bold'); doc.setFontSize(11); setText([255,255,255])
      doc.text(`CATATAN MAKANAN — ${monthName(month).toUpperCase()} ${year}`, ML, 9)
      if (patientName) { doc.setFontSize(9); setText([200,240,235]); doc.text(patientName, MR, 9, {align:'right'}) }
      y = 22

      doc.setFont('helvetica','bold'); doc.setFontSize(11); setText(C.primary)
      doc.text('Riwayat Asupan Makanan & Korelasi Gula Darah', ML, y)
      setFill(C.teal); doc.rect(ML, y+1.5, 70, 0.5, 'F')
      y += 7

      const mealRows = []
      daysWithMeals.forEach(d => {
        const e = all[d]
        const meals = (e.meals||[]).sort((a,b)=>a.time.localeCompare(b.time))
        meals.forEach((meal, idx) => {
          const mealHour = parseInt((meal.time||'12').split(':')[0])
          // GDP pagi = puasa, tidak terkait makanan apapun
          // Makan pagi (<11) = tidak ada GD yang mengukur langsung
          // Makan siang (11-17) = GD 2 jam setelah makan
          // Makan malam (>17) = GD sebelum tidur
          let gdText = '—'
          if (mealHour < 11) {
            gdText = 'Tidak berkorelasi (GDP = puasa)'
          } else {
            const gType = mealHour < 17 ? 'siang' : 'malam'
            const gVal = e[gType]
            gdText = gVal != null ? `${gVal} (${shortLabel(classify(gType, gVal))})` : 'Belum diisi'
          }
          const carbMap = {rendah:'Rendah <15g',sedang:'Sedang 15-45g',tinggi:'Tinggi >45g'}
          mealRows.push([
            idx===0 ? formatDateID(d) : '',
            meal.time||'—',
            meal.name,
            carbMap[meal.carbs]||meal.carbs,
            meal.notes||'—',
            gdText,
          ])
        })
      })

      doc.autoTable({
        startY: y, margin:{left:ML,right:14},
        head: [['Tanggal','Waktu','Makanan/Minuman','Karbo','Catatan','GD Terkait']],
        body: mealRows,
        styles:{fontSize:8,cellPadding:3},
        headStyles:{fillColor:C.teal,textColor:[255,255,255],fontStyle:'bold'},
        columnStyles:{
          0:{fontStyle:'bold',cellWidth:30},
          1:{cellWidth:16},
          2:{cellWidth:38},
          3:{cellWidth:28},
          4:{cellWidth:30},
          5:{cellWidth:40},
        },
        alternateRowStyles:{fillColor:C.lightGray},
        didParseCell(d) {
          if (d.section==='body') {
            if (d.column.index===3) {
              const t=d.cell.raw||''
              if (t.includes('Tinggi')) d.cell.styles.textColor=C.red
              else if (t.includes('Rendah')) d.cell.styles.textColor=C.green
              else d.cell.styles.textColor=C.yellow
            }
            if (d.column.index===5) {
              const t=d.cell.raw||''
              if (t.includes('Tinggi')||t.includes('Sangat')) d.cell.styles.textColor=C.red
              else if (t.includes('Rendah')||t.includes('Prediabetes')) d.cell.styles.textColor=C.yellow
              else if (t.includes('Normal')) d.cell.styles.textColor=C.green
            }
          }
        },
      })

      // Auto insight
      const finalY = doc.lastAutoTable.finalY + 10
      if (finalY < 260) {
        doc.setFillColor(232, 250, 248)
        doc.roundedRect(ML, finalY, MR-ML, 22, 3, 3, 'F')
        setDraw(C.teal); doc.roundedRect(ML, finalY, MR-ML, 22, 3, 3, 'S')
        doc.setFont('helvetica','bold'); doc.setFontSize(9); setText(C.teal)
        doc.text('Analisis Otomatis:', ML+5, finalY+7)
        doc.setFont('helvetica','normal'); doc.setFontSize(8.5); setText(C.primary)
        const highCarbCount = daysWithMeals.flatMap(d=>(all[d].meals||[]).filter(m=>m.carbs==='tinggi')).length
        const insight = highCarbCount > 0
          ? `Terdapat ${highCarbCount} catatan makanan berkarbohidrat tinggi bulan ini. Perhatikan pola makan pada hari-hari dengan gula darah di atas normal. Pertimbangkan untuk mengganti dengan sumber karbohidrat kompleks dan mengurangi porsi.`
          : totalMeals > 0
          ? `Dari ${totalMeals} catatan makanan bulan ini, asupan karbohidrat terkontrol dengan baik. Pertahankan pola makan saat ini.`
          : 'Belum cukup data makanan untuk analisis.'
        const lines = doc.splitTextToSize(insight, MR-ML-10)
        doc.text(lines, ML+5, finalY+14)
      }
    }
  }

  // Footer all pages
  const pages = doc.internal.getNumberOfPages()
  for (let p=1; p<=pages; p++) {
    doc.setPage(p)
    setFill(C.primary); doc.rect(0, 287, W, 10, 'F')
    doc.setFont('helvetica','normal'); doc.setFontSize(7); setText([148,163,184])
    doc.text('Gula Darah Tracker  ·  Bukan pengganti diagnosis medis  ·  Konsultasikan dengan dokter', ML, 293)
    doc.text(`Hal ${p} / ${pages}`, MR, 293, {align:'right'})
  }

  const fname = `Laporan_GulaDarah_${monthName(month)}_${year}${patientName?'_'+patientName.replace(/\s+/g,'_'):''}.pdf`
  doc.save(fname)
}
