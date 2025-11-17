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
import { TrainingJob, TrainingStatus } from '@/types'
import { formatRelativeTime } from '@/lib/utils'
import { TRAINING_POLL_INTERVAL } from '@/lib/constants'

export default function TrainingProgressPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const [job, setJob] = useState<TrainingJob | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && jobId) {
      fetchJob()

      // Poll for updates every 2 seconds
      const interval = setInterval(fetchJob, TRAINING_POLL_INTERVAL)

      return () => clearInterval(interval)
    }
  }, [user, jobId])

  const fetchJob = async () => {
    try {
      const { data, error } = await supabase
        .from('training_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (error) throw error

      setJob(data)

      // If completed or failed, redirect to model page
      if (data.status === 'completed' && data.model_id) {
        setTimeout(() => {
          router.push(`/models/${data.model_id}`)
        }, 2000)
      }
    } catch (error) {
      console.error('Error fetching job:', error)
      router.push('/models')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: TrainingStatus) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-500'
      case 'running':
        return 'text-blue-500'
      case 'completed':
        return 'text-emerald-500'
      case 'failed':
        return 'text-red-500'
      default:
        return 'text-white/60'
    }
  }

  const getStatusIcon = (status: TrainingStatus) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-12 h-12 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'running':
        return (
          <svg className="w-12 h-12 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )
      case 'completed':
        return (
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'failed':
        return (
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  if (authLoading || loading || !user) {
    return <Loading fullScreen text="Loading training job..." />
  }

  if (!job) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} onSignOut={signOut} />

      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-white mb-2">Training Progress</h1>
            <p className="text-white/70">
              Track your model training in real-time
            </p>
          </div>

          {/* Status Card */}
          <Card>
            <CardContent className="py-12 text-center">
              <div className={`${getStatusColor(job.status)} mb-4 flex justify-center`}>
                {getStatusIcon(job.status)}
              </div>

              <h2 className="text-3xl font-bold text-white mb-2 capitalize">
                {job.status === 'running' ? 'Training in Progress' : job.status}
              </h2>

              {job.status === 'running' && (
                <p className="text-white/60 mb-6">
                  Your model is being trained. This may take a few minutes...
                </p>
              )}

              {job.status === 'pending' && (
                <p className="text-white/60 mb-6">
                  Your training job is queued and will start shortly...
                </p>
              )}

              {job.status === 'completed' && (
                <p className="text-white/60 mb-6">
                  Training completed successfully! Redirecting to model results...
                </p>
              )}

              {job.status === 'failed' && (
                <div className="mb-6">
                  <p className="text-white/60 mb-2">Training failed</p>
                  {job.error_message && (
                    <p className="text-red-400 text-sm">{job.error_message}</p>
                  )}
                </div>
              )}

              {/* Progress Bar */}
              {(job.status === 'running' || job.status === 'pending') && (
                <div className="mb-6">
                  <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                  <p className="text-white/60 text-sm mt-2">{job.progress}% complete</p>
                </div>
              )}

              {/* Metadata */}
              <div className="grid md:grid-cols-2 gap-4 mt-8 text-left">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-white/60 text-sm mb-1">Status</p>
                  <p className={`font-medium capitalize ${getStatusColor(job.status)}`}>
                    {job.status}
                  </p>
                </div>

                {job.started_at && (
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-white/60 text-sm mb-1">Started</p>
                    <p className="text-white font-medium">
                      {formatRelativeTime(job.started_at)}
                    </p>
                  </div>
                )}

                {job.completed_at && (
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-white/60 text-sm mb-1">Completed</p>
                    <p className="text-white font-medium">
                      {formatRelativeTime(job.completed_at)}
                    </p>
                  </div>
                )}

                {job.started_at && job.completed_at && (
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-white/60 text-sm mb-1">Duration</p>
                    <p className="text-white font-medium">
                      {Math.round(
                        (new Date(job.completed_at).getTime() -
                          new Date(job.started_at).getTime()) /
                          1000
                      )}{' '}
                      seconds
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-center mt-8">
                {job.status === 'completed' && job.model_id && (
                  <Link href={`/models/${job.model_id}`}>
                    <Button variant="jungle" size="lg">
                      View Model Results →
                    </Button>
                  </Link>
                )}

                {job.status === 'failed' && (
                  <Link href="/datasets">
                    <Button variant="jungle">Try Again</Button>
                  </Link>
                )}

                <Link href="/models">
                  <Button variant="outline">View All Models</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          {job.status === 'running' && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle as="h3" className="text-lg">
                  What's Happening?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-white/70">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>Loading and preprocessing your dataset</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>Splitting data into training and test sets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">⟳</span>
                    <span>Training the machine learning model</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/40 mt-1">○</span>
                    <span>Evaluating model performance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/40 mt-1">○</span>
                    <span>Calculating feature importance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white/40 mt-1">○</span>
                    <span>Saving trained model</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
