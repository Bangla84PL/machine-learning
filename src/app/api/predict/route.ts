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
    const { modelId, inputFilePath, manualInput } = body

    // Validate inputs
    if (!modelId) {
      return NextResponse.json(
        { error: 'Missing model ID' },
        { status: 400 }
      )
    }

    if (!inputFilePath && !manualInput) {
      return NextResponse.json(
        { error: 'Either inputFilePath or manualInput is required' },
        { status: 400 }
      )
    }

    // Get model info
    const { data: model, error: modelError } = await supabase
      .from('models')
      .select('*')
      .eq('id', modelId)
      .eq('user_id', user.id)
      .single()

    if (modelError || !model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }

    // For manual input prediction
    if (manualInput) {
      // In production, this would call the Python predictor script
      // For now, we'll simulate a prediction
      const prediction = {
        prediction: model.problem_type === 'classification' ? 'Class A' : '42.5',
        confidence: Math.random() * 0.5 + 0.5, // Random confidence between 0.5 and 1.0
      }

      // Save prediction record
      await supabase.from('predictions').insert({
        model_id: modelId,
        user_id: user.id,
        input_file_path: null,
        output_file_path: 'manual',
        prediction_count: 1,
      })

      return NextResponse.json({ prediction })
    }

    // For batch prediction
    if (inputFilePath) {
      // Download input file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('datasets')
        .download(inputFilePath)

      if (downloadError) {
        return NextResponse.json(
          { error: 'Failed to download input file' },
          { status: 500 }
        )
      }

      const text = await fileData.text()
      const lines = text.split('\n').filter((line) => line.trim())
      const rowCount = lines.length - 1 // Subtract header

      // In production, this would:
      // 1. Call Python predictor script
      // 2. Get predictions from the trained model
      // 3. Save results to storage
      //
      // For now, simulate predictions
      const predictions = []
      for (let i = 0; i < Math.min(rowCount, 100); i++) {
        predictions.push({
          prediction:
            model.problem_type === 'classification'
              ? ['Class A', 'Class B', 'Class C'][Math.floor(Math.random() * 3)]
              : (Math.random() * 100).toFixed(2),
          confidence: Math.random() * 0.5 + 0.5,
        })
      }

      // Save prediction record
      const outputPath = `${user.id}/predictions/${Date.now()}_predictions.csv`

      await supabase.from('predictions').insert({
        model_id: modelId,
        user_id: user.id,
        input_file_path: inputFilePath,
        output_file_path: outputPath,
        prediction_count: predictions.length,
      })

      return NextResponse.json({ predictions })
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Prediction API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
