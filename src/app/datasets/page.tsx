'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Loading, Skeleton } from '@/components/ui/Loading'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Dataset } from '@/types'
import { formatDate, formatRelativeTime } from '@/lib/utils'

export default function DatasetsPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; dataset: Dataset | null }>({
    isOpen: false,
    dataset: null,
  })
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchDatasets()
    }
  }, [user])

  const fetchDatasets = async () => {
    try {
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .eq('user_id', user?.id)
        .order('uploaded_at', { ascending: false })

      if (error) throw error

      setDatasets(data || [])
    } catch (error) {
      console.error('Error fetching datasets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.dataset) return

    setDeleting(true)

    try {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('datasets')
        .remove([deleteModal.dataset.file_path])

      if (storageError) throw storageError

      // Delete database record
      const { error: dbError } = await supabase
        .from('datasets')
        .delete()
        .eq('id', deleteModal.dataset.id)

      if (dbError) throw dbError

      // Update local state
      setDatasets(datasets.filter((d) => d.id !== deleteModal.dataset!.id))

      // Close modal
      setDeleteModal({ isOpen: false, dataset: null })
    } catch (error) {
      console.error('Error deleting dataset:', error)
      alert('Failed to delete dataset')
    } finally {
      setDeleting(false)
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">My Datasets</h1>
            <p className="text-white/70 text-lg">
              Manage your uploaded datasets and start training models
            </p>
          </div>
          <Link href="/datasets/upload">
            <Button variant="jungle" size="lg">
              + Upload Dataset
            </Button>
          </Link>
        </div>

        {/* Datasets List */}
        {loading ? (
          <Card>
            <CardContent className="py-8">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : datasets.length === 0 ? (
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
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">No Datasets Yet</h3>
              <p className="text-white/60 mb-6">
                Upload your first dataset to start training ML models
              </p>
              <Link href="/datasets/upload">
                <Button variant="jungle">Upload Dataset</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          /* Datasets Table */
          <Card>
            <CardHeader>
              <CardTitle>All Datasets ({datasets.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-white/80 font-medium">
                        Filename
                      </th>
                      <th className="text-left py-3 px-4 text-white/80 font-medium">
                        Rows
                      </th>
                      <th className="text-left py-3 px-4 text-white/80 font-medium">
                        Columns
                      </th>
                      <th className="text-left py-3 px-4 text-white/80 font-medium">
                        Uploaded
                      </th>
                      <th className="text-right py-3 px-4 text-white/80 font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasets.map((dataset) => (
                      <tr
                        key={dataset.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <Link
                            href={`/datasets/${dataset.id}`}
                            className="text-white hover:text-emerald-500 font-medium"
                          >
                            {dataset.filename}
                          </Link>
                        </td>
                        <td className="py-4 px-4 text-white/70">
                          {dataset.row_count.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-white/70">
                          {dataset.column_count}
                        </td>
                        <td className="py-4 px-4 text-white/70">
                          <span title={formatDate(dataset.uploaded_at)}>
                            {formatRelativeTime(dataset.uploaded_at)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/datasets/${dataset.id}`}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                            <Link href={`/datasets/${dataset.id}/train`}>
                              <Button variant="jungle" size="sm">
                                Train Model
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setDeleteModal({ isOpen: true, dataset })
                              }
                              className="!text-red-400 !border-red-400 hover:!bg-red-500/10"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, dataset: null })}
        title="Delete Dataset"
      >
        <div className="space-y-4">
          <p className="text-white/80">
            Are you sure you want to delete{' '}
            <strong className="text-white">{deleteModal.dataset?.filename}</strong>?
          </p>
          <p className="text-white/60 text-sm">
            This will also delete all models trained on this dataset. This action cannot
            be undone.
          </p>
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ isOpen: false, dataset: null })}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              isLoading={deleting}
              className="!bg-red-500 hover:!bg-red-600"
            >
              Delete Dataset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
