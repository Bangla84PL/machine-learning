'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Loading, Skeleton, TableSkeleton } from '@/components/ui/Loading'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Dataset } from '@/types'
import { formatDate } from '@/lib/utils'

type TabType = 'preview' | 'statistics' | 'visualizations'

export default function DatasetDetailPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const params = useParams()
  const datasetId = params.id as string

  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('preview')
  const [csvData, setCsvData] = useState<string[][] | null>(null)
  const [loadingData, setLoadingData] = useState(false)

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

      // Load CSV data for preview
      if (data) {
        await loadCsvData(data.file_path)
      }
    } catch (error) {
      console.error('Error fetching dataset:', error)
      router.push('/datasets')
    } finally {
      setLoading(false)
    }
  }

  const loadCsvData = async (filePath: string) => {
    setLoadingData(true)
    try {
      const { data, error } = await supabase.storage
        .from('datasets')
        .download(filePath)

      if (error) throw error

      const text = await data.text()
      const lines = text.split('\n').filter((line) => line.trim())
      const parsed = lines.map((line) =>
        line.split(',').map((cell) => cell.trim())
      )

      setCsvData(parsed)
    } catch (error) {
      console.error('Error loading CSV:', error)
    } finally {
      setLoadingData(false)
    }
  }

  if (authLoading || loading || !user) {
    return <Loading fullScreen text="Loading dataset..." />
  }

  if (!dataset) {
    return null
  }

  const headers = csvData?.[0] || []
  const rows = csvData?.slice(1, 51) || [] // Show first 50 rows

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} onSignOut={signOut} />

      <div className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
            <Link href="/datasets" className="hover:text-white">
              Datasets
            </Link>
            <span>/</span>
            <span className="text-white">{dataset.filename}</span>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {dataset.filename}
              </h1>
              <p className="text-white/70">
                Uploaded {formatDate(dataset.uploaded_at)}
              </p>
            </div>
            <Link href={`/datasets/${dataset.id}/train`}>
              <Button variant="jungle" size="lg">
                Train Model →
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-white/60 text-sm mb-1">Total Rows</p>
              <p className="text-3xl font-bold text-white">
                {dataset.row_count.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-white/60 text-sm mb-1">Total Columns</p>
              <p className="text-3xl font-bold text-white">{dataset.column_count}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-white/60 text-sm mb-1">File Type</p>
              <p className="text-3xl font-bold text-white">CSV</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-1 border-b border-white/10 -mb-4">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'preview'
                    ? 'text-emerald-500 border-b-2 border-emerald-500'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setActiveTab('statistics')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'statistics'
                    ? 'text-emerald-500 border-b-2 border-emerald-500'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Statistics
              </button>
              <button
                onClick={() => setActiveTab('visualizations')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'visualizations'
                    ? 'text-emerald-500 border-b-2 border-emerald-500'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Visualizations
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Preview Tab */}
            {activeTab === 'preview' && (
              <div>
                {loadingData ? (
                  <TableSkeleton rows={10} columns={Math.min(dataset.column_count, 6)} />
                ) : csvData ? (
                  <div className="overflow-x-auto">
                    <p className="text-white/60 text-sm mb-4">
                      Showing first 50 rows of {dataset.row_count.toLocaleString()}
                    </p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/20">
                          <th className="text-left py-2 px-3 text-white/60 font-medium w-12">
                            #
                          </th>
                          {headers.map((header, i) => (
                            <th
                              key={i}
                              className="text-left py-2 px-3 text-white font-medium whitespace-nowrap"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className="border-b border-white/5 hover:bg-white/5"
                          >
                            <td className="py-2 px-3 text-white/40 font-mono text-xs">
                              {rowIndex + 1}
                            </td>
                            {row.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="py-2 px-3 text-white/80 whitespace-nowrap"
                              >
                                {cell || (
                                  <span className="text-white/30 italic">null</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-white/60 text-center py-8">
                    Failed to load data preview
                  </p>
                )}
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'statistics' && (
              <div>
                <p className="text-white/60 mb-4">
                  Column information and statistics
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="text-left py-3 px-4 text-white font-medium">
                          Column
                        </th>
                        <th className="text-left py-3 px-4 text-white font-medium">
                          Type
                        </th>
                        <th className="text-left py-3 px-4 text-white font-medium">
                          Non-Null Count
                        </th>
                        <th className="text-left py-3 px-4 text-white font-medium">
                          Missing
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataset.columns.map((col, i) => (
                        <tr key={i} className="border-b border-white/5">
                          <td className="py-3 px-4 text-white font-medium">
                            {col.name}
                          </td>
                          <td className="py-3 px-4 text-white/70">
                            <span className="px-2 py-1 bg-white/10 rounded text-xs">
                              {col.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-white/70">
                            {(dataset.row_count - col.missing_count).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-white/70">
                            {col.missing_count > 0 ? (
                              <span className="text-yellow-400">
                                {col.missing_count} ({((col.missing_count / dataset.row_count) * 100).toFixed(1)}%)
                              </span>
                            ) : (
                              <span className="text-emerald-500">0</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Visualizations Tab */}
            {activeTab === 'visualizations' && (
              <div className="text-center py-16">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="text-white/60 mb-2">Visualizations Coming Soon</p>
                <p className="text-white/40 text-sm">
                  Data visualizations will be available in the next update
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Link href="/datasets">
            <Button variant="outline">← Back to Datasets</Button>
          </Link>
          <Link href={`/datasets/${dataset.id}/train`}>
            <Button variant="jungle">Train Model →</Button>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}
