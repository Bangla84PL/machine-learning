'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Loading } from '@/components/ui/Loading'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Dataset, AlgorithmType, ProblemType } from '@/types'
import { ALGORITHMS, DEFAULT_TRAIN_TEST_SPLIT } from '@/lib/constants'

type Step = 1 | 2 | 3

interface TrainingConfig {
  targetColumn: string
  problemType: ProblemType | ''
  algorithm: AlgorithmType | ''
  hyperparameters: Record<string, any>
  trainTestSplit: number
}

export default function TrainModelPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const params = useParams()
  const datasetId = params.id as string

  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>(1)
  const [config, setConfig] = useState<TrainingConfig>({
    targetColumn: '',
    problemType: '',
    algorithm: '',
    hyperparameters: {},
    trainTestSplit: DEFAULT_TRAIN_TEST_SPLIT,
  })
  const [training, setTraining] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && datasetId) {
      fetchDataset()
    }
  }, [user, datasetId])

  const fetchDataset = async () => {
    try {
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .eq('id', datasetId)
        .single()

      if (error) throw error
      setDataset(data)
    } catch (error) {
      console.error('Error fetching dataset:', error)
      router.push('/datasets')
    } finally {
      setLoading(false)
    }
  }

  const handleStartTraining = async () => {
    if (!config.algorithm || !config.targetColumn || !config.problemType) {
      alert('Please complete all steps')
      return
    }

    setTraining(true)

    try {
      // Create training job record
      const { data: jobData, error: jobError } = await supabase
        .from('training_jobs')
        .insert({
          dataset_id: datasetId,
          user_id: user?.id,
          status: 'pending',
          progress: 0,
        })
        .select()
        .single()

      if (jobError) throw jobError

      // Call training API
      const response = await fetch('/api/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId,
          jobId: jobData.id,
          targetColumn: config.targetColumn,
          algorithm: config.algorithm,
          problemType: config.problemType,
          hyperparameters: config.hyperparameters,
          trainTestSplit: config.trainTestSplit,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Training failed')
      }

      // Redirect to training progress page
      router.push(`/training/${jobData.id}`)
    } catch (error) {
      console.error('Training error:', error)
      alert(error instanceof Error ? error.message : 'Failed to start training')
      setTraining(false)
    }
  }

  const getAlgorithmsForProblemType = () => {
    if (!config.problemType) return []

    return Object.values(ALGORITHMS).filter((algo) =>
      algo.problem_types.includes(config.problemType as ProblemType)
    )
  }

  const updateHyperparameter = (name: string, value: any) => {
    setConfig({
      ...config,
      hyperparameters: {
        ...config.hyperparameters,
        [name]: value,
      },
    })
  }

  const selectedAlgorithm = config.algorithm
    ? ALGORITHMS[config.algorithm]
    : null

  if (authLoading || loading || !user || !dataset) {
    return <Loading fullScreen text="Loading..." />
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} onSignOut={signOut} />

      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
              <Link href="/datasets" className="hover:text-white">
                Datasets
              </Link>
              <span>/</span>
              <Link href={`/datasets/${dataset.id}`} className="hover:text-white">
                {dataset.filename}
              </Link>
              <span>/</span>
              <span className="text-white">Train Model</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Train Model</h1>
            <p className="text-white/70 text-lg">
              Configure your model training settings
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-semibold
                      ${
                        s === step
                          ? 'bg-emerald-500 text-white'
                          : s < step
                          ? 'bg-emerald-500/30 text-emerald-500'
                          : 'bg-white/10 text-white/40'
                      }
                    `}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`w-16 h-1 ${
                        s < step ? 'bg-emerald-500' : 'bg-white/10'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Select Target Column */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Select Target Column</CardTitle>
                <p className="text-white/60 text-sm mt-2">
                  Choose the column you want to predict (target variable)
                </p>
              </CardHeader>
              <CardContent>
                <Select
                  label="Target Column"
                  value={config.targetColumn}
                  onChange={(e) =>
                    setConfig({ ...config, targetColumn: e.target.value })
                  }
                  options={dataset.columns.map((col) => ({
                    value: col.name,
                    label: col.name,
                  }))}
                />

                {config.targetColumn && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-white mb-2">
                      Problem Type
                    </label>
                    <div className="grid md:grid-cols-2 gap-4">
                      <button
                        onClick={() =>
                          setConfig({ ...config, problemType: 'classification' })
                        }
                        className={`
                          p-4 rounded-lg border-2 text-left transition-all
                          ${
                            config.problemType === 'classification'
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-white/20 hover:border-white/40'
                          }
                        `}
                      >
                        <h3 className="text-white font-semibold mb-1">
                          Classification
                        </h3>
                        <p className="text-white/60 text-sm">
                          Predict categories (e.g., Yes/No, Type A/B/C)
                        </p>
                      </button>
                      <button
                        onClick={() =>
                          setConfig({ ...config, problemType: 'regression' })
                        }
                        className={`
                          p-4 rounded-lg border-2 text-left transition-all
                          ${
                            config.problemType === 'regression'
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-white/20 hover:border-white/40'
                          }
                        `}
                      >
                        <h3 className="text-white font-semibold mb-1">Regression</h3>
                        <p className="text-white/60 text-sm">
                          Predict continuous values (e.g., price, temperature)
                        </p>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end mt-6">
                  <Button
                    variant="jungle"
                    onClick={() => setStep(2)}
                    disabled={!config.targetColumn || !config.problemType}
                  >
                    Next: Choose Algorithm →
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Choose Algorithm */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Choose Algorithm</CardTitle>
                <p className="text-white/60 text-sm mt-2">
                  Select a machine learning algorithm for your{' '}
                  {config.problemType} task
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getAlgorithmsForProblemType().map((algo) => (
                    <button
                      key={algo.id}
                      onClick={() => {
                        setConfig({
                          ...config,
                          algorithm: algo.id,
                          hyperparameters: algo.hyperparameters.reduce(
                            (acc, hp) => ({ ...acc, [hp.name]: hp.default }),
                            {}
                          ),
                        })
                      }}
                      className={`
                        w-full p-4 rounded-lg border-2 text-left transition-all
                        ${
                          config.algorithm === algo.id
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-white/20 hover:border-white/40'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-semibold">
                              {algo.name}
                            </h3>
                            {algo.recommended && (
                              <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-white/60 text-sm mt-1">
                            {algo.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {algo.use_cases.slice(0, 2).map((useCase, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-white/10 text-white/70 text-xs rounded"
                              >
                                {useCase}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    ← Back
                  </Button>
                  <Button
                    variant="jungle"
                    onClick={() => setStep(3)}
                    disabled={!config.algorithm}
                  >
                    Next: Configure Settings →
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review & Configure */}
          {step === 3 && selectedAlgorithm && (
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Review & Configure</CardTitle>
                <p className="text-white/60 text-sm mt-2">
                  Review your settings and adjust hyperparameters
                </p>
              </CardHeader>
              <CardContent>
                {/* Summary */}
                <div className="mb-6 p-4 bg-white/5 rounded-lg">
                  <h3 className="text-white font-semibold mb-3">Summary</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-white/60">Dataset</p>
                      <p className="text-white font-medium">{dataset.filename}</p>
                    </div>
                    <div>
                      <p className="text-white/60">Target Column</p>
                      <p className="text-white font-medium">{config.targetColumn}</p>
                    </div>
                    <div>
                      <p className="text-white/60">Problem Type</p>
                      <p className="text-white font-medium capitalize">
                        {config.problemType}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60">Algorithm</p>
                      <p className="text-white font-medium">
                        {selectedAlgorithm.name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hyperparameters */}
                <div className="mb-6">
                  <h3 className="text-white font-semibold mb-4">
                    Hyperparameters
                  </h3>
                  <div className="space-y-4">
                    {selectedAlgorithm.hyperparameters.map((hp) => (
                      <div key={hp.name}>
                        {hp.type === 'select' ? (
                          <Select
                            label={hp.label}
                            value={config.hyperparameters[hp.name]}
                            onChange={(e) => {
                              const val =
                                e.target.value === 'true'
                                  ? true
                                  : e.target.value === 'false'
                                  ? false
                                  : e.target.value
                              updateHyperparameter(hp.name, val)
                            }}
                            options={
                              hp.options?.map((opt) => ({
                                value: String(opt.value),
                                label: opt.label,
                              })) || []
                            }
                          />
                        ) : (
                          <Input
                            label={hp.label}
                            type="number"
                            value={config.hyperparameters[hp.name]}
                            onChange={(e) =>
                              updateHyperparameter(
                                hp.name,
                                hp.type === 'integer'
                                  ? parseInt(e.target.value)
                                  : parseFloat(e.target.value)
                              )
                            }
                            min={hp.min}
                            max={hp.max}
                            step={hp.step}
                          />
                        )}
                        <p className="text-white/50 text-xs mt-1">
                          {hp.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Train-Test Split */}
                <div className="mb-6">
                  <h3 className="text-white font-semibold mb-4">
                    Train-Test Split
                  </h3>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0.5"
                      max="0.95"
                      step="0.05"
                      value={config.trainTestSplit}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          trainTestSplit: parseFloat(e.target.value),
                        })
                      }
                      className="flex-1"
                    />
                    <span className="text-white font-mono">
                      {(config.trainTestSplit * 100).toFixed(0)}% /{' '}
                      {((1 - config.trainTestSplit) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-white/50 text-xs mt-2">
                    Training data / Test data split ratio
                  </p>
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    ← Back
                  </Button>
                  <Button
                    variant="jungle"
                    onClick={handleStartTraining}
                    isLoading={training}
                    size="lg"
                  >
                    Start Training
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
