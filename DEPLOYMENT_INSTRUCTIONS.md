# Instrukcja Wdrożenia i Konfiguracji - ML Insights Platform

## Spis Treści

1. [Przegląd Architektury](#przegląd-architektury)
2. [Wymagania Systemowe](#wymagania-systemowe)
3. [Konfiguracja Supabase](#konfiguracja-supabase)
4. [Konfiguracja Zmiennych Środowiskowych](#konfiguracja-zmiennych-środowiskowych)
5. [Instalacja i Konfiguracja Lokalna](#instalacja-i-konfiguracja-lokalna)
6. [Konfiguracja n8n](#konfiguracja-n8n)
7. [Wdrożenie Produkcyjne](#wdrożenie-produkcyjne)
8. [Monitorowanie i Konserwacja](#monitorowanie-i-konserwacja)
9. [Rozwiązywanie Problemów](#rozwiązywanie-problemów)

---

## Przegląd Architektury

### Komponenty Systemu

```
┌─────────────────────────────────────────────────────────────┐
│                    ML Insights Platform                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │   Frontend   │◄────►│  Supabase    │                   │
│  │  (Next.js)   │      │  (PostgreSQL │                   │
│  │              │      │   + Auth +   │                   │
│  │              │      │   Storage)   │                   │
│  └──────┬───────┘      └──────────────┘                   │
│         │                                                   │
│         │ API Routes                                        │
│         ▼                                                   │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │     n8n      │◄────►│    Python    │                   │
│  │  (Workflow)  │      │  ML Scripts  │                   │
│  └──────────────┘      └──────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Stack Technologiczny

**Frontend:**
- Next.js 14.0.3 (App Router + TypeScript)
- React 18.2.0
- Tailwind CSS 3.3.5
- TanStack Query + Table
- Chart.js & Recharts

**Backend:**
- Python 3.9+ (scikit-learn, pandas, numpy)
- Next.js API Routes (serverless)
- n8n (orkiestracja zadań ML)

**Infrastruktura:**
- Supabase (PostgreSQL + Auth + Storage)
- Traefik (reverse proxy + SSL)
- Vercel (hosting frontend - opcjonalnie)

---

## Wymagania Systemowe

### Środowisko Lokalne (Development)

**Minimalne Wymagania:**
- Node.js 18.x lub nowszy
- Python 3.9 lub nowszy
- npm/yarn/pnpm
- Git
- 4GB RAM
- 2GB wolnego miejsca na dysku

**Zalecane:**
- Node.js 20.x LTS
- Python 3.11
- 8GB RAM
- SSD z 10GB wolnego miejsca

### Środowisko Produkcyjne

**VPS/Serwer (dla Supabase + n8n):**
- Ubuntu 22.04 LTS lub nowszy
- 4 CPU cores
- 8GB RAM (minimum), 16GB RAM (zalecane)
- 50GB SSD
- Docker + Docker Compose

**Frontend (Vercel):**
- Konto Vercel (darmowy tier wystarczy)
- Połączenie z repozytorium Git

---

## Konfiguracja Supabase

### Krok 1: Instalacja Supabase (Self-hosted)

**Opcja A: Docker Compose (Zalecane)**

```bash
# 1. Sklonuj repozytorium Supabase
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker

# 2. Skopiuj plik konfiguracyjny
cp .env.example .env

# 3. Wygeneruj silne hasła i klucze
openssl rand -base64 32  # Użyj dla różnych sekretów
```

**Edytuj `.env` i ustaw:**

```env
# PostgreSQL
POSTGRES_PASSWORD=<strong_password_here>
POSTGRES_DB=postgres

# JWT Secret (użyj openssl rand -base64 32)
JWT_SECRET=<jwt_secret_here>

# Anonymous Key & Service Role Key
# Te klucze zostaną wygenerowane automatycznie lub możesz użyć:
# https://supabase.com/docs/guides/self-hosting#api-keys
ANON_KEY=<anon_key_here>
SERVICE_ROLE_KEY=<service_role_key_here>

# Studio (opcjonalnie - UI dla Supabase)
STUDIO_DEFAULT_ORGANIZATION=ML Insights
STUDIO_DEFAULT_PROJECT=ml-insights-platform

# Public URL
PUBLIC_REST_URL=https://api.supabase.smartcamp.ai
```

**4. Uruchom Supabase:**

```bash
docker-compose up -d
```

**Opcja B: Supabase Cloud (Łatwiejsza)**

1. Zarejestruj się na https://supabase.com
2. Utwórz nowy projekt
3. Zapisz URL projektu i klucze API (znajdziesz je w Settings > API)

### Krok 2: Konfiguracja Bazy Danych

**1. Uruchom migrację schematu:**

```bash
# Zainstaluj Supabase CLI
npm install -g supabase

# Połącz się z projektem (opcjonalnie dla cloud)
supabase link --project-ref <your-project-ref>

# Lub użyj bezpośrednio psql dla self-hosted
psql -h localhost -U postgres -d postgres < supabase/migrations/001_initial_schema.sql
```

**2. Zweryfikuj utworzone tabele:**

```sql
-- Sprawdź czy wszystkie tabele istnieją
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Powinny być:
-- profiles, datasets, models, training_jobs, predictions
```

### Krok 3: Konfiguracja Storage Buckets

**Użyj Supabase Dashboard lub SQL:**

```sql
-- Utwórz buckety (wykonaj w Supabase SQL Editor)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('datasets', 'datasets', false),
  ('models', 'models', false),
  ('predictions', 'predictions', false);
```

**Ustaw polityki RLS dla Storage:**

```sql
-- Datasets bucket - użytkownicy mogą zarządzać swoimi plikami
CREATE POLICY "Users can upload own datasets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read own datasets"
ON storage.objects FOR SELECT
USING (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own datasets"
ON storage.objects FOR DELETE
USING (bucket_id = 'datasets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Powtórz dla 'models' i 'predictions' buckets
-- (zamień 'datasets' na 'models' / 'predictions')
```

### Krok 4: Konfiguracja Uwierzytelniania

**W Supabase Dashboard:**

1. Przejdź do **Authentication > Settings**
2. Skonfiguruj:
   - **Site URL:** `https://ml-insights.smartcamp.ai`
   - **Redirect URLs:**
     - `https://ml-insights.smartcamp.ai/auth/callback`
     - `http://localhost:3000/auth/callback` (dla dev)

3. Email Templates:
   - Dostosuj szablony w **Authentication > Email Templates**
   - Dodaj branding SmartCamp.AI

4. **Providers:**
   - Email (włączony domyślnie)
   - Opcjonalnie: Google, GitHub (wymaga konfiguracji OAuth)

### Krok 5: Konfiguracja CORS (dla self-hosted)

**Edytuj `docker/.env`:**

```env
# Dodaj dozwolone origins
ADDITIONAL_REDIRECT_URLS=https://ml-insights.smartcamp.ai,http://localhost:3000
```

---

## Konfiguracja Zmiennych Środowiskowych

### Zmienne dla Frontend (Next.js)

Utwórz plik `.env.local` w głównym katalogu projektu:

```bash
# ============================================
# SUPABASE CONFIGURATION
# ============================================
# URL twojej instancji Supabase
NEXT_PUBLIC_SUPABASE_URL=https://api.supabase.smartcamp.ai

# Klucz publiczny (anon key) - bezpieczny do użycia w przeglądarce
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Klucz serwisowy (service role) - TYLKO dla server-side operacji
# NIGDY nie ujawniaj tego klucza w kodzie klienta!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# N8N CONFIGURATION
# ============================================
# URL webhooka n8n dla zadań treningowych
N8N_WEBHOOK_URL=https://n8n.smartcamp.ai/webhook/ml-training

# Klucz API n8n (jeśli używasz autoryzacji)
N8N_API_KEY=your-n8n-api-key-here

# ============================================
# APPLICATION CONFIGURATION
# ============================================
# Publiczny URL aplikacji
NEXT_PUBLIC_APP_URL=https://ml-insights.smartcamp.ai

# Środowisko (development, staging, production)
NODE_ENV=production

# ============================================
# OPTIONAL: FUTURE INTEGRATIONS
# ============================================
# (Zostaną wykorzystane po integracji - patrz INTEGRATION_PLAN.md)

# Upstash Redis
# UPSTASH_REDIS_REST_URL=
# UPSTASH_REDIS_REST_TOKEN=

# PostHog Analytics
# NEXT_PUBLIC_POSTHOG_KEY=
# NEXT_PUBLIC_POSTHOG_HOST=

# Sentry Error Tracking
# NEXT_PUBLIC_SENTRY_DSN=
# SENTRY_AUTH_TOKEN=

# Stripe Payments
# STRIPE_SECRET_KEY=
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
# STRIPE_WEBHOOK_SECRET=

# Loops Email Marketing
# LOOPS_API_KEY=
```

### Zmienne dla Python ML Scripts

Utwórz `.env` w katalogu `python/`:

```bash
# Supabase Configuration
SUPABASE_URL=https://api.supabase.smartcamp.ai
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Sentry (dla error tracking)
# SENTRY_DSN=
```

### Bezpieczeństwo Zmiennych Środowiskowych

**WAŻNE:**

1. **NIGDY nie commituj** plików `.env*` do repozytorium
2. Dodaj do `.gitignore`:
   ```
   .env
   .env.local
   .env.production
   python/.env
   ```

3. **Rotacja kluczy:**
   - Zmieniaj `SERVICE_ROLE_KEY` regularnie (co 90 dni)
   - Używaj różnych kluczy dla dev/staging/production

4. **Przechowywanie:**
   - Używaj menedżera haseł (1Password, Bitwarden)
   - Dla produkcji: Vercel Environment Variables / AWS Secrets Manager

---

## Instalacja i Konfiguracja Lokalna

### Krok 1: Klonowanie Repozytorium

```bash
git clone <repository-url> ml-insights-platform
cd ml-insights-platform
```

### Krok 2: Instalacja Zależności Node.js

```bash
# Użyj npm, yarn lub pnpm
npm install

# lub
yarn install

# lub
pnpm install
```

### Krok 3: Instalacja Zależności Python

```bash
# Utwórz wirtualne środowisko (zalecane)
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# lub
.\venv\Scripts\activate  # Windows

# Instalacja pakietów
pip install -r python/requirements.txt
```

### Krok 4: Konfiguracja Zmiennych Środowiskowych

```bash
# Skopiuj przykładowy plik
cp .env.example .env.local

# Edytuj .env.local i wprowadź swoje klucze
nano .env.local  # lub użyj ulubionego edytora
```

### Krok 5: Inicjalizacja Bazy Danych

```bash
# Jeśli używasz Supabase Cloud
supabase db push

# Jeśli używasz self-hosted
psql -h localhost -U postgres -d postgres < supabase/migrations/001_initial_schema.sql
```

### Krok 6: Uruchomienie w Trybie Deweloperskim

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Python (opcjonalnie - do testowania)
cd python
python ml_trainer.py  # przykładowy test
```

Aplikacja będzie dostępna pod adresem: http://localhost:3000

---

## Konfiguracja n8n

### Instalacja n8n (Docker)

```bash
# Utwórz katalog dla n8n
mkdir -p ~/n8n-data

# Uruchom n8n w kontenerze
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=<strong_password> \
  -e WEBHOOK_URL=https://n8n.smartcamp.ai \
  -v ~/n8n-data:/home/node/.n8n \
  n8nio/n8n
```

### Konfiguracja Workflow ML Training

**1. Zaloguj się do n8n:** http://localhost:5678

**2. Utwórz nowy workflow:**

**Nodes:**

```
┌─────────────┐    ┌──────────────┐    ┌────────────────┐
│   Webhook   │───►│  Set Env Vars│───►│  Execute Python│
│   Trigger   │    │              │    │   ml_trainer   │
└─────────────┘    └──────────────┘    └───────┬────────┘
                                                │
                                                ▼
                                       ┌────────────────┐
                                       │ Update Supabase│
                                       │   Job Status   │
                                       └────────────────┘
```

**Node Configuration:**

**A. Webhook Node:**
- Method: POST
- Path: `/webhook/ml-training`
- Response: Immediately return 200

**B. Set Env Vars Node:**
```javascript
// Function Node
const payload = $input.item.json;

return {
  json: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATASET_ID: payload.datasetId,
    JOB_ID: payload.jobId,
    TARGET_COLUMN: payload.targetColumn,
    ALGORITHM: payload.algorithm,
    HYPERPARAMETERS: JSON.stringify(payload.hyperparameters)
  }
};
```

**C. Execute Command Node:**
```bash
cd /path/to/python && \
python ml_trainer.py \
  --dataset-id {{ $json.DATASET_ID }} \
  --job-id {{ $json.JOB_ID }} \
  --target {{ $json.TARGET_COLUMN }} \
  --algorithm {{ $json.ALGORITHM }} \
  --hyperparameters '{{ $json.HYPERPARAMETERS }}'
```

**D. HTTP Request Node (Update Status):**
- Method: PATCH
- URL: `{{ $env.SUPABASE_URL }}/rest/v1/training_jobs?id=eq.{{ $json.JOB_ID }}`
- Headers:
  ```
  apikey: {{ $env.SUPABASE_KEY }}
  Authorization: Bearer {{ $env.SUPABASE_KEY }}
  Content-Type: application/json
  ```
- Body:
  ```json
  {
    "status": "completed",
    "completed_at": "{{ $now }}",
    "progress": 100
  }
  ```

**3. Zapisz i aktywuj workflow**

### Zmienne Środowiskowe n8n

```bash
# Edytuj docker-compose.yml lub .env dla n8n
SUPABASE_URL=https://api.supabase.smartcamp.ai
SUPABASE_SERVICE_ROLE_KEY=<your-key>
PYTHON_PATH=/usr/local/bin/python3
```

---

## Wdrożenie Produkcyjne

### Opcja 1: Vercel (Frontend) + VPS (Backend)

**A. Wdrożenie Frontend na Vercel:**

```bash
# 1. Zainstaluj Vercel CLI
npm i -g vercel

# 2. Połącz projekt
vercel link

# 3. Dodaj zmienne środowiskowe
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add N8N_WEBHOOK_URL production
# ... itd.

# 4. Deploy
vercel --prod
```

**Lub przez Vercel Dashboard:**
1. Połącz repozytorium GitHub
2. Skonfiguruj zmienne środowiskowe w Settings > Environment Variables
3. Deploy automatycznie przy każdym push do main

**B. Konfiguracja VPS dla Supabase + n8n + Python:**

**1. Instalacja Docker:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER
```

**2. Docker Compose dla całego stacku:**

Utwórz `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  # Supabase (uproszczona konfiguracja - użyj oficjalnego docker-compose)
  postgres:
    image: supabase/postgres:15.8
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: postgres
    ports:
      - "5432:5432"

  # n8n
  n8n:
    image: n8nio/n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - WEBHOOK_URL=https://n8n.smartcamp.ai
    volumes:
      - n8n-data:/home/node/.n8n
      - ./python:/python  # Mount Python scripts

  # Traefik (Reverse Proxy + SSL)
  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@smartcamp.ai"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - letsencrypt-data:/letsencrypt

volumes:
  postgres-data:
  n8n-data:
  letsencrypt-data:
```

**3. Uruchomienie:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Opcja 2: Full Self-Hosted (VPS + Docker)

**Utwórz kompletny stack włącznie z frontendem:**

```yaml
# docker-compose.full.yml
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    depends_on:
      - postgres
```

**Dockerfile dla Next.js:**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

### Konfiguracja DNS

**Ustaw następujące rekordy A/CNAME:**

```
ml-insights.smartcamp.ai    → A      <Vercel IP lub VPS IP>
api.supabase.smartcamp.ai   → A      <VPS IP>
n8n.smartcamp.ai            → A      <VPS IP>
```

### SSL/TLS Certificates

**Traefik automatycznie obsługuje Let's Encrypt** - nie wymaga dodatkowej konfiguracji.

**Weryfikacja:**
```bash
curl https://ml-insights.smartcamp.ai
curl https://api.supabase.smartcamp.ai
```

---

## Monitorowanie i Konserwacja

### Health Checks

**Utwórz endpoint `/api/health` w Next.js:**

```typescript
// src/app/api/health/route.ts
export async function GET() {
  try {
    // Sprawdź połączenie z Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) throw error;

    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        storage: 'up'
      }
    });
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 503 });
  }
}
```

### Logi

**Docker Logs:**
```bash
# Supabase logs
docker logs supabase-postgres -f

# n8n logs
docker logs n8n -f

# Traefik logs
docker logs traefik -f
```

**Next.js Logs (Vercel):**
- Dashboard: https://vercel.com/dashboard
- Real-time logs: `vercel logs <deployment-url>`

### Backup Bazy Danych

**Automated Backups (Cron):**

```bash
# Utwórz skrypt backup.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
mkdir -p $BACKUP_DIR

docker exec supabase-postgres pg_dump -U postgres postgres | \
  gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Usuń backupy starsze niż 30 dni
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

**Dodaj do crontab:**
```bash
crontab -e

# Backup codziennie o 2:00 AM
0 2 * * * /path/to/backup.sh
```

### Aktualizacje

**Aktualizacja Dependencies:**

```bash
# Frontend
npm update
npm audit fix

# Python
pip list --outdated
pip install -U <package-name>

# Docker images
docker-compose pull
docker-compose up -d
```

---

## Rozwiązywanie Problemów

### Problem: Błędy uwierzytelniania

**Objawy:**
- "Invalid API key" w konsoli
- Użytkownik nie może się zalogować

**Rozwiązanie:**
1. Sprawdź czy klucze w `.env.local` są poprawne
2. Zweryfikuj CORS w Supabase (Authentication > Settings > Redirect URLs)
3. Sprawdź czy `NEXT_PUBLIC_APP_URL` jest poprawny

### Problem: Błędy przy uploadzie plików

**Objawy:**
- "Storage bucket not found"
- "Permission denied"

**Rozwiązanie:**
1. Sprawdź czy buckety istnieją: Storage > Buckets
2. Zweryfikuj RLS policies dla storage
3. Sprawdź uprawnienia folderu (user_id)

### Problem: Trenowanie modelu nie działa

**Objawy:**
- Job status stuck na "pending"
- Brak odpowiedzi z n8n

**Rozwiązanie:**
1. Sprawdź czy n8n jest uruchomione: `docker ps`
2. Zweryfikuj webhook URL: `echo $N8N_WEBHOOK_URL`
3. Sprawdź logi n8n: `docker logs n8n -f`
4. Testuj webhook ręcznie:
   ```bash
   curl -X POST https://n8n.smartcamp.ai/webhook/ml-training \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

### Problem: Błędy Python

**Objawy:**
- "Module not found"
- Import errors

**Rozwiązanie:**
1. Sprawdź wersję Pythona: `python --version` (minimum 3.9)
2. Zainstaluj brakujące pakiety:
   ```bash
   pip install -r python/requirements.txt
   ```
3. Sprawdź zmienne środowiskowe:
   ```bash
   python -c "from dotenv import load_dotenv; load_dotenv(); import os; print(os.getenv('SUPABASE_URL'))"
   ```

### Problem: Wolna wydajność

**Objawy:**
- Długie ładowanie stron
- Timeout przy trenowaniu

**Rozwiązanie:**
1. Sprawdź indeksy w bazie danych
2. Zwiększ resources dla Docker containers:
   ```yaml
   # docker-compose.yml
   services:
     postgres:
       deploy:
         resources:
           limits:
             memory: 2G
   ```
3. Włącz caching (Redis - patrz INTEGRATION_PLAN.md)

### Kontakt i Wsparcie

**Dokumentacja:**
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- n8n: https://docs.n8n.io

**Logi i debugging:**
```bash
# Wszystkie komponenty
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
```

---

## Checklist Wdrożenia

### Pre-Production

- [ ] Supabase skonfigurowany i testowy użytkownik utworzony
- [ ] Wszystkie migracje bazy danych wykonane
- [ ] Storage buckets utworzone z RLS policies
- [ ] Zmienne środowiskowe ustawione dla wszystkich środowisk
- [ ] n8n workflow utworzony i przetestowany
- [ ] Python dependencies zainstalowane
- [ ] SSL certificates skonfigurowane (Traefik/Let's Encrypt)
- [ ] DNS rekordy ustawione i propagowane

### Production Launch

- [ ] Vercel deployment wykonany i działa
- [ ] Health check endpoint zwraca 200 OK
- [ ] Test: Rejestracja nowego użytkownika
- [ ] Test: Upload datasetu
- [ ] Test: Trenowanie modelu (end-to-end)
- [ ] Test: Predykcja z wytrenowanym modelem
- [ ] Backup strategie skonfigurowane
- [ ] Monitoring (logs) skonfigurowany
- [ ] Error tracking gotowy (przyszłość: Sentry)

### Post-Launch

- [ ] Monitorowanie metryk użytkowania
- [ ] Review logs po pierwszym tygodniu
- [ ] Performance optimization w razie potrzeby
- [ ] Dokumentacja aktualizowana o production findings

---

**Ostatnia aktualizacja:** 2025-11-21
**Wersja:** 1.0.0
**Kontakt:** admin@smartcamp.ai
