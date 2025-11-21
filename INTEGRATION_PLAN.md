# Plan Integracji Nowych Serwisów - ML Insights Platform

## Spis Treści

1. [Przegląd Integracji](#przegląd-integracji)
2. [Upstash Redis](#upstash-redis)
3. [PostHog Analytics](#posthog-analytics)
4. [Sentry Error Tracking](#sentry-error-tracking)
5. [Stripe Payments](#stripe-payments)
6. [Loops Email Marketing](#loops-email-marketing)
7. [Harmonogram Wdrożenia](#harmonogram-wdrożenia)
8. [Szacowane Koszty](#szacowane-koszty)

---

## Przegląd Integracji

### Cel Integracji

Rozszerzenie platformy ML Insights o profesjonalne narzędzia do:
- **Cachingu i sesji** (Upstash Redis)
- **Analizy użytkowników** (PostHog)
- **Monitoringu błędów** (Sentry)
- **Płatności** (Stripe)
- **Komunikacji email** (Loops)

### Architektura po Integracji

```
┌─────────────────────────────────────────────────────────────────┐
│                    ML Insights Platform v2.0                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────┐    ┌──────────────┐    ┌─────────────┐        │
│  │  Next.js   │───►│   Supabase   │    │   Upstash   │        │
│  │  Frontend  │    │ (PostgreSQL) │◄──►│    Redis    │        │
│  └─────┬──────┘    └──────────────┘    └─────────────┘        │
│        │                                                         │
│        ├──────────────┬─────────────┬──────────────┐           │
│        ▼              ▼             ▼              ▼           │
│   ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐       │
│   │PostHog │    │ Sentry │    │ Stripe │    │ Loops  │       │
│   │Analytics│   │ Errors │    │Payments│    │ Email  │       │
│   └────────┘    └────────┘    └────────┘    └────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Priorytety

| Priorytet | Serwis | Powód |
|-----------|--------|-------|
| 🔴 Wysoki | Sentry | Krytyczny dla stabilności produkcyjnej |
| 🔴 Wysoki | Upstash Redis | Poprawa wydajności i obsługa sesji |
| 🟡 Średni | PostHog | Zrozumienie zachowań użytkowników |
| 🟢 Niski | Stripe | Potrzebny po osiągnięciu Product-Market Fit |
| 🟢 Niski | Loops | Potrzebny po wzroście bazy użytkowników |

---

## Upstash Redis

### Zastosowanie

1. **Session Storage** - Szybkie sesje użytkowników (alternatywa dla JWT)
2. **Caching** - Cache wyników API, metadanych datasetu
3. **Rate Limiting** - Ochrona przed nadużyciami API
4. **Job Queue Metadata** - Szybki dostęp do statusu zadań treningowych
5. **Real-time Updates** - Pub/Sub dla live progress updates

### Konfiguracja

#### Krok 1: Utworzenie Konta Upstash

1. Zarejestruj się na https://upstash.com
2. Utwórz nową bazę Redis:
   - **Name:** ml-insights-production
   - **Type:** Regional (wybierz region najbliżej użytkowników)
   - **Tier:** Free tier wystarczy na start (10,000 requests/day)

#### Krok 2: Dodanie Zmiennych Środowiskowych

```bash
# .env.local
UPSTASH_REDIS_REST_URL=https://<your-instance>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<your-token>
```

#### Krok 3: Instalacja Dependencies

```bash
npm install @upstash/redis
```

#### Krok 4: Utworzenie Redis Client

**Utwórz `src/lib/redis.ts`:**

```typescript
import { Redis } from '@upstash/redis';

// Redis client configuration
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache utilities
export const cache = {
  // Get cached data
  async get<T>(key: string): Promise<T | null> {
    return await redis.get<T>(key);
  },

  // Set cached data with TTL (seconds)
  async set(key: string, value: any, ttl: number = 3600) {
    return await redis.setex(key, ttl, JSON.stringify(value));
  },

  // Delete cached data
  async del(key: string) {
    return await redis.del(key);
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    return (await redis.exists(key)) === 1;
  },
};

// Rate limiting
export const rateLimit = {
  async check(identifier: string, limit: number, window: number): Promise<boolean> {
    const key = `ratelimit:${identifier}`;
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, window);
    }

    return current <= limit;
  },
};
```

### Przypadki Użycia

#### 1. Caching Metadanych Datasetu

```typescript
// src/app/api/datasets/[id]/route.ts
import { cache } from '@/lib/redis';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const cacheKey = `dataset:${params.id}`;

  // Try cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    return Response.json(cached);
  }

  // Fetch from database
  const { data, error } = await supabase
    .from('datasets')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) throw error;

  // Cache for 1 hour
  await cache.set(cacheKey, data, 3600);

  return Response.json(data);
}
```

#### 2. Rate Limiting API Endpoints

```typescript
// src/middleware.ts (utwórz nowy plik)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from '@/lib/redis';

export async function middleware(request: NextRequest) {
  // Rate limit by IP
  const ip = request.ip ?? 'unknown';
  const identifier = `${ip}:${request.nextUrl.pathname}`;

  // 100 requests per 15 minutes
  const allowed = await rateLimit.check(identifier, 100, 900);

  if (!allowed) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

#### 3. Real-time Training Progress

```typescript
// src/lib/training-progress.ts
import { redis } from '@/lib/redis';

export const trainingProgress = {
  async update(jobId: string, progress: number, message: string) {
    await redis.hset(`training:${jobId}`, {
      progress,
      message,
      updated_at: Date.now(),
    });

    // Publish to subscribers
    await redis.publish(`training:${jobId}`, JSON.stringify({ progress, message }));
  },

  async get(jobId: string) {
    return await redis.hgetall(`training:${jobId}`);
  },

  async subscribe(jobId: string, callback: (data: any) => void) {
    // Wymaga Redis client z wsparciem dla Pub/Sub
    // Alternatywnie: polling co 2s
  },
};
```

### Szacowane Koszty

- **Free Tier:** $0 (10K requests/day, 256MB storage)
- **Pay-as-you-go:** ~$0.20 per 100K requests
- **Przewidywane:** $0-5/miesiąc na start

---

## PostHog Analytics

### Zastosowanie

1. **Product Analytics** - Śledzenie user flow, feature adoption
2. **Session Recording** - Replay sesji użytkowników (debug UX)
3. **Feature Flags** - A/B testing, gradual rollouts
4. **Funnels** - Analiza konwersji (signup → upload → train → predict)
5. **Cohort Analysis** - Segmentacja użytkowników

### Konfiguracja

#### Krok 1: Utworzenie Konta PostHog

1. Zarejestruj się na https://posthog.com
2. Utwórz nowy projekt: **ML Insights Platform**
3. Zapisz **Project API Key**

#### Krok 2: Instalacja SDK

```bash
npm install posthog-js posthog-node
```

#### Krok 3: Konfiguracja Frontend

**Utwórz `src/lib/posthog.ts`:**

```typescript
import posthog from 'posthog-js';

// Initialize PostHog (client-side only)
export const initPostHog = () => {
  if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') posthog.debug();
      },
      capture_pageview: false, // Disable automatic pageview (Next.js handles routing)
    });
  }
};

export { posthog };
```

**Dodaj do `src/app/layout.tsx`:**

```typescript
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initPostHog, posthog } from '@/lib/posthog';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    if (pathname) {
      posthog.capture('$pageview', {
        $current_url: pathname + (searchParams?.toString() ? `?${searchParams}` : ''),
      });
    }
  }, [pathname, searchParams]);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

#### Krok 4: Śledzenie Zdarzeń

**Przykładowe eventy:**

```typescript
// Po zalogowaniu użytkownika
posthog.identify(user.id, {
  email: user.email,
  name: user.name,
  created_at: user.created_at,
});

// Upload datasetu
posthog.capture('dataset_uploaded', {
  filename: file.name,
  size_mb: file.size / 1024 / 1024,
  row_count: dataset.row_count,
  column_count: dataset.column_count,
});

// Rozpoczęcie trenowania
posthog.capture('training_started', {
  algorithm: config.algorithm,
  problem_type: config.problem_type,
  dataset_size: dataset.row_count,
});

// Ukończenie trenowania
posthog.capture('training_completed', {
  duration_seconds: training.duration,
  accuracy: model.metrics.accuracy,
  algorithm: model.algorithm,
});

// Predykcja
posthog.capture('prediction_made', {
  model_id: model.id,
  batch: inputFile ? true : false,
  prediction_count: result.count,
});
```

### Dashboardy PostHog

**Kluczowe Metryki:**

1. **Acquisition Funnel:**
   - Landing page view → Signup → Email verification → First login

2. **Activation Funnel:**
   - First login → Dataset uploaded → First training → First prediction

3. **Engagement:**
   - DAU/WAU/MAU
   - Average datasets per user
   - Average trainings per week

4. **Retention:**
   - Day 1, 7, 30 retention
   - Cohort retention curves

5. **Feature Adoption:**
   - % users using each algorithm
   - % users doing batch predictions vs manual

### Szacowane Koszty

- **Free Tier:** 1M events/month (wystarczy na start)
- **Paid:** $0.00025/event po przekroczeniu limitu
- **Przewidywane:** $0-20/miesiąc w pierwszym roku

---

## Sentry Error Tracking

### Zastosowanie

1. **Error Monitoring** - Automatyczne wyłapywanie błędów frontend/backend
2. **Performance Monitoring** - Śledzenie wolnych API calls
3. **Release Tracking** - Korelacja błędów z deploymentami
4. **User Context** - Zrozumienie impact błędów na użytkowników
5. **Alerts** - Powiadomienia o critical errors

### Konfiguracja

#### Krok 1: Utworzenie Projektu Sentry

1. Zarejestruj się na https://sentry.io
2. Utwórz nowy projekt:
   - **Platform:** Next.js
   - **Name:** ML Insights Platform
3. Zapisz **DSN** (Data Source Name)

#### Krok 2: Instalacja Sentry Wizard

```bash
npx @sentry/wizard@latest -i nextjs
```

Wizard automatycznie:
- Zainstaluje dependencies
- Utworzy pliki konfiguracyjne
- Doda environment variables

#### Krok 3: Konfiguracja

**`.env.local`:**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://<key>@o<org>.ingest.sentry.io/<project>
SENTRY_AUTH_TOKEN=<auth-token>
SENTRY_ORG=<your-org>
SENTRY_PROJECT=ml-insights-platform
```

**`sentry.client.config.ts` (utworzone przez wizard):**

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 1.0, // 100% w dev, 0.1 (10%) w prod

  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% sesji
  replaysOnErrorSampleRate: 1.0, // 100% sesji z błędami

  environment: process.env.NODE_ENV,

  // Ignore common non-critical errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],

  beforeSend(event, hint) {
    // Filtruj wrażliwe dane
    if (event.request?.headers) {
      delete event.request.headers['Authorization'];
      delete event.request.headers['Cookie'];
    }
    return event;
  },
});
```

**`sentry.server.config.ts`:**

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

#### Krok 4: Custom Context

**Dodaj user context przy logowaniu:**

```typescript
// src/lib/auth-context.tsx
import * as Sentry from '@sentry/nextjs';

useEffect(() => {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    });
  } else {
    Sentry.setUser(null);
  }
}, [user]);
```

**Dodaj custom tags:**

```typescript
// src/app/api/train/route.ts
import * as Sentry from '@sentry/nextjs';

export async function POST(req: Request) {
  const transaction = Sentry.startTransaction({
    op: 'ml.training',
    name: 'Train Model',
  });

  Sentry.setTag('algorithm', algorithm);
  Sentry.setTag('problem_type', problemType);

  try {
    // Training logic...
  } catch (error) {
    Sentry.captureException(error, {
      contexts: {
        training: {
          dataset_id: datasetId,
          algorithm,
          hyperparameters,
        },
      },
    });
    throw error;
  } finally {
    transaction.finish();
  }
}
```

#### Krok 5: Performance Monitoring

**Śledzenie wolnych queries:**

```typescript
// src/lib/supabase.ts
import * as Sentry from '@sentry/nextjs';

export async function queryWithMonitoring<T>(
  queryFn: () => Promise<T>,
  operation: string
): Promise<T> {
  const span = Sentry.startSpan({
    op: 'db.query',
    description: operation,
  });

  try {
    return await queryFn();
  } finally {
    span?.finish();
  }
}

// Usage:
const data = await queryWithMonitoring(
  () => supabase.from('datasets').select('*'),
  'fetch_all_datasets'
);
```

### Alerts & Notifications

**Konfiguracja w Sentry Dashboard:**

1. **Critical Errors:** Slack/Email gdy error rate > 10/min
2. **Performance Degradation:** Alert gdy p95 > 2s
3. **New Issues:** Powiadomienie o nowych typach błędów
4. **Release Health:** Alert gdy crash-free rate < 99%

### Szacowane Koszty

- **Free Tier:** 5K errors + 10K transactions/month
- **Team Plan:** $26/miesiąc (50K errors, 100K transactions)
- **Przewidywane:** $0-26/miesiąc

---

## Stripe Payments

### Zastosowanie

1. **Subscription Management** - Plany Pro/Enterprise
2. **One-time Payments** - Credit packs dla compute
3. **Usage-based Billing** - Pay-per-training/prediction
4. **Customer Portal** - Self-service subscription management
5. **Invoicing** - Automated billing dla enterprise

### Model Cenowy (Propozycja)

| Plan | Cena | Limity |
|------|------|--------|
| **Free** | $0 | 5 datasets, 10 trainings/miesiąc, 100 predictions/miesiąc |
| **Pro** | $29/miesiąc | Unlimited datasets, 100 trainings/miesiąc, 5K predictions/miesiąc |
| **Enterprise** | Custom | Unlimited wszystko + dedicated support |

**Usage-based Add-ons:**
- Extra trainings: $0.50/training
- Extra predictions: $0.01/100 predictions

### Konfiguracja

#### Krok 1: Utworzenie Konta Stripe

1. Zarejestruj się na https://stripe.com
2. Aktywuj konto (wymaga weryfikacji biznesowej)
3. Zapisz klucze API (Developers > API keys)

#### Krok 2: Instalacja Dependencies

```bash
npm install stripe @stripe/stripe-js
```

#### Krok 3: Konfiguracja Stripe Client

**Utwórz `src/lib/stripe.ts`:**

```typescript
import Stripe from 'stripe';

// Server-side Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

// Client-side (for frontend)
import { loadStripe } from '@stripe/stripe-js';

export const getStripePromise = () =>
  loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
```

#### Krok 4: Utworzenie Produktów i Cenników

**W Stripe Dashboard lub przez API:**

```typescript
// scripts/create-products.ts
import { stripe } from '@/lib/stripe';

async function createProducts() {
  // Free Plan (for reference only)
  const freePlan = await stripe.products.create({
    name: 'Free Plan',
    description: '5 datasets, 10 trainings/month, 100 predictions/month',
  });

  // Pro Plan
  const proPlan = await stripe.products.create({
    name: 'Pro Plan',
    description: 'Unlimited datasets, 100 trainings/month, 5K predictions/month',
  });

  const proPrice = await stripe.prices.create({
    product: proPlan.id,
    unit_amount: 2900, // $29.00
    currency: 'usd',
    recurring: { interval: 'month' },
  });

  console.log('Pro Plan Price ID:', proPrice.id);
}
```

#### Krok 5: Checkout Flow

**Utwórz API endpoint `src/app/api/checkout/route.ts`:**

```typescript
import { stripe } from '@/lib/stripe';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req: Request) {
  const { priceId, userId } = await req.json();

  // Verify user
  const supabase = getServiceSupabase();
  const { data: user } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single();

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    metadata: {
      userId,
    },
  });

  return Response.json({ url: session.url });
}
```

**Frontend component:**

```typescript
// src/components/UpgradeButton.tsx
'use client';

import { useState } from 'react';
import { getStripePromise } from '@/lib/stripe';

export function UpgradeButton({ priceId }: { priceId: string }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);

    const response = await fetch('/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ priceId, userId: user.id }),
    });

    const { url } = await response.json();
    window.location.href = url;
  };

  return (
    <button onClick={handleUpgrade} disabled={loading}>
      {loading ? 'Loading...' : 'Upgrade to Pro'}
    </button>
  );
}
```

#### Krok 6: Webhooks (Krytyczne!)

**Endpoint `src/app/api/webhooks/stripe/route.ts`:**

```typescript
import { stripe } from '@/lib/stripe';
import { getServiceSupabase } from '@/lib/supabase';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  const supabase = getServiceSupabase();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      // Update user subscription
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_id: session.subscription,
          plan: 'pro',
        })
        .eq('id', session.metadata!.userId);

      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;

      await supabase
        .from('profiles')
        .update({
          subscription_status: subscription.status,
        })
        .eq('subscription_id', subscription.id);

      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;

      await supabase
        .from('profiles')
        .update({
          subscription_status: 'canceled',
          plan: 'free',
        })
        .eq('subscription_id', subscription.id);

      break;
    }
  }

  return Response.json({ received: true });
}
```

**Konfiguracja webhook w Stripe:**
1. Developers > Webhooks > Add endpoint
2. URL: `https://ml-insights.smartcamp.ai/api/webhooks/stripe`
3. Events: `checkout.session.completed`, `customer.subscription.*`

#### Krok 7: Rozszerz Schema Bazy

**Dodaj do tabeli `profiles`:**

```sql
ALTER TABLE public.profiles
ADD COLUMN plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
ADD COLUMN subscription_id TEXT,
ADD COLUMN subscription_status TEXT,
ADD COLUMN stripe_customer_id TEXT;

-- Limits enforcement
CREATE TABLE public.usage_limits (
  user_id UUID REFERENCES public.profiles(id) PRIMARY KEY,
  datasets_count INTEGER DEFAULT 0,
  trainings_this_month INTEGER DEFAULT 0,
  predictions_this_month INTEGER DEFAULT 0,
  month_year TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM'),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Krok 8: Middleware do Sprawdzania Limitów

```typescript
// src/lib/usage-limits.ts
import { getServiceSupabase } from '@/lib/supabase';

const LIMITS = {
  free: {
    datasets: 5,
    trainings: 10,
    predictions: 100,
  },
  pro: {
    datasets: Infinity,
    trainings: 100,
    predictions: 5000,
  },
  enterprise: {
    datasets: Infinity,
    trainings: Infinity,
    predictions: Infinity,
  },
};

export async function checkLimit(
  userId: string,
  resource: 'datasets' | 'trainings' | 'predictions'
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = getServiceSupabase();

  // Get user plan
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single();

  const plan = profile?.plan || 'free';
  const limit = LIMITS[plan][resource];

  if (limit === Infinity) {
    return { allowed: true, remaining: Infinity };
  }

  // Get current usage
  const { data: usage } = await supabase
    .from('usage_limits')
    .select(`${resource}_count`)
    .eq('user_id', userId)
    .single();

  const current = usage?.[`${resource}_count`] || 0;
  const allowed = current < limit;
  const remaining = Math.max(0, limit - current);

  return { allowed, remaining };
}

export async function incrementUsage(
  userId: string,
  resource: 'datasets' | 'trainings' | 'predictions',
  amount: number = 1
) {
  const supabase = getServiceSupabase();

  await supabase.rpc('increment_usage', {
    p_user_id: userId,
    p_resource: resource,
    p_amount: amount,
  });
}
```

**SQL function:**

```sql
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_resource TEXT,
  p_amount INTEGER
)
RETURNS VOID AS $$
DECLARE
  current_month TEXT := TO_CHAR(NOW(), 'YYYY-MM');
BEGIN
  INSERT INTO usage_limits (user_id, month_year)
  VALUES (p_user_id, current_month)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE usage_limits
  SET
    datasets_count = CASE WHEN p_resource = 'datasets' THEN datasets_count + p_amount ELSE datasets_count END,
    trainings_this_month = CASE WHEN p_resource = 'trainings' THEN trainings_this_month + p_amount ELSE trainings_this_month END,
    predictions_this_month = CASE WHEN p_resource = 'predictions' THEN predictions_this_month + p_amount ELSE predictions_this_month END,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;
```

### Customer Portal

**Stripe Customer Portal** pozwala użytkownikom:
- Anulować/wznowić subskrypcję
- Zmienić plan
- Zaktualizować metodę płatności
- Pobrać faktury

**Konfiguracja:**
1. Stripe Dashboard > Settings > Customer Portal
2. Włącz self-service
3. Dostosuj branding

**Link do portalu:**

```typescript
// src/app/api/customer-portal/route.ts
export async function POST(req: Request) {
  const { userId } = await req.json();

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  return Response.json({ url: session.url });
}
```

### Szacowane Koszty

- **Stripe Fees:** 2.9% + $0.30 per transaction
- **Przykład:** $29 plan → $1.17 fee → $27.83 netto
- **Przewidywane opłaty:** Zależne od przychodów

---

## Loops Email Marketing

### Zastosowanie

1. **Transactional Emails** - Powitalne, potwierdzenia, statusy treningów
2. **Onboarding Sequences** - Automatyczne serie emaili dla nowych użytkowników
3. **Product Updates** - Newsletter z nowymi funkcjami
4. **Re-engagement** - Przypomnienia dla nieaktywnych użytkowników
5. **Usage Alerts** - Powiadomienia o zbliżających się limitach

### Konfiguracja

#### Krok 1: Utworzenie Konta Loops

1. Zarejestruj się na https://loops.so
2. Zweryfikuj domenę email (np. ml-insights.smartcamp.ai)
3. Zapisz API Key (Settings > API)

#### Krok 2: Instalacja

Loops używa prostego REST API - nie wymaga SDK.

**Utwórz `src/lib/loops.ts`:**

```typescript
const LOOPS_API_KEY = process.env.LOOPS_API_KEY;
const LOOPS_API_URL = 'https://app.loops.so/api/v1';

export const loops = {
  async sendTransactional(
    email: string,
    transactionalId: string,
    dataVariables: Record<string, any>
  ) {
    const response = await fetch(`${LOOPS_API_URL}/transactional`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOOPS_API_KEY}`,
      },
      body: JSON.stringify({
        email,
        transactionalId,
        dataVariables,
      }),
    });

    return await response.json();
  },

  async createContact(email: string, properties: Record<string, any> = {}) {
    const response = await fetch(`${LOOPS_API_URL}/contacts/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOOPS_API_KEY}`,
      },
      body: JSON.stringify({
        email,
        ...properties,
      }),
    });

    return await response.json();
  },

  async updateContact(email: string, properties: Record<string, any>) {
    const response = await fetch(`${LOOPS_API_URL}/contacts/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOOPS_API_KEY}`,
      },
      body: JSON.stringify({
        email,
        ...properties,
      }),
    });

    return await response.json();
  },

  async sendEvent(email: string, eventName: string, eventProperties: Record<string, any> = {}) {
    const response = await fetch(`${LOOPS_API_URL}/events/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOOPS_API_KEY}`,
      },
      body: JSON.stringify({
        email,
        eventName,
        eventProperties,
      }),
    });

    return await response.json();
  },
};
```

#### Krok 3: Email Templates w Loops

**Utwórz następujące transactional emails:**

1. **welcome** - Powitanie nowego użytkownika
2. **training_complete** - Model wytrenowany
3. **training_failed** - Błąd podczas trenowania
4. **limit_warning** - 80% limitu wykorzystane
5. **subscription_confirmed** - Potwierdzenie płatności

**Przykład template (welcome):**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Welcome to ML Insights Platform</title>
</head>
<body style="font-family: 'Jost', sans-serif; background: linear-gradient(to bottom, #065f46, #064e3b); color: white;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px;">
    <h1>Welcome, {{name}}! 🎉</h1>

    <p>We're excited to have you on ML Insights Platform.</p>

    <p>Here's what you can do next:</p>
    <ul>
      <li>Upload your first dataset</li>
      <li>Train a machine learning model</li>
      <li>Make predictions</li>
    </ul>

    <a href="{{dashboard_url}}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">
      Go to Dashboard
    </a>

    <p style="margin-top: 40px; font-size: 14px; color: #d1d5db;">
      If you have any questions, reply to this email or visit our <a href="{{docs_url}}" style="color: #10b981;">documentation</a>.
    </p>
  </div>
</body>
</html>
```

#### Krok 4: Integracja z Aplikacją

**Przykład 1: Wysłanie welcome email po rejestracji:**

```typescript
// src/app/api/auth/signup/route.ts
import { loops } from '@/lib/loops';

export async function POST(req: Request) {
  // ... logika rejestracji ...

  // Utwórz kontakt w Loops
  await loops.createContact(email, {
    firstName: name,
    signupDate: new Date().toISOString(),
    plan: 'free',
  });

  // Wyślij welcome email
  await loops.sendTransactional(email, 'welcome', {
    name,
    dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    docs_url: `${process.env.NEXT_PUBLIC_APP_URL}/docs`,
  });

  return Response.json({ success: true });
}
```

**Przykład 2: Powiadomienie o zakończeniu trenowania:**

```typescript
// Python ml_trainer.py (po zakończeniu)
import requests
import os

def send_training_complete_email(user_email, model_name, accuracy):
    requests.post(
        f"{os.getenv('NEXT_PUBLIC_APP_URL')}/api/emails/training-complete",
        json={
            'email': user_email,
            'model_name': model_name,
            'accuracy': accuracy,
        }
    )

# W Next.js API:
// src/app/api/emails/training-complete/route.ts
export async function POST(req: Request) {
  const { email, model_name, accuracy } = await req.json();

  await loops.sendTransactional(email, 'training_complete', {
    model_name,
    accuracy: (accuracy * 100).toFixed(2),
    view_model_url: `${process.env.NEXT_PUBLIC_APP_URL}/models/${modelId}`,
  });

  return Response.json({ sent: true });
}
```

**Przykład 3: Limit warning:**

```typescript
// Wywołanie przy zbliżaniu się do limitu
if (usage.trainings_this_month >= 8 && user.plan === 'free') {
  await loops.sendTransactional(user.email, 'limit_warning', {
    resource: 'trainings',
    current: usage.trainings_this_month,
    limit: 10,
    upgrade_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
  });
}
```

#### Krok 5: Onboarding Email Sequence

**W Loops Dashboard, utwórz Loop (automated sequence):**

**"New User Onboarding" Loop:**

1. **Day 0:** Welcome email (immediately after signup)
2. **Day 1:** "How to upload your first dataset" (jeśli nie uploadował)
3. **Day 3:** "Train your first model - step by step" (jeśli nie trenował)
4. **Day 7:** "Tips for better model accuracy"
5. **Day 14:** "See what others are building with ML Insights"

**Trigger:** Contact created with `signupDate` property

**Exit conditions:**
- User upgrades to Pro (property: `plan = 'pro'`)
- User completes training (event: `training_completed`)

#### Krok 6: Product Updates Newsletter

**Zbieranie subscribers:**

```typescript
// src/components/NewsletterSignup.tsx
'use client';

import { useState } from 'react';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    setSubscribed(true);
  };

  return (
    <form onSubmit={handleSubscribe}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
      />
      <button type="submit">
        {subscribed ? 'Subscribed! ✓' : 'Subscribe to Updates'}
      </button>
    </form>
  );
}

// API endpoint
// src/app/api/newsletter/subscribe/route.ts
export async function POST(req: Request) {
  const { email } = await req.json();

  await loops.createContact(email, {
    newsletter: true,
    subscribed_at: new Date().toISOString(),
  });

  return Response.json({ success: true });
}
```

### Szacowane Koszty

- **Free Tier:** 2,000 contacts (wystarczy na start)
- **Paid:** $30/miesiąc dla 10K contacts
- **Przewidywane:** $0-30/miesiąc w pierwszym roku

---

## Harmonogram Wdrożenia

### Faza 1: Foundation (Tydzień 1-2) - PRIORYTET

**Cel:** Stabilność i monitorowanie

- [ ] **Sentry** - Error tracking (2 dni)
  - Instalacja i konfiguracja
  - Custom error boundaries
  - Performance monitoring setup
  - Alert rules

- [ ] **Upstash Redis** - Caching & Rate Limiting (3 dni)
  - Account setup
  - Redis client konfiguracja
  - Rate limiting middleware
  - Cache dla często używanych queries
  - Testing

**Deliverables:**
- Błędy automatycznie trackowane w Sentry
- API chronione rate limitingiem
- Szybsze ładowanie dzięki cachingowi

### Faza 2: Analytics (Tydzień 3-4)

**Cel:** Zrozumienie użytkowników

- [ ] **PostHog** - Product Analytics (4 dni)
  - Account i project setup
  - Frontend integration
  - Custom events dla kluczowych akcji
  - Dashboardy i funnels
  - A/B testing infrastructure (przyszłość)

**Deliverables:**
- Tracking wszystkich user actions
- Dashboardy z metrykami (DAU, retention, funnels)
- Session recordings działają

### Faza 3: Monetization (Tydzień 5-8) - Opcjonalne na start

**Cel:** Droga do przychodów

- [ ] **Stripe** - Payments (1 tydzień)
  - Account setup i weryfikacja biznesowa
  - Products i pricing setup
  - Checkout flow implementation
  - Webhooks i subscription management
  - Database schema extensions (plans, limits)
  - Usage limits enforcement
  - Testing w trybie test

- [ ] **Loops** - Email Marketing (3 dni)
  - Account setup i domain verification
  - Email templates (welcome, training_complete, itd.)
  - Transactional emails integration
  - Onboarding sequence setup
  - Newsletter signup

**Deliverables:**
- Działający system płatności (test mode)
- Użytkownicy mogą subskrybować plany
- Automatyczne emaile wysyłane
- Limity wymuszane dla free users

### Faza 4: Polish & Launch (Tydzień 9-10)

**Cel:** Przygotowanie do produkcji

- [ ] Testing end-to-end wszystkich integracji
- [ ] Documentation update
- [ ] Environment variables dla production
- [ ] Monitoring dashboards setup
- [ ] Soft launch dla beta users
- [ ] Zbieranie feedbacku
- [ ] Bug fixes
- [ ] Public launch

---

## Szacowane Koszty

### Miesięczne Koszty Operacyjne

| Serwis | Free Tier | Przewidywane Koszty (Rok 1) |
|--------|-----------|------------------------------|
| **Upstash Redis** | 10K requests/day | $0-5/miesiąc |
| **PostHog** | 1M events/month | $0-20/miesiąc |
| **Sentry** | 5K errors + 10K transactions | $0-26/miesiąc |
| **Stripe** | - | 2.9% + $0.30 per transaction |
| **Loops** | 2K contacts | $0-30/miesiąc |
| **TOTAL** | **~$0-81/miesiąc** | **+ Stripe fees** |

### ROI Calculation

**Break-even przy 3 płacących użytkownikach Pro ($29/miesiąc):**
- Przychód: 3 × $29 = $87
- Koszty: ~$81 + Stripe fees (~$7.50) = ~$88.50
- **Net: ~-$1.50** (prawie break-even)

**Przy 10 użytkownikach Pro:**
- Przychód: 10 × $29 = $290
- Koszty: ~$81 + Stripe fees (~$25) = ~$106
- **Net: ~$184/miesiąc**

---

## Kolejne Kroki

### Przed Rozpoczęciem Integracji

1. **Review DEPLOYMENT_INSTRUCTIONS.md** - Upewnij się że podstawowa aplikacja działa
2. **Zdefiniuj priorytety** - Które serwisy są najbardziej krytyczne?
3. **Przygotuj budżet** - Zaakceptuj szacowane koszty
4. **Utwórz konta trial** - Wszystkie serwisy oferują darmowe tiery

### Po Integracji

1. **Monitoring** - Codziennie sprawdzaj Sentry (pierwszy tydzień)
2. **Analytics** - Cotygodniowy review PostHog dashboardów
3. **Koszty** - Miesięczny review usage i kosztów
4. **Feedback** - Zbieraj opinie użytkowników
5. **Iterate** - Dostosuj na podstawie danych

---

## Dodatkowe Zasoby

### Dokumentacja Serwisów

- **Upstash:** https://docs.upstash.com
- **PostHog:** https://posthog.com/docs
- **Sentry:** https://docs.sentry.io
- **Stripe:** https://stripe.com/docs
- **Loops:** https://loops.so/docs

### Pomocne Tutoriale

- Next.js + Stripe: https://vercel.com/guides/getting-started-with-nextjs-typescript-stripe
- PostHog Product Analytics: https://posthog.com/tutorials
- Sentry Performance: https://docs.sentry.io/platforms/javascript/guides/nextjs/performance/

---

**Ostatnia aktualizacja:** 2025-11-21
**Wersja:** 1.0.0
**Status:** Gotowe do implementacji
