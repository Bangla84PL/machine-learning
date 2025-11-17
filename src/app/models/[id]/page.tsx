'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Loading } from '@/components/ui/Loading'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Model } from '@/types'
import { formatDate, formatPercentage, formatNumber } from '@/lib/utils'
import { ALGORITHMS } from '@/lib/constants'

export default function ModelDetailPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const params = useParams()
  const modelId = params.id as string

  const [model, setModel] = useState<Model | null>(null)
  const [loading, setLoading] = useState(true)

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
    } catch (error) {
      console.error('Error fetching model:', error)
      router.push('/models')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading || !user) {
    return <Loading fullScreen text="Loading model..." />
  }

  if (!model) {
    return null
  }

  const algorithm = ALGORITHMS[model.algorithm]

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} onSignOut={signOut} />

      <div className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
            <Link href="/models" className="hover:text-white">
              Models
            </Link>
            <span>/</span>
            <span className="text-white">{algorithm?.name}</span>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {algorithm?.name || model.algorithm}
              </h1>
              <p className="text-white/70">
                Trained {formatDate(model.trained_at)} • {model.problem_type}
              </p>
            </div>
            <Button variant="jungle" size="lg">
              Make Predictions
            </Button>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {model.problem_type === 'classification' ? (
            <>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-white/60 text-sm mb-1">Accuracy</p>
                  <p className="text-3xl font-bold text-emerald-500">
                    {formatPercentage(model.metrics.accuracy || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-white/60 text-sm mb-1">Precision</p>
                  <p className="text-3xl font-bold text-white">
                    {formatPercentage(model.metrics.precision || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-white/60 text-sm mb-1">Recall</p>
                  <p className="text-3xl font-bold text-white">
                    {formatPercentage(model.metrics.recall || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-white/60 text-sm mb-1">F1 Score</p>
                  <p className="text-3xl font-bold text-white">
                    {formatPercentage(model.metrics.f1_score || 0)}
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-white/60 text-sm mb-1">R² Score</p>
                  <p className="text-3xl font-bold text-emerald-500">
                    {formatNumber(model.metrics.r2 || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-white/60 text-sm mb-1">RMSE</p>
                  <p className="text-3xl font-bold text-white">
                    {formatNumber(model.metrics.rmse || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-white/60 text-sm mb-1">MAE</p>
                  <p className="text-3xl font-bold text-white">
                    {formatNumber(model.metrics.mae || 0)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-white/60 text-sm mb-1">Training Time</p>
                  <p className="text-3xl font-bold text-white">
                    {model.training_duration}s
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Model Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Model Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60">Algorithm:</span>
                  <span className="text-white font-medium">
                    {algorithm?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Problem Type:</span>
                  <span className="text-white font-medium capitalize">
                    {model.problem_type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Target Column:</span>
                  <span className="text-white font-medium">
                    {model.target_column}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Features:</span>
                  <span className="text-white font-medium">
                    {model.feature_columns.length} columns
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Train/Test Split:</span>
                  <span className="text-white font-medium">
                    {(model.train_test_split * 100).toFixed(0)}% /{' '}
                    {((1 - model.train_test_split) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hyperparameters */}
          <Card>
            <CardHeader>
              <CardTitle>Hyperparameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(model.hyperparameters).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-white/60 capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="text-white font-medium font-mono">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Importance */}
        {model.feature_importance && model.feature_importance.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Feature Importance</CardTitle>
              <p className="text-white/60 text-sm mt-1">
                Top features contributing to predictions
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {model.feature_importance.slice(0, 10).map((fi, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-white font-medium">{fi.feature}</span>
                      <span className="text-white/60">
                        {formatNumber(fi.importance)}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all"
                        style={{
                          width: `${
                            (fi.importance /
                              Math.max(
                                ...model.feature_importance.map((f) => f.importance)
                              )) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/models">
            <Button variant="outline">← Back to Models</Button>
          </Link>
          <Button variant="jungle">Make Predictions</Button>
        </div>
      </div>

      <Footer />
    </div>
  )
}
