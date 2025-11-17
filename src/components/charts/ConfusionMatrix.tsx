'use client'

import { formatPercentage } from '@/lib/utils'

interface ConfusionMatrixProps {
  matrix: number[][]
  labels?: string[]
}

export function ConfusionMatrix({ matrix, labels }: ConfusionMatrixProps) {
  if (!matrix || matrix.length === 0) {
    return (
      <div className="text-center py-8 text-white/60">
        No confusion matrix data available
      </div>
    )
  }

  const size = matrix.length
  const defaultLabels = labels || Array.from({ length: size }, (_, i) => `Class ${i}`)

  // Calculate totals for percentages
  const totals = matrix.map((row) => row.reduce((sum, val) => sum + val, 0))
  const maxValue = Math.max(...matrix.flat())

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="text-center mb-4">
          <p className="text-white/60 text-sm mb-1">Predicted →</p>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2"></th>
              {defaultLabels.map((label, i) => (
                <th
                  key={i}
                  className="p-2 text-white font-medium text-sm whitespace-nowrap"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                {i === 0 && (
                  <td
                    rowSpan={size}
                    className="p-2 text-white/60 text-sm whitespace-nowrap align-middle"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  >
                    ← Actual
                  </td>
                )}
                <td className="p-2 text-white font-medium text-sm whitespace-nowrap">
                  {defaultLabels[i]}
                </td>
                {row.map((value, j) => {
                  const isCorrect = i === j
                  const percentage = totals[i] > 0 ? value / totals[i] : 0
                  const intensity = maxValue > 0 ? value / maxValue : 0

                  return (
                    <td key={j} className="p-1">
                      <div
                        className={`
                          relative p-4 rounded transition-all
                          ${
                            isCorrect
                              ? 'bg-emerald-500'
                              : 'bg-red-500'
                          }
                        `}
                        style={{
                          opacity: 0.3 + intensity * 0.7,
                        }}
                      >
                        <div className="text-white font-bold text-lg">
                          {value}
                        </div>
                        <div className="text-white/80 text-xs">
                          {formatPercentage(percentage, 0)}
                        </div>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-500 rounded"></div>
            <span className="text-white/70">Correct Predictions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-white/70">Incorrect Predictions</span>
          </div>
        </div>
      </div>
    </div>
  )
}
