import './globals.css'

export const metadata = {
  title: 'Gula Darah Tracker',
  description: 'Monitor gula darah harian dengan laporan untuk dokter',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Outfit:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
