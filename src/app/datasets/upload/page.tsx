'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Loading } from '@/components/ui/Loading'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '@/lib/constants'
import { formatFileSize, isValidFileType, isValidFileSize } from '@/lib/utils'

interface UploadState {
  uploading: boolean
  progress: number
  error: string | null
  success: boolean
}

export default function UploadDatasetPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    success: false,
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      const file = acceptedFiles[0]

      // Validate file type
      if (!isValidFileType(file.name, ALLOWED_FILE_TYPES)) {
        setUploadState({
          uploading: false,
          progress: 0,
          error: 'Only CSV files are allowed',
          success: false,
        })
        return
      }

      // Validate file size
      if (!isValidFileSize(file.size, MAX_FILE_SIZE)) {
        setUploadState({
          uploading: false,
          progress: 0,
          error: `File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`,
          success: false,
        })
        return
      }

      setUploadState({
        uploading: true,
        progress: 10,
        error: null,
        success: false,
      })

      try {
        // Upload file to Supabase Storage
        const filePath = `${user?.id}/${Date.now()}-${file.name}`

        setUploadState((prev) => ({ ...prev, progress: 30 }))

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('datasets')
          .upload(filePath, file)

        if (uploadError) {
          throw new Error(uploadError.message)
        }

        setUploadState((prev) => ({ ...prev, progress: 60 }))

        // Parse CSV to get basic info
        const text = await file.text()
        const lines = text.split('\n').filter((line) => line.trim())
        const headers = lines[0].split(',').map((h) => h.trim())

        // Create dataset record in database
        const { data: datasetData, error: dbError } = await supabase
          .from('datasets')
          .insert({
            user_id: user?.id,
            filename: file.name,
            file_path: filePath,
            row_count: lines.length - 1, // Subtract header
            column_count: headers.length,
            columns: headers.map((name) => ({
              name,
              type: 'unknown',
              missing_count: 0,
            })),
          })
          .select()
          .single()

        if (dbError) {
          throw new Error(dbError.message)
        }

        setUploadState({
          uploading: false,
          progress: 100,
          error: null,
          success: true,
        })

        // Redirect to dataset detail page after a short delay
        setTimeout(() => {
          router.push(`/datasets/${datasetData.id}`)
        }, 1500)
      } catch (error) {
        setUploadState({
          uploading: false,
          progress: 0,
          error: error instanceof Error ? error.message : 'Upload failed',
          success: false,
        })
      }
    },
    [user, router]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    disabled: uploadState.uploading,
  })

  if (authLoading) {
    return <Loading fullScreen text="Loading..." />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} onSignOut={signOut} />

      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Upload Dataset</h1>
            <p className="text-white/70 text-lg">
              Upload a CSV file to start training machine learning models
            </p>
          </div>

          {/* Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle>Select File</CardTitle>
            </CardHeader>
            <CardContent>
              {!uploadState.success ? (
                <>
                  {/* Dropzone */}
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
                      ${uploadState.uploading ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <input {...getInputProps()} />

                    {uploadState.uploading ? (
                      <div className="space-y-4">
                        <Loading size="lg" />
                        <p className="text-white/80 text-lg">Uploading...</p>
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-300"
                            style={{ width: `${uploadState.progress}%` }}
                          />
                        </div>
                        <p className="text-white/60 text-sm">{uploadState.progress}%</p>
                      </div>
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
                          <p className="text-white/60 text-sm">
                            <strong>Accepted format:</strong> CSV (.csv)
                          </p>
                          <p className="text-white/60 text-sm mt-1">
                            <strong>Maximum size:</strong> {formatFileSize(MAX_FILE_SIZE)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Error Message */}
                  {uploadState.error && (
                    <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                      <p className="font-medium">Upload Error</p>
                      <p className="text-sm mt-1">{uploadState.error}</p>
                    </div>
                  )}
                </>
              ) : (
                /* Success Message */
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                    <svg
                      className="w-8 h-8 text-emerald-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-white text-xl font-medium">Upload Successful!</p>
                  <p className="text-white/60">Redirecting to dataset details...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle as="h3" className="text-lg">
                Tips for Best Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-white/70">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">✓</span>
                  <span>Ensure your CSV has a header row with column names</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">✓</span>
                  <span>Clean data works best - remove or fix obvious errors</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">✓</span>
                  <span>
                    Include a target column (the value you want to predict)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">✓</span>
                  <span>More data generally leads to better model performance</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Back Button */}
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => router.push('/datasets')}
              disabled={uploadState.uploading}
            >
              ← Back to Datasets
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
