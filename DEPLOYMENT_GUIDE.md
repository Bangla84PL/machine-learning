# ML Insights Platform - Complete Deployment Guide

This comprehensive guide walks you through deploying the ML Insights Platform from start to finish.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Storage Configuration](#storage-configuration)
5. [Frontend Deployment](#frontend-deployment)
6. [Backend Setup](#backend-setup)
7. [n8n Workflow](#n8n-workflow)
8. [Testing](#testing)
9. [Production Checklist](#production-checklist)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- [ ] GitHub account (for code repository)
- [ ] Vercel account (for frontend hosting)
- [ ] Access to SmartCamp.AI VPS (for backend)
- [ ] Supabase access on VPS

### Required Software
- [ ] Node.js 18+ and npm
- [ ] Python 3.9+
- [ ] Git
- [ ] PostgreSQL client (psql)

### Access Requirements
- [ ] VPS SSH access
- [ ] Supabase service role key
- [ ] n8n access credentials

---

## Environment Setup

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd machine-learning
```

### 2. Install Dependencies

#### Frontend Dependencies
```bash
npm install
```

#### Python Dependencies
```bash
cd python
pip3 install -r requirements.txt
cd ..
```

### 3. Environment Variables

Create `.env.local` in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://api.supabase.smartcamp.ai
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# n8n Configuration
N8N_WEBHOOK_URL=https://n8n.smartcamp.ai/webhook/ml-training
N8N_API_KEY=<your-n8n-api-key-if-needed>

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Getting Supabase Keys:**
1. Access Supabase at `https://api.supabase.smartcamp.ai`
2. Navigate to Project Settings → API
3. Copy the `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy the `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep secret!

---

## Database Setup

### 1. Run Migration

Connect to your Supabase instance:

```bash
psql postgresql://postgres:40ff78fadfcd119c14d1d5818107d1aa@db:5432/postgres
```

Execute the migration:

```sql
\i supabase/migrations/001_initial_schema.sql
```

Or run directly:

```bash
psql postgresql://postgres:40ff78fadfcd119c14d1d5818107d1aa@db:5432/postgres < supabase/migrations/001_initial_schema.sql
```

### 2. Verify Tables

```sql
-- List all tables
\dt public.*

-- Should see:
-- profiles
-- datasets
-- models
-- training_jobs
-- predictions
```

### 3. Test Row-Level Security

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- All tables should have rowsecurity = true
```

---

## Storage Configuration

### 1. Create Storage Buckets

Using Supabase Dashboard or SQL:

```sql
-- Create datasets bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('datasets', 'datasets', false);

-- Create models bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('models', 'models', false);

-- Create predictions bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('predictions', 'predictions', false);
```

### 2. Set Storage Policies

For each bucket, create RLS policies:

```sql
-- Datasets bucket policies
CREATE POLICY "Users can upload own datasets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'datasets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read own datasets"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'datasets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own datasets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'datasets' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

Repeat for `models` and `predictions` buckets (change bucket_id accordingly).

### 3. Test Storage

```bash
# Test file upload
curl -X POST \
  https://api.supabase.smartcamp.ai/storage/v1/object/datasets/test.txt \
  -H "Authorization: Bearer <your-service-role-key>" \
  -H "Content-Type: text/plain" \
  --data "Hello World"
```

---

## Frontend Deployment

### Local Development

```bash
npm run dev
```

Visit `http://localhost:3000`

### Production Deployment (Vercel)

#### 1. Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Select the `machine-learning` repository

#### 2. Configure Build Settings

Vercel should auto-detect Next.js:

- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

#### 3. Add Environment Variables

In Vercel Project Settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://api.supabase.smartcamp.ai
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
N8N_WEBHOOK_URL=https://n8n.smartcamp.ai/webhook/ml-training
NEXT_PUBLIC_APP_URL=https://ml-insights.smartcamp.ai
```

⚠️ **Important:** Add these for all environments (Production, Preview, Development)

#### 4. Deploy

Click "Deploy" - Vercel will:
1. Install dependencies
2. Build the Next.js app
3. Deploy to a production URL

#### 5. Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add `ml-insights.smartcamp.ai`
3. Configure DNS records as instructed
4. Wait for SSL certificate provisioning

---

## Backend Setup

### 1. Deploy Python Scripts to VPS

SSH into your VPS:

```bash
ssh user@smartcamp.ai
```

Create directory and copy files:

```bash
mkdir -p /home/user/ml-insights-backend
cd /home/user/ml-insights-backend
```

Copy files from your local machine:

```bash
# From your local machine
scp -r python/* user@smartcamp.ai:/home/user/ml-insights-backend/
```

### 2. Install Python Dependencies on VPS

```bash
cd /home/user/ml-insights-backend
pip3 install -r requirements.txt
```

### 3. Test Python Scripts

```bash
# Create test data
echo "feature1,feature2,target
1,2,A
3,4,B
5,6,A" > /tmp/test.csv

# Test training script
python3 ml_trainer.py '{
  "dataset_path": "/tmp/test.csv",
  "target_column": "target",
  "algorithm": "random_forest",
  "problem_type": "classification",
  "hyperparameters": {"n_estimators": 10},
  "train_test_split": 0.8,
  "model_output_path": "/tmp/test_model.pkl"
}'

# Should output JSON with success=true
```

### 4. Create Temp Directories

```bash
mkdir -p /tmp/datasets
mkdir -p /tmp/models
chmod 777 /tmp/datasets /tmp/models
```

---

## n8n Workflow

### 1. Access n8n

Navigate to: `https://n8n.smartcamp.ai`

### 2. Create Workflow

1. Click "Workflows" → "Add Workflow"
2. Name: "ML Insights Training"
3. Add nodes as described in `N8N_WORKFLOW_SETUP.md`

### 3. Configure Webhook

1. Add "Webhook" node
2. Path: `/ml-training`
3. Method: POST
4. Response: Immediately

### 4. Add Supabase Nodes

Create credential for Supabase:
1. Settings → Credentials → Add Credential
2. Select "Supabase"
3. Host: `https://api.supabase.smartcamp.ai`
4. Service Role Key: `<your-service-key>`

Add nodes to:
- Update training_jobs status
- Update models with results
- Upload model files to storage

### 5. Add Execute Command Node

Execute Python training script:

```bash
cd /home/user/ml-insights-backend && \
python3 ml_trainer.py '{{$json.config}}'
```

### 6. Test Workflow

1. Click "Execute Workflow"
2. Provide test payload (see `N8N_WORKFLOW_SETUP.md`)
3. Verify all nodes execute successfully
4. Check database for updated records

### 7. Activate Workflow

Click "Active" toggle to enable the workflow.

---

## Testing

### End-to-End Testing

#### 1. Test Authentication

```bash
# Visit your deployed URL
open https://ml-insights.smartcamp.ai

# Test signup
# - Create account with email
# - Verify email works
# - Login successful
```

#### 2. Test Dataset Upload

- [ ] Upload a CSV file (< 100MB)
- [ ] Verify file appears in Storage
- [ ] Check database record created
- [ ] View dataset preview
- [ ] See statistics tab

#### 3. Test Model Training

- [ ] Start training wizard
- [ ] Select target column
- [ ] Choose algorithm
- [ ] Configure hyperparameters
- [ ] Submit training
- [ ] Verify job created in database
- [ ] Check n8n execution logs
- [ ] Wait for completion
- [ ] View model results

#### 4. Test Predictions

- [ ] Navigate to model detail
- [ ] Click "Make Predictions"
- [ ] Test batch prediction (upload CSV)
- [ ] Test manual prediction (enter values)
- [ ] Download predictions CSV

### Automated Testing Script

Create `test.sh`:

```bash
#!/bin/bash

echo "Testing ML Insights Platform..."

# Test frontend
echo "1. Testing frontend..."
curl -I https://ml-insights.smartcamp.ai | grep "200 OK"

# Test Supabase connection
echo "2. Testing database..."
psql $DATABASE_URL -c "SELECT COUNT(*) FROM public.profiles;"

# Test Storage
echo "3. Testing storage..."
curl -I "https://api.supabase.smartcamp.ai/storage/v1/bucket/datasets" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY"

# Test n8n webhook
echo "4. Testing n8n webhook..."
curl -X POST "https://n8n.smartcamp.ai/webhook/ml-training" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

echo "✅ All tests passed!"
```

Run: `bash test.sh`

---

## Production Checklist

### Security

- [ ] All environment variables set correctly
- [ ] Service role key is secret (not in client code)
- [ ] RLS enabled on all tables
- [ ] Storage policies configured
- [ ] HTTPS enabled everywhere
- [ ] CORS configured properly
- [ ] Rate limiting enabled

### Performance

- [ ] Next.js build optimized
- [ ] Images optimized
- [ ] Database indexes created
- [ ] Connection pooling enabled
- [ ] CDN configured (Vercel Edge)

### Monitoring

- [ ] Error tracking (optional: Sentry)
- [ ] Performance monitoring
- [ ] Database query monitoring
- [ ] Storage usage tracking
- [ ] n8n execution logs reviewed

### Backup & Recovery

- [ ] Database backup schedule (VPS: every 3 days)
- [ ] Storage backup plan
- [ ] Disaster recovery documented
- [ ] Rollback plan prepared

### Documentation

- [ ] README updated
- [ ] Environment variables documented
- [ ] API endpoints documented
- [ ] User guide created

---

## Troubleshooting

### Common Issues

#### Issue: "Unauthorized" error when uploading

**Solution:**
- Check NEXT_PUBLIC_SUPABASE_ANON_KEY is set
- Verify user is logged in
- Check browser console for errors

#### Issue: Training job stuck at "pending"

**Solution:**
1. Check n8n is running: `systemctl status n8n`
2. Verify webhook URL in .env
3. Check n8n execution logs
4. Manually trigger workflow in n8n

#### Issue: Cannot read dataset preview

**Solution:**
- Check storage bucket exists
- Verify RLS policies allow read
- Check file was uploaded correctly
- Try downloading file manually

#### Issue: Model training fails immediately

**Solution:**
1. Check Python script logs
2. Verify dependencies installed
3. Test script manually with test data
4. Check file permissions on VPS

#### Issue: Predictions return errors

**Solution:**
- Verify model file exists in storage
- Check feature columns match
- Validate input data format
- Review API logs

### Logs & Debugging

#### Frontend Logs (Vercel)
```
Visit: vercel.com → Project → Deployments → [Latest] → Logs
```

#### Backend Logs (VPS)
```bash
# n8n logs
docker logs n8n_n8n_1

# Python script logs
# Add to training script:
import logging
logging.basicConfig(filename='/tmp/ml_training.log')
```

#### Database Logs
```sql
-- Recent errors
SELECT * FROM pg_stat_activity WHERE state = 'idle in transaction';

-- Slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

### Support

- **Documentation:** See README.md and other guides
- **Issues:** Create GitHub issue
- **Email:** support@smartcamp.ai

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error logs
- Check training job completion rates

**Weekly:**
- Review storage usage
- Check database performance
- Update dependencies if needed

**Monthly:**
- Review and rotate logs
- Backup verification
- Security audit

### Updates

**Updating Frontend:**
```bash
git pull origin main
npm install
npm run build
# Push to trigger Vercel deployment
```

**Updating Backend:**
```bash
ssh user@smartcamp.ai
cd /home/user/ml-insights-backend
git pull origin main
pip3 install -r requirements.txt --upgrade
```

**Updating Database:**
```bash
# Create new migration
# supabase/migrations/002_new_changes.sql
psql $DATABASE_URL < supabase/migrations/002_new_changes.sql
```

---

## Performance Optimization

### Frontend

- Enable Vercel Edge Caching
- Use Image optimization
- Implement lazy loading
- Enable compression

### Backend

- Use connection pooling
- Cache frequent queries
- Optimize Python scripts
- Use async processing

### Database

- Add indexes for frequently queried columns
- Vacuum regularly
- Monitor query performance
- Optimize RLS policies

---

## Scaling Considerations

### When to Scale

- **Frontend:** Vercel auto-scales
- **Database:** Monitor connection pool usage
- **Training:** When >5 concurrent jobs
- **Storage:** When approaching disk limits

### Scaling Options

1. **Vertical Scaling (VPS)**
   - Upgrade to 16GB RAM
   - Add more CPU cores

2. **Horizontal Scaling**
   - Multiple training workers
   - Load balancer for API
   - Read replicas for database

3. **Service Migration**
   - Migrate to dedicated ML infrastructure
   - Use cloud GPU for training
   - Distributed storage (S3, GCS)

---

## Success Metrics

Track these metrics post-deployment:

- **Uptime:** Target 99.5%
- **Training Success Rate:** Target >95%
- **Average Training Time:** <5 minutes
- **API Response Time:** <500ms
- **User Satisfaction:** NPS >40

---

## Next Steps After Deployment

1. [ ] Monitor first 24 hours closely
2. [ ] Collect user feedback
3. [ ] Iterate on UI/UX
4. [ ] Add new algorithms
5. [ ] Implement advanced features
6. [ ] Scale as needed

---

**Deployment Checklist Complete!** 🎉

Your ML Insights Platform is now live and ready to train models!

**Production URL:** https://ml-insights.smartcamp.ai

**Need Help?** Refer to troubleshooting section or create a GitHub issue.

---

*Last Updated: 2025-11-17*
*Version: 1.0.0*
