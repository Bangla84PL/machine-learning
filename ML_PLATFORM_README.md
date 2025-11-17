# ML Insights Platform

A comprehensive web-based machine learning platform that enables data scientists and analysts to upload datasets, train models, visualize results, and deploy predictions through an intuitive interface.

Built with Next.js, TypeScript, Tailwind CSS, Supabase, and scikit-learn.

## Features

- 📊 **Easy Data Upload** - Upload CSV files up to 100MB with automatic validation
- 🤖 **5 ML Algorithms** - Logistic Regression, Random Forest, Gradient Boosting, Linear Regression, KNN
- 📈 **Visual Insights** - Interactive charts, confusion matrices, feature importance
- ⚡ **Fast Training** - Most models train in under 5 minutes
- 🔄 **Model Comparison** - Compare multiple models side-by-side
- 💾 **Export Predictions** - Download predictions as CSV files
- 🔐 **Secure Authentication** - Email/password with Supabase Auth
- 🎨 **SmartCamp.AI Design** - Beautiful jungle-themed UI with glass morphism

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom design system with SmartCamp.AI branding
- **Charts**: Recharts / Chart.js
- **State Management**: React Context + React Query
- **File Upload**: react-dropzone

### Backend
- **API**: Next.js API Routes
- **ML Framework**: Python with scikit-learn
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Job Queue**: n8n workflows

### Infrastructure
- **Hosting**: Vercel (frontend) + SmartCamp.AI VPS (backend)
- **Database**: Self-hosted Supabase on SmartCamp.AI VPS
- **ML Processing**: Python scripts via n8n workflows
- **Reverse Proxy**: Traefik with SSL/TLS

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.9+
- Access to Supabase instance
- Git

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd machine-learning
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://api.supabase.smartcamp.ai
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
N8N_WEBHOOK_URL=https://n8n.smartcamp.ai/webhook/ml-training
N8N_API_KEY=your-n8n-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Set up Supabase database**

Run the migration SQL:
```bash
psql <your-connection-string> < supabase/migrations/001_initial_schema.sql
```

Or use the Supabase dashboard SQL editor to execute the migration.

See `SUPABASE_SETUP.md` for detailed instructions.

5. **Install Python dependencies**

```bash
cd python
pip install -r requirements.txt
```

6. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
machine-learning/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard page
│   │   ├── datasets/          # Dataset management
│   │   ├── models/            # Model management
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing page
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── ui/               # UI components
│   │   └── layout/           # Layout components
│   ├── lib/                   # Utility functions
│   │   ├── supabase.ts       # Supabase client
│   │   ├── auth-context.tsx  # Auth context
│   │   ├── constants.ts      # Constants
│   │   └── utils.ts          # Helper functions
│   └── types/                 # TypeScript types
│       └── index.ts          # Type definitions
├── python/                    # Python ML backend
│   ├── ml_trainer.py         # Model training script
│   ├── predictor.py          # Prediction script
│   └── requirements.txt      # Python dependencies
├── supabase/
│   └── migrations/           # Database migrations
│       └── 001_initial_schema.sql
├── public/                    # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── README.md
```

## Development Workflow

### Phase 1: Foundation ✅
- [x] Next.js project setup
- [x] TypeScript configuration
- [x] Tailwind CSS with SmartCamp.AI theme
- [x] Supabase configuration
- [x] Authentication system
- [x] Landing page
- [x] Dashboard layout

### Phase 2: Data Management (In Progress)
- [ ] Dataset upload functionality
- [ ] Data preview component
- [ ] Data statistics calculation
- [ ] Data visualizations

### Phase 3: Model Training
- [ ] Python ML training script
- [ ] n8n workflow setup
- [ ] Training configuration UI
- [ ] Progress tracking
- [ ] Model storage

### Phase 4: Model Evaluation
- [ ] Results page
- [ ] Confusion matrix visualization
- [ ] Feature importance chart
- [ ] Model comparison

### Phase 5: Predictions
- [ ] Batch prediction interface
- [ ] Manual prediction form
- [ ] Prediction download

### Phase 6: Polish & Testing
- [ ] Error handling
- [ ] Loading states
- [ ] Unit tests
- [ ] E2E tests
- [ ] Accessibility audit

## Database Schema

### Tables

- `profiles` - User profiles
- `datasets` - Uploaded datasets
- `models` - Trained ML models
- `training_jobs` - Background training jobs
- `predictions` - Prediction history

### Storage Buckets

- `datasets` - CSV files
- `models` - Trained model files (.pkl)
- `predictions` - Prediction output files

See `SUPABASE_SETUP.md` for detailed schema information.

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (SmartCamp.AI VPS)

1. Set up n8n workflow for training
2. Deploy Python scripts to VPS
3. Configure Traefik routing

See full deployment guide in `README.md`.

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Submit a pull request

## Best Practices

- Follow the JAX best practices guide in `JAX_BEST_PRACTICES.md`
- Use TypeScript for all new code
- Follow component structure in `/src/components`
- Write tests for new features
- Document complex logic

## Support

For issues and questions:
- Check the documentation in `/docs`
- Open an issue on GitHub
- Contact the SmartCamp.AI team

## License

This project is part of SmartCamp.AI ecosystem.

---

© Created with ❤️ by [SmartCamp.AI](https://smartcamp.ai)
