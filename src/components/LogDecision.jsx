import React, { useState } from 'react'

export default function LogDecision({ decisions, setDecisions, addInterval }) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    decision: '', rejected: '', prediction: '', confidence: 70, reviewType: '1w', customDate: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.decision) return

    let reviewDate
    if (form.reviewType === 'custom' && form.customDate) {
      reviewDate = form.customDate
    } else {
      reviewDate = addInterval(today, form.reviewType)
    }

    const newDecision = {
      id: crypto.randomUUID(),
      ...form,
      reviewDate,
      reviewed: false,
      outcome: null,
      created: today
    }

    setDecisions([...decisions, newDecision])
    setForm({ decision: '', rejected: '', prediction: '', confidence: 70, reviewType: '1w', customDate: '' })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900 p-6 rounded-xl">
      <input type="text" placeholder="What decision are you making?" value={form.decision}
        onChange={e => setForm({...form, decision: e.target.value})} className="w-full bg-gray-800 p-3 rounded" required />
      <input type="text" placeholder="Options you rejected" value={form.rejected}
        onChange={e => setForm({...form, rejected: e.target.value})} className="w-full bg-gray-800 p-3 rounded" />
      <input type="text" placeholder="Predicted outcome" value={form.prediction}
        onChange={e => setForm({...form, prediction: e.target.value})} className="w-full bg-gray-800 p-3 rounded" />
      
      <div>
        <label className="block mb-1">Confidence: {form.confidence}%</label>
        <input type="range" min="50" max="100" value={form.confidence}
          onChange={e => setForm({...form, confidence: parseInt(e.target.value, 10)})} className="w-full" />
      </div>

      <div className="flex gap-4">
        <select value={form.reviewType} onChange={e => setForm({...form, reviewType: e.target.value})} className="bg-gray-800 p-3 rounded">
          <option value="1w">Review in 1 week</option>
          <option value="1m">Review in 1 month</option>
          <option value="3m">Review in 3 months</option>
          <option value="custom">Custom date</option>
        </select>
        {form.reviewType === 'custom' && (
          <input type="date" min={today} value={form.customDate} onChange={e => setForm({...form, customDate: e.target.value})} className="bg-gray-800 p-3 rounded" required />
        )}
      </div>

      <button type="submit" className="bg-emerald-600 px-6 py-2 rounded-lg">Log Decision</button>
    </form>
  )
}
