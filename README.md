# 💉 Gula Darah Tracker

Aplikasi monitoring gula darah harian dengan laporan untuk dokter.

## Fitur
- Input gula darah 3 waktu (bangun tidur, setelah makan, sebelum tidur)
- Klasifikasi otomatis (normal / rendah / tinggi) + warning darurat
- Laporan harian dengan visualisasi bar chart
- Laporan bulanan dengan grafik tren, kalender heatmap, statistik
- **Export PDF profesional** untuk keperluan dokter
- Data tersimpan di browser (localStorage)

---

## 🚀 Deploy ke Vercel (cara termudah)

### Opsi 1 — Vercel via GitHub (Rekomendasi)

1. **Push ke GitHub**
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/USERNAME/gula-darah-tracker.git
   git push -u origin main
   ```

2. **Connect ke Vercel**
   - Buka [vercel.com](https://vercel.com) → Sign in with GitHub
   - Klik **"Add New Project"**
   - Pilih repo `gula-darah-tracker`
   - Vercel otomatis deteksi Next.js → klik **Deploy**
   - Selesai! URL live dalam ~1 menit

### Opsi 2 — Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 💻 Jalankan Lokal

```bash
# Install dependencies
npm install

# Dev server
npm run dev
# → http://localhost:3000

# Build production
npm run build
npm start
```

---

## 📁 Struktur Project

```
gula-darah-tracker/
├── src/
│   ├── app/
│   │   ├── layout.js       # Root layout + fonts
│   │   ├── page.js         # Entry point
│   │   └── globals.css     # Global styles
│   ├── components/
│   │   ├── InputPage.js    # Tab input gula darah
│   │   ├── DailyReport.js  # Laporan harian
│   │   ├── MonthlyReport.js# Laporan bulanan + chart
│   │   └── ExportPDF.js    # Generator PDF untuk dokter
│   └── lib/
│       ├── storage.js      # localStorage helpers
│       └── classify.js     # Logika klasifikasi gula darah
├── public/
├── package.json
├── next.config.js
└── vercel.json
```

---

## ⚕️ Disclaimer

Informasi dalam aplikasi ini bersifat edukatif dan **bukan pengganti diagnosis medis**. Selalu konsultasikan hasil dengan dokter.
