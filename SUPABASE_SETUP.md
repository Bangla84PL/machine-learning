# Supabase Setup Guide

This document outlines the steps to set up Supabase for the ML Insights Platform.

## Prerequisites

- Access to SmartCamp.AI VPS Supabase instance
- Supabase URL: `https://api.supabase.smartcamp.ai`
- Database connection: `postgresql://postgres:40ff78fadfcd119c14d1d5818107d1aa@db:5432/postgres`

## Database Schema Setup

### Step 1: Run Migration SQL

Execute the SQL migration file to create all necessary tables, indexes, and RLS policies:

```bash
# Option 1: Using Supabase CLI (if available)
supabase db push

# Option 2: Using psql
psql postgresql://postgres:40ff78fadfcd119c14d1d5818107d1aa@db:5432/postgres < supabase/migrations/001_initial_schema.sql

# Option 3: Via Supabase Dashboard
# 1. Navigate to SQL Editor in Supabase Dashboard
# 2. Copy contents of supabase/migrations/001_initial_schema.sql
# 3. Paste and execute
```

### Step 2: Create Storage Buckets

Create three storage buckets for file management:

#### 1. Datasets Bucket

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('datasets', 'datasets', false);
```

**Storage Policy:**

```sql
-- Allow authenticated users to upload datasets
CREATE POLICY "Users can upload own datasets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to read own datasets
CREATE POLICY "Users can read own datasets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete own datasets
CREATE POLICY "Users can delete own datasets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### 2. Models Bucket

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('models', 'models', false);
```

**Storage Policy:**

```sql
-- Allow authenticated users to upload models
CREATE POLICY "Users can upload own models"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'models' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to read own models
CREATE POLICY "Users can read own models"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'models' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete own models
CREATE POLICY "Users can delete own models"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'models' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### 3. Predictions Bucket

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('predictions', 'predictions', false);
```

**Storage Policy:**

```sql
-- Allow authenticated users to upload predictions
CREATE POLICY "Users can upload own predictions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'predictions' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to read own predictions
CREATE POLICY "Users can read own predictions"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'predictions' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete own predictions
CREATE POLICY "Users can delete own predictions"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'predictions' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Step 3: Configure Authentication

1. **Email/Password Authentication**
   - Enable in Supabase Dashboard → Authentication → Providers
   - Configure email templates for verification and password reset

2. **Email Verification**
   - Enable "Email Confirmations" in Authentication settings
   - Customize email templates with SmartCamp.AI branding

3. **Security Settings**
   - Set password minimum length: 8 characters
   - Enable password strength requirements
   - Configure JWT expiry (default: 3600 seconds)

## Environment Variables

Create `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://api.supabase.smartcamp.ai
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# n8n Configuration
N8N_WEBHOOK_URL=https://n8n.smartcamp.ai/webhook/ml-training
N8N_API_KEY=your-n8n-api-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=https://ml-insights.smartcamp.ai
```

### Getting API Keys

1. Navigate to Supabase Dashboard → Project Settings → API
2. Copy the following keys:
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

## Database Schema Overview

### Tables

1. **profiles** - User profile information
2. **datasets** - Uploaded CSV datasets
3. **models** - Trained ML models
4. **training_jobs** - Background training job status
5. **predictions** - Prediction history

### Relationships

- `profiles` ← `datasets` (one-to-many)
- `profiles` ← `models` (one-to-many)
- `datasets` ← `models` (one-to-many)
- `models` ← `predictions` (one-to-many)
- `datasets` ← `training_jobs` (one-to-many)

## Row Level Security (RLS)

All tables have RLS enabled. Users can only:
- View their own data
- Insert data associated with their user ID
- Update their own data
- Delete their own data

## Testing the Setup

### Test Database Connection

```javascript
import { supabase } from '@/lib/supabase'

async function testConnection() {
  const { data, error } = await supabase.from('profiles').select('count')
  if (error) {
    console.error('Connection error:', error)
  } else {
    console.log('Connection successful!')
  }
}
```

### Test Authentication

```javascript
import { supabase } from '@/lib/supabase'

async function testAuth() {
  // Sign up
  const { data, error } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'testpassword123',
  })

  if (error) {
    console.error('Auth error:', error)
  } else {
    console.log('User created:', data.user)
  }
}
```

### Test Storage

```javascript
import { supabase } from '@/lib/supabase'

async function testStorage() {
  const file = new File(['test'], 'test.csv', { type: 'text/csv' })
  const userId = 'user-id-here'
  const filePath = `${userId}/test.csv`

  const { data, error } = await supabase.storage
    .from('datasets')
    .upload(filePath, file)

  if (error) {
    console.error('Storage error:', error)
  } else {
    console.log('File uploaded:', data)
  }
}
```

## Maintenance

### Backups

Supabase on SmartCamp.AI VPS is backed up every 3 days as part of the VPS backup system.

### Monitoring

Monitor database performance via Supabase Dashboard:
- Database → Performance
- Check slow queries
- Monitor connection pool usage

### Scaling Considerations

Current VPS has 8GB RAM. For scaling:
- Monitor concurrent connections
- Consider read replicas for heavy read operations
- Optimize queries with proper indexes (already created)

## Troubleshooting

### Common Issues

**Issue: RLS policy blocks query**
- Solution: Ensure user is authenticated and auth.uid() matches user_id

**Issue: Storage upload fails**
- Solution: Check bucket exists and RLS policies are configured

**Issue: Cannot connect to database**
- Solution: Verify environment variables and VPS accessibility

## Next Steps

1. ✅ Run database migration
2. ✅ Create storage buckets and policies
3. ✅ Configure authentication settings
4. ✅ Set up environment variables
5. Test all database operations
6. Deploy application to Vercel

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Documentation](https://supabase.com/docs/guides/storage)
