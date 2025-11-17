import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const {
      datasetId,
      jobId,
      targetColumn,
      algorithm,
      problemType,
      hyperparameters,
      trainTestSplit,
    } = body

    // Validate inputs
    if (!datasetId || !targetColumn || !algorithm || !problemType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get dataset info
    const { data: dataset, error: datasetError } = await supabase
      .from('datasets')
      .select('*')
      .eq('id', datasetId)
      .eq('user_id', user.id)
      .single()

    if (datasetError || !dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
    }

    // Download dataset file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('datasets')
      .download(dataset.file_path)

    if (downloadError) {
      return NextResponse.json(
        { error: 'Failed to download dataset' },
        { status: 500 }
      )
    }

    // In a real implementation, this would:
    // 1. Save the file temporarily
    // 2. Call n8n webhook or Python training script
    // 3. Return immediately and train in background
    //
    // For now, we'll simulate training and create a model record

    // Update job status to running
    await supabase
      .from('training_jobs')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', jobId)

    // Simulate training delay (in production, this happens asynchronously)
    // The actual training would be triggered via n8n webhook

    // Create model record
    const modelName = `${algorithm}_${Date.now()}`
    const modelPath = `${user.id}/models/${modelName}.pkl`

    const { data: model, error: modelError } = await supabase
      .from('models')
      .insert({
        dataset_id: datasetId,
        user_id: user.id,
        name: modelName,
        algorithm,
        problem_type: problemType,
        hyperparameters,
        target_column: targetColumn,
        feature_columns: dataset.columns
          .map((col: any) => col.name)
          .filter((name: string) => name !== targetColumn),
        metrics: {}, // Will be populated after training
        feature_importance: [],
        model_path: modelPath,
        train_test_split: trainTestSplit,
      })
      .select()
      .single()

    if (modelError) {
      return NextResponse.json(
        { error: 'Failed to create model record' },
        { status: 500 }
      )
    }

    // Update job with model ID
    await supabase
      .from('training_jobs')
      .update({ model_id: model.id })
      .eq('id', jobId)

    // In production: Trigger n8n workflow here
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL
    if (n8nWebhookUrl) {
      try {
        await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId,
            modelId: model.id,
            datasetPath: dataset.file_path,
            targetColumn,
            algorithm,
            problemType,
            hyperparameters,
            trainTestSplit,
            modelOutputPath: modelPath,
          }),
        })
      } catch (error) {
        console.error('Failed to trigger n8n workflow:', error)
        // Continue anyway - job can be retried
      }
    }

    return NextResponse.json({
      success: true,
      jobId,
      modelId: model.id,
      message: 'Training started',
    })
  } catch (error) {
    console.error('Training API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
