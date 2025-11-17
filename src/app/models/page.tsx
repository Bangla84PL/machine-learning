'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Loading, Skeleton } from '@/components/ui/Loading'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Model } from '@/types'
import { formatDate, formatPercentage, formatNumber } from '@/lib/utils'
import { ALGORITHMS } from '@/lib/constants'

export default function ModelsPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
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
  }, [user])

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('user_id', user?.id)
        .order('trained_at', { ascending: false })

      if (error) throw error

      setModels(data || [])
    } catch (error) {
      console.error('Error fetching models:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAccuracy = (model: Model) => {
    if (model.problem_type === 'classification') {
      return model.metrics.accuracy || 0
    } else {
      return model.metrics.r2 || 0
    }
  }

  if (authLoading || !user) {
    return <Loading fullScreen text="Loading..." />
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} onSignOut={signOut} />

      <div className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My Models</h1>
          <p className="text-white/70 text-lg">
            View and manage your trained machine learning models
          </p>
        </div>

        {/* Models List */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="py-8">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : models.length === 0 ? (
          /* Empty State */
          <Card>
            <CardContent className="py-16 text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-white/20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">
                No Models Yet
              </h3>
              <p className="text-white/60 mb-6">
                Upload a dataset and train your first model
              </p>
              <Link href="/datasets/upload">
                <Button variant="jungle">Upload Dataset</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          /* Models Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map((model) => (
              <Link key={model.id} href={`/models/${model.id}`}>
                <Card className="hover:border-emerald-500 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle as="h3" className="text-lg">
                          {ALGORITHMS[model.algorithm]?.name || model.algorithm}
                        </CardTitle>
                        <p className="text-white/60 text-sm mt-1">
                          {model.problem_type}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-500">
                          {formatPercentage(getAccuracy(model))}
                        </p>
                        <p className="text-white/60 text-xs">
                          {model.problem_type === 'classification'
                            ? 'Accuracy'
                            : 'R² Score'}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/60">Target:</span>
                        <span className="text-white font-medium">
                          {model.target_column}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Features:</span>
                        <span className="text-white font-medium">
                          {model.feature_columns.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Trained:</span>
                        <span className="text-white font-medium">
                          {formatDate(model.trained_at)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <Button variant="jungle" size="sm" className="w-full">
                        View Details →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
