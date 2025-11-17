'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Loading } from '@/components/ui/Loading'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Model } from '@/types'
import { downloadFile, formatDate } from '@/lib/utils'
import { ALGORITHMS } from '@/lib/constants'

type PredictionMode = 'batch' | 'manual'

export default function PredictPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const params = useParams()
  const modelId = params.id as string

  const [model, setModel] = useState<Model | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<PredictionMode>('batch')
  const [predicting, setPredicting] = useState(false)
  const [predictions, setPredictions] = useState<any[] | null>(null)
  const [manualInput, setManualInput] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && modelId) {
      fetchModel()
    }
  }, [user, modelId])

  const fetchModel = async () => {
    try {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('id', modelId)
        .single()

      if (error) throw error

      setModel(data)

      // Initialize manual input with empty values
      const initialInput: Record<string, string> = {}
      data.feature_columns.forEach((col: string) => {
        initialInput[col] = ''
      })
      setManualInput(initialInput)
    } catch (error) {
      console.error('Error fetching model:', error)
      router.push('/models')
    } finally {
      setLoading(false)
    }
  }

  const handleBatchPredict = async (files: File[]) => {
    if (files.length === 0 || !model) return

    const file = files[0]
    setPredicting(true)

    try {
      // Upload file to storage
      const filePath = `${user?.id}/predictions/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('datasets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Call prediction API
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId,
          inputFilePath: filePath,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Prediction failed')
      }

      setPredictions(result.predictions)
    } catch (error) {
      console.error('Prediction error:', error)
      alert(error instanceof Error ? error.message : 'Failed to make predictions')
    } finally {
      setPredicting(false)
    }
  }

  const handleManualPredict = async () => {
    if (!model) return

    // Validate all fields filled
    const missingFields = model.feature_columns.filter(
      (col) => !manualInput[col] || manualInput[col].trim() === ''
    )

    if (missingFields.length > 0) {
      alert(`Please fill in all fields: ${missingFields.join(', ')}`)
      return
    }

    setPredicting(true)

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId,
          manualInput,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Prediction failed')
      }

      setPredictions([result.prediction])
    } catch (error) {
      console.error('Prediction error:', error)
      alert(error instanceof Error ? error.message : 'Failed to make prediction')
    } finally {
      setPredicting(false)
    }
  }

  const handleDownload = () => {
    if (!predictions) return

    // Convert predictions to CSV
    const headers = ['prediction', 'confidence']
    const rows = predictions.map((p) => [p.prediction, p.confidence || 'N/A'])

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    downloadFile(csv, `predictions_${Date.now()}.csv`, 'text/csv')
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleBatchPredict,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    disabled: predicting,
  })

  if (authLoading || loading || !user) {
    return <Loading fullScreen text="Loading..." />
  }

  if (!model) {
    return null
  }

  const algorithm = ALGORITHMS[model.algorithm]

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} onSignOut={signOut} />

      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
              <Link href="/models" className="hover:text-white">
                Models
              </Link>
              <span>/</span>
              <Link href={`/models/${model.id}`} className="hover:text-white">
                {algorithm?.name}
              </Link>
              <span>/</span>
              <span className="text-white">Predict</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Make Predictions
            </h1>
            <p className="text-white/70">
              Use your trained {algorithm?.name} model to make predictions
            </p>
          </div>

          {/* Mode Selector */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('batch')}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                mode === 'batch'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              Batch Prediction
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                mode === 'manual'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              Manual Input
            </button>
          </div>

          {/* Batch Prediction Mode */}
          {mode === 'batch' && (
            <Card>
              <CardHeader>
                <CardTitle>Upload CSV File</CardTitle>
                <p className="text-white/60 text-sm mt-1">
                  Upload a CSV file with the same features as your training data
                </p>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                    transition-all duration-200
                    ${
                      isDragActive
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-white/30 hover:border-white/50'
                    }
                    ${predicting ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <input {...getInputProps()} />

                  {predicting ? (
                    <Loading size="lg" text="Making predictions..." />
                  ) : (
                    <div className="space-y-4">
                      <svg
                        className="w-16 h-16 mx-auto text-white/40"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>

                      <div>
                        <p className="text-white text-lg mb-2">
                          {isDragActive
                            ? 'Drop your file here'
                            : 'Drag & drop your CSV file here'}
                        </p>
                        <p className="text-white/60 text-sm">
                          or click to browse files
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/10">
                        <p className="text-white/60 text-sm mb-2">
                          Required columns:
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {model.feature_columns.slice(0, 5).map((col) => (
                            <span
                              key={col}
                              className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded"
                            >
                              {col}
                            </span>
                          ))}
                          {model.feature_columns.length > 5 && (
                            <span className="px-2 py-1 text-white/60 text-xs">
                              +{model.feature_columns.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {predictions && predictions.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold">
                        Predictions ({predictions.length})
                      </h3>
                      <Button variant="jungle" size="sm" onClick={handleDownload}>
                        Download CSV
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/20">
                            <th className="text-left py-2 px-3 text-white/80 font-medium">
                              Row
                            </th>
                            <th className="text-left py-2 px-3 text-white/80 font-medium">
                              Prediction
                            </th>
                            <th className="text-left py-2 px-3 text-white/80 font-medium">
                              Confidence
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {predictions.slice(0, 100).map((pred, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-white/5 hover:bg-white/5"
                            >
                              <td className="py-2 px-3 text-white/60">{idx + 1}</td>
                              <td className="py-2 px-3 text-white font-medium">
                                {pred.prediction}
                              </td>
                              <td className="py-2 px-3 text-white/70">
                                {pred.confidence
                                  ? `${(pred.confidence * 100).toFixed(1)}%`
                                  : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {predictions.length > 100 && (
                        <p className="text-white/60 text-sm text-center mt-4">
                          Showing first 100 of {predictions.length} predictions.
                          Download CSV for all results.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Manual Prediction Mode */}
          {mode === 'manual' && (
            <Card>
              <CardHeader>
                <CardTitle>Enter Feature Values</CardTitle>
                <p className="text-white/60 text-sm mt-1">
                  Provide values for all features to get a prediction
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  {model.feature_columns.map((col) => (
                    <Input
                      key={col}
                      label={col}
                      value={manualInput[col]}
                      onChange={(e) =>
                        setManualInput({ ...manualInput, [col]: e.target.value })
                      }
                      placeholder={`Enter ${col} value`}
                    />
                  ))}
                </div>

                <Button
                  variant="jungle"
                  onClick={handleManualPredict}
                  isLoading={predicting}
                  className="w-full"
                  size="lg"
                >
                  Get Prediction
                </Button>

                {predictions && predictions.length > 0 && (
                  <div className="mt-6 p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <h3 className="text-white font-semibold mb-2">
                      Prediction Result
                    </h3>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-white/60 text-sm">Predicted Value</p>
                        <p className="text-2xl font-bold text-emerald-500">
                          {predictions[0].prediction}
                        </p>
                      </div>
                      {predictions[0].confidence && (
                        <div>
                          <p className="text-white/60 text-sm">Confidence</p>
                          <p className="text-2xl font-bold text-white">
                            {(predictions[0].confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Back Button */}
          <div className="mt-6">
            <Link href={`/models/${model.id}`}>
              <Button variant="outline">← Back to Model</Button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
