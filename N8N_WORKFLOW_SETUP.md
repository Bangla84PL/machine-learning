# n8n Workflow Setup for ML Training

This document outlines how to set up n8n workflows for background ML model training on the SmartCamp.AI VPS.

## Overview

The ML Insights Platform uses n8n to handle asynchronous model training jobs. When a user starts training a model through the web interface, an n8n workflow is triggered that:

1. Receives the training job parameters
2. Downloads the dataset from Supabase Storage
3. Executes the Python training script
4. Updates the training job status in real-time
5. Stores the trained model
6. Updates the model record with metrics

## Workflow Architecture

```
User initiates training
        ↓
Next.js API Route (/api/train)
        ↓
Creates training_job record
        ↓
Triggers n8n webhook
        ↓
n8n Workflow executes Python script
        ↓
Updates job progress (0% → 100%)
        ↓
Stores model file & metrics
        ↓
Updates model record
```

## n8n Workflow Configuration

### Workflow Name
`ml-insights-training`

### Webhook URL
`https://n8n.smartcamp.ai/webhook/ml-training`

### Workflow Nodes

#### 1. Webhook Trigger Node
**Type:** Webhook
**Path:** `/ml-training`
**Method:** POST
**Authentication:** None (internal VPS network only)

**Expected Payload:**
```json
{
  "jobId": "uuid",
  "modelId": "uuid",
  "datasetPath": "user-id/dataset.csv",
  "targetColumn": "column_name",
  "algorithm": "random_forest",
  "problemType": "classification",
  "hyperparameters": {},
  "trainTestSplit": 0.8,
  "modelOutputPath": "user-id/models/model.pkl"
}
```

#### 2. Update Job Status to "Running"
**Type:** Supabase
**Operation:** Update
**Table:** `training_jobs`
**Filter:** `id = {{$json.jobId}}`
**Data:**
```json
{
  "status": "running",
  "progress": 10,
  "started_at": "{{$now}}"
}
```

#### 3. Download Dataset from Supabase Storage
**Type:** HTTP Request
**Method:** GET
**URL:** `https://api.supabase.smartcamp.ai/storage/v1/object/datasets/{{$json.datasetPath}}`
**Headers:**
```
Authorization: Bearer YOUR_SERVICE_ROLE_KEY
```

**Save Response to:** `/tmp/datasets/{{$json.jobId}}.csv`

#### 4. Update Progress (30%)
**Type:** Supabase
**Operation:** Update
**Table:** `training_jobs`
**Filter:** `id = {{$json.jobId}}`
**Data:**
```json
{
  "progress": 30
}
```

#### 5. Execute Python Training Script
**Type:** Execute Command
**Command:**
```bash
python3 /path/to/python/ml_trainer.py '{{$json}}'
```

**Working Directory:** `/home/user/machine-learning/python`

**JSON Configuration Passed:**
```json
{
  "dataset_path": "/tmp/datasets/{{$json.jobId}}.csv",
  "target_column": "{{$json.targetColumn}}",
  "algorithm": "{{$json.algorithm}}",
  "problem_type": "{{$json.problemType}}",
  "hyperparameters": {{$json.hyperparameters}},
  "train_test_split": {{$json.trainTestSplit}},
  "model_output_path": "/tmp/models/{{$json.jobId}}.pkl"
}
```

**Capture Output:** Yes (JSON)

#### 6. Check Training Success
**Type:** IF Node
**Condition:** `{{$json.success}} === true`

##### IF TRUE (Success Path):

**6a. Update Progress (70%)**
**Type:** Supabase
**Operation:** Update
**Table:** `training_jobs`
**Data:**
```json
{
  "progress": 70
}
```

**6b. Upload Model to Supabase Storage**
**Type:** HTTP Request
**Method:** POST
**URL:** `https://api.supabase.smartcamp.ai/storage/v1/object/models/{{$json.modelOutputPath}}`
**Headers:**
```
Authorization: Bearer YOUR_SERVICE_ROLE_KEY
Content-Type: application/octet-stream
```
**Body:** Binary file from `/tmp/models/{{$json.jobId}}.pkl`

**6c. Update Model Record with Metrics**
**Type:** Supabase
**Operation:** Update
**Table:** `models`
**Filter:** `id = {{$json.modelId}}`
**Data:**
```json
{
  "metrics": {{$json.metrics}},
  "feature_importance": {{$json.feature_importance}},
  "training_duration": {{$json.training_duration}},
  "trained_at": "{{$now}}"
}
```

**6d. Update Job Status to "Completed"**
**Type:** Supabase
**Operation:** Update
**Table:** `training_jobs`
**Data:**
```json
{
  "status": "completed",
  "progress": 100,
  "completed_at": "{{$now}}"
}
```

**6e. Cleanup Temporary Files**
**Type:** Execute Command
**Command:**
```bash
rm -f /tmp/datasets/{{$json.jobId}}.csv /tmp/models/{{$json.jobId}}.pkl
```

##### IF FALSE (Failure Path):

**6f. Update Job Status to "Failed"**
**Type:** Supabase
**Operation:** Update
**Table:** `training_jobs`
**Data:**
```json
{
  "status": "failed",
  "error_message": "{{$json.error}}",
  "completed_at": "{{$now}}"
}
```

**6g. Cleanup Temporary Files**
**Type:** Execute Command
**Command:**
```bash
rm -f /tmp/datasets/{{$json.jobId}}.csv /tmp/models/{{$json.jobId}}.pkl
```

## Installation Steps

### 1. Create Workflow in n8n

1. Access n8n at `https://n8n.smartcamp.ai`
2. Click "Add Workflow"
3. Name it "ML Insights Training"
4. Add nodes as described above

### 2. Configure Supabase Connection

In n8n Credentials:
1. Go to Settings → Credentials
2. Add "Supabase" credential
3. Configure:
   - **Host:** `https://api.supabase.smartcamp.ai`
   - **Service Role Key:** `[from VPS docs]`

### 3. Install Python Dependencies on VPS

```bash
cd /home/user/machine-learning/python
pip3 install -r requirements.txt
```

### 4. Test Python Script Manually

```bash
cd /home/user/machine-learning/python

# Create test config
echo '{
  "dataset_path": "/path/to/test.csv",
  "target_column": "target",
  "algorithm": "random_forest",
  "problem_type": "classification",
  "hyperparameters": {"n_estimators": 100},
  "train_test_split": 0.8,
  "model_output_path": "/tmp/test_model.pkl"
}' > /tmp/test_config.json

# Run training
python3 ml_trainer.py "$(cat /tmp/test_config.json)"
```

### 5. Create Temporary Directories

```bash
mkdir -p /tmp/datasets
mkdir -p /tmp/models
chmod 777 /tmp/datasets /tmp/models
```

### 6. Test n8n Workflow

Use n8n's "Execute Workflow" button with test data:

```json
{
  "jobId": "test-job-id",
  "modelId": "test-model-id",
  "datasetPath": "user-id/test.csv",
  "targetColumn": "target",
  "algorithm": "random_forest",
  "problemType": "classification",
  "hyperparameters": {
    "n_estimators": 100,
    "max_depth": 10
  },
  "trainTestSplit": 0.8,
  "modelOutputPath": "user-id/models/test.pkl"
}
```

## Environment Variables

Add to Next.js `.env.local`:

```env
N8N_WEBHOOK_URL=https://n8n.smartcamp.ai/webhook/ml-training
N8N_API_KEY=your-n8n-api-key-if-needed
```

## Monitoring

### View Training Jobs

Query the database:

```sql
SELECT
  tj.id,
  tj.status,
  tj.progress,
  tj.error_message,
  tj.started_at,
  tj.completed_at,
  m.algorithm,
  m.name
FROM training_jobs tj
LEFT JOIN models m ON m.id = tj.model_id
ORDER BY tj.created_at DESC
LIMIT 20;
```

### View n8n Execution Logs

1. Go to n8n dashboard
2. Click "Executions"
3. Filter by workflow "ML Insights Training"
4. View execution details and errors

## Troubleshooting

### Training Job Stuck at "Pending"

**Cause:** n8n webhook not triggered
**Solution:**
1. Check n8n is running: `systemctl status n8n`
2. Verify webhook URL in environment variables
3. Check n8n logs: `docker logs n8n_n8n_1`

### Training Job Fails Immediately

**Cause:** Python script error
**Solution:**
1. Check n8n execution logs
2. Test Python script manually
3. Verify dataset path and permissions

### Model Not Saved

**Cause:** Supabase storage upload failed
**Solution:**
1. Check storage bucket exists
2. Verify service role key has storage permissions
3. Check file size limits

### Progress Not Updating

**Cause:** Database update failures
**Solution:**
1. Verify Supabase credentials in n8n
2. Check database RLS policies
3. Ensure training_jobs table is accessible

## Alternative: Direct Python Execution (Without n8n)

If n8n is not available, the API route can execute Python directly:

```typescript
// In /api/train/route.ts
import { spawn } from 'child_process'

const python = spawn('python3', [
  'python/ml_trainer.py',
  JSON.stringify(config)
])

python.stdout.on('data', (data) => {
  // Parse and update progress
})

python.on('close', (code) => {
  // Update job status
})
```

**Note:** This approach blocks the API route and doesn't scale well. n8n is recommended for production.

## Next Steps

1. ✅ Create n8n workflow
2. ✅ Test with sample dataset
3. Monitor first production training job
4. Set up alerts for failed jobs
5. Implement job retry logic
6. Add email notifications on completion

## Resources

- [n8n Documentation](https://docs.n8n.io)
- [Supabase Storage API](https://supabase.com/docs/guides/storage)
- [Python ML Trainer Script](./python/ml_trainer.py)

---

**Last Updated:** 2025-11-17
