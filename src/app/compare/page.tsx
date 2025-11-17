'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Loading } from '@/components/ui/Loading'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Model } from '@/types'
import { formatPercentage, formatNumber, formatDate } from '@/lib/utils'
import { ALGORITHMS } from '@/lib/constants'

export default function CompareModelsPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const datasetId = searchParams.get('dataset')

  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchModels()
    }
  }, [user, datasetId])

  const fetchModels = async () => {
    try {
      let query = supabase
        .from('models')
        .select('*')
        .eq('user_id', user?.id)
        .order('trained_at', { ascending: false })

      // Filter by dataset if provided
      if (datasetId) {
        query = query.eq('dataset_id', datasetId)
      }

      const { data, error } = await query

      if (error) throw error

      setModels(data || [])
    } catch (error) {
      console.error('Error fetching models:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMetricValue = (model: Model, metric: string) => {
    if (model.problem_type === 'classification') {
      switch (metric) {
        case 'primary':
          return model.metrics.accuracy || 0
        case 'precision':
          return model.metrics.precision || 0
        case 'recall':
          return model.metrics.recall || 0
        case 'f1':
          return model.metrics.f1_score || 0
        default:
          return 0
      }
    } else {
      switch (metric) {
        case 'primary':
          return model.metrics.r2 || 0
        case 'rmse':
          return model.metrics.rmse || 0
        case 'mae':
          return model.metrics.mae || 0
        default:
          return 0
      }
    }
  }

  const getBestModel = (metric: string) => {
    if (models.length === 0) return null

    return models.reduce((best, current) => {
      const bestValue = getMetricValue(best, metric)
      const currentValue = getMetricValue(current, metric)

      // For RMSE and MAE, lower is better
      if (metric === 'rmse' || metric === 'mae') {
        return currentValue < bestValue ? current : best
      }

      // For others, higher is better
      return currentValue > bestValue ? current : best
    })
  }

  if (authLoading || !user) {
    return <Loading fullScreen text="Loading..." />
  }

  if (loading) {
    return <Loading fullScreen text="Loading models..." />
  }

  if (models.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header user={user} onSignOut={signOut} />
        <div className="flex-1 container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-white/60 mb-6">
                No models found{datasetId ? ' for this dataset' : ''}.
              </p>
              <Link href="/datasets">
                <Button variant="jungle">Upload Dataset & Train Model</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  const problemType = models[0].problem_type
  const bestPrimary = getBestModel('primary')

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} onSignOut={signOut} />

      <div className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Compare Models</h1>
          <p className="text-white/70 text-lg">
            Compare performance across {models.length} trained models
          </p>
        </div>

        {/* Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Model Comparison</CardTitle>
            <p className="text-white/60 text-sm mt-1 capitalize">
              {problemType} models • Sorted by training date
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4 text-white/80 font-medium">
                      Algorithm
                    </th>
                    {problemType === 'classification' ? (
                      <>
                        <th className="text-left py-3 px-4 text-white/80 font-medium">
                          Accuracy
                        </th>
                        <th className="text-left py-3 px-4 text-white/80 font-medium">
                          Precision
                        </th>
                        <th className="text-left py-3 px-4 text-white/80 font-medium">
                          Recall
                        </th>
                        <th className="text-left py-3 px-4 text-white/80 font-medium">
                          F1 Score
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="text-left py-3 px-4 text-white/80 font-medium">
                          R² Score
                        </th>
                        <th className="text-left py-3 px-4 text-white/80 font-medium">
                          RMSE
                        </th>
                        <th className="text-left py-3 px-4 text-white/80 font-medium">
                          MAE
                        </th>
                      </>
                    )}
                    <th className="text-left py-3 px-4 text-white/80 font-medium">
                      Training Time
                    </th>
                    <th className="text-left py-3 px-4 text-white/80 font-medium">
                      Trained
                    </th>
                    <th className="text-right py-3 px-4 text-white/80 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((model) => {
                    const isBest = bestPrimary?.id === model.id

                    return (
                      <tr
                        key={model.id}
                        className={`border-b border-white/5 hover:bg-white/5 ${
                          isBest ? 'bg-emerald-500/10' : ''
                        }`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/models/${model.id}`}
                              className="text-white hover:text-emerald-500 font-medium"
                            >
                              {ALGORITHMS[model.algorithm]?.name || model.algorithm}
                            </Link>
                            {isBest && (
                              <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded">
                                Best
                              </span>
                            )}
                          </div>
                        </td>

                        {problemType === 'classification' ? (
                          <>
                            <td className="py-4 px-4 text-white/80 font-mono">
                              {formatPercentage(model.metrics.accuracy || 0)}
                            </td>
                            <td className="py-4 px-4 text-white/80 font-mono">
                              {formatPercentage(model.metrics.precision || 0)}
                            </td>
                            <td className="py-4 px-4 text-white/80 font-mono">
                              {formatPercentage(model.metrics.recall || 0)}
                            </td>
                            <td className="py-4 px-4 text-white/80 font-mono">
                              {formatPercentage(model.metrics.f1_score || 0)}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-4 px-4 text-white/80 font-mono">
                              {formatNumber(model.metrics.r2 || 0)}
                            </td>
                            <td className="py-4 px-4 text-white/80 font-mono">
                              {formatNumber(model.metrics.rmse || 0)}
                            </td>
                            <td className="py-4 px-4 text-white/80 font-mono">
                              {formatNumber(model.metrics.mae || 0)}
                            </td>
                          </>
                        )}

                        <td className="py-4 px-4 text-white/70">
                          {model.training_duration}s
                        </td>
                        <td className="py-4 px-4 text-white/70">
                          {formatDate(model.trained_at)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/models/${model.id}`}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                            <Link href={`/models/${model.id}/predict`}>
                              <Button variant="jungle" size="sm">
                                Predict
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-6">
          <Link href="/models">
            <Button variant="outline">← Back to Models</Button>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}
