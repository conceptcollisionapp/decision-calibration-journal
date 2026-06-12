import React from 'react'

export default function PendingReviews({ decisions, setDecisions }) {
  const pending = decisions.filter(d => !d.reviewed && new Date(d.reviewDate) <= new Date())

  const markReviewed = (id, outcome) => {
    const reviewedDate = new Date().toISOString().split('T')[0]
    setDecisions(decisions.map(d => d.id === id ? { ...d, reviewed: true, outcome, reviewedDate } : d))
  }

  if (pending.length === 0) return <div className="text-gray-400">No pending reviews.</div>

  return (
    <div className="space-y-4">
      {pending.map(dec => (
        <div key={dec.id} className="bg-gray-900 p-6 rounded-xl">
          <div className="font-medium mb-1">{dec.decision}</div>
          <div className="text-sm text-gray-400 mb-4">You were {dec.confidence}% confident. How did it go?</div>
          <div className="flex gap-3">
            {['worked', 'partially', 'failed'].map(o => (
              <button key={o} onClick={() => markReviewed(dec.id, o)} className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700">
                {o}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
