import React from 'react'

export default function Dashboard({ decisions }) {
  const reviewed = [...decisions.filter(d => d.reviewed)]
    .sort((a, b) => (a.reviewedDate || '').localeCompare(b.reviewedDate || ''))
  const total = reviewed.length

  const buckets = [
    { label: '50-59%', min: 50, max: 59 },
    { label: '60-69%', min: 60, max: 69 },
    { label: '70-79%', min: 70, max: 79 },
    { label: '80-89%', min: 80, max: 89 },
    { label: '90-100%', min: 90, max: 100 }
  ]

  const bucketData = buckets.map(bucket => {
    const inBucket = reviewed.filter(d => d.confidence >= bucket.min && d.confidence <= bucket.max)
    const weighted = inBucket.reduce((sum, d) => {
      if (d.outcome === 'worked') return sum + 1
      if (d.outcome === 'partially') return sum + 0.5
      return sum
    }, 0)
    const accuracy = inBucket.length ? Math.round((weighted / inBucket.length) * 100) : null
    return { ...bucket, count: inBucket.length, accuracy }
  })

  // Current streak: consecutive well-calibrated from most recent
  let streak = 0
  for (let i = reviewed.length - 1; i >= 0; i--) {
    const d = reviewed[i]
    const score = d.outcome === 'worked' ? 1 : d.outcome === 'partially' ? 0.5 : 0
    const wellCalibrated = Math.abs(d.confidence / 100 - score) <= 0.25
    if (wellCalibrated) streak++
    else break
  }

  const biggestMiss = reviewed
    .filter(d => d.outcome !== 'worked' && d.confidence >= 70)
    .reduce((worst, d) => {
      const score = d.outcome === 'partially' ? 0.5 : 0
      const diff = Math.abs(d.confidence / 100 - score)
      return diff > (worst?.diff || 0) ? { ...d, diff } : worst
    }, null)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl mb-4">Calibration</h2>
        <div className="space-y-3">
          {bucketData.map((b, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-20 text-sm">{b.label}</div>
              <div className="flex-1 bg-gray-800 h-6 rounded">
                {b.count > 0 ? (
                  <div className="bg-emerald-500 h-6 rounded" style={{ width: `${b.accuracy}%` }} />
                ) : (
                  <div className="h-6 rounded bg-gray-700" />
                )}
              </div>
              <div className="w-16 text-right text-sm">
                {b.count > 0 ? `${b.accuracy}% (${b.count})` : `— (${b.count})`}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 p-4 rounded-xl">
          <div className="text-2xl">{total}</div>
          <div className="text-sm text-gray-400">Decisions reviewed</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-xl">
          <div className="text-2xl">{streak}</div>
          <div className="text-sm text-gray-400">Current streak</div>
        </div>
        <div className="bg-gray-900 p-4 rounded-xl">
          <div className="text-sm text-gray-400 mb-1">Biggest miss</div>
          <div className="text-sm">{biggestMiss ? biggestMiss.decision : '—'}</div>
        </div>
      </div>
    </div>
  )
}
