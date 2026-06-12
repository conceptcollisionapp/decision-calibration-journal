import React, { useState, useEffect } from 'react'
import LogDecision from './components/LogDecision'
import PendingReviews from './components/PendingReviews'
import Dashboard from './components/Dashboard'

const SCHEMA_VERSION = 1
const STORAGE_KEY = 'decision-journal-v1'

function loadDecisions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { decisions: [], valid: true }
    const data = JSON.parse(raw)
    if (data.schemaVersion !== SCHEMA_VERSION) {
      return { decisions: data.decisions || [], valid: false }
    }
    return { decisions: data.decisions || [], valid: true }
  } catch {
    return { decisions: [], valid: true }
  }
}

function saveDecisions(decisions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      decisions
    }))
  } catch {}
}

function addInterval(dateStr, interval) {
  const d = new Date(dateStr + 'T00:00:00')
  if (interval === '1w') d.setDate(d.getDate() + 7)
  else if (interval === '1m') {
    const day = d.getDate()
    d.setMonth(d.getMonth() + 1)
    if (d.getDate() < day) d.setDate(0)
  } else if (interval === '3m') {
    const day = d.getDate()
    d.setMonth(d.getMonth() + 3)
    if (d.getDate() < day) d.setDate(0)
  }
  return d.toISOString().split('T')[0]
}

export default function App() {
  const [decisions, setDecisions] = useState([])
  const [tab, setTab] = useState('log')
  const [loaded, setLoaded] = useState(false)
  const [schemaValid, setSchemaValid] = useState(true)

  useEffect(() => {
    const { decisions: loadedDecisions, valid } = loadDecisions()
    setDecisions(loadedDecisions)
    setSchemaValid(valid)
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded && schemaValid) saveDecisions(decisions)
  }, [decisions, loaded, schemaValid])

  const pending = decisions.filter(d => !d.reviewed && new Date(d.reviewDate) <= new Date())

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold">Decision Journal</h1>
          <div className="flex gap-2">
            {['log', 'reviews', 'dashboard'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-gray-800' : 'hover:bg-gray-900'}`}
              >
                {t === 'reviews' && pending.length > 0 && (
                  <span className="mr-1.5 inline-block w-2 h-2 bg-amber-400 rounded-full" />
                )}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {tab === 'log' && <LogDecision decisions={decisions} setDecisions={setDecisions} addInterval={addInterval} />}
        {tab === 'reviews' && <PendingReviews decisions={decisions} setDecisions={setDecisions} />}
        {tab === 'dashboard' && <Dashboard decisions={decisions} />}
      </div>
    </div>
  )
}
