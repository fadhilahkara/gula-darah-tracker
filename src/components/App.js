'use client'
import { useState } from 'react'
import InputPage from './InputPage'
import MealsPage from './MealsPage'
import DailyReport from './DailyReport'
import MonthlyReport from './MonthlyReport'

const TABS = [
  { id: 'input',   label: '✏️ Input' },
  { id: 'meals',   label: '🍽️ Makanan' },
  { id: 'daily',   label: '📅 Harian' },
  { id: 'monthly', label: '📊 Bulanan' },
]

export default function App() {
  const [tab, setTab] = useState('input')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* NAV */}
      <nav style={{
        display: 'flex',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15,
          color: 'var(--blue)', padding: '0 20px',
          display: 'flex', alignItems: 'center', gap: 8,
          borderRight: '1px solid var(--border)', whiteSpace: 'nowrap',
        }}>
          💉 <span>GulaDarah</span>
        </div>
        <div style={{ display: 'flex', overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '14px 20px',
              fontSize: 13, fontWeight: 500, fontFamily: 'Outfit, sans-serif',
              color: tab === t.id ? 'var(--blue)' : 'var(--muted)',
              background: 'none', border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--blue)' : '2px solid transparent',
              cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'color 0.2s',
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* PAGES */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 60px' }}>
        {tab === 'input'   && <InputPage />}
        {tab === 'meals'   && <MealsPage />}
        {tab === 'daily'   && <DailyReport />}
        {tab === 'monthly' && <MonthlyReport />}
      </div>
    </div>
  )
}
