# machine-learning

# Product Requirements Document: ML Insights Platform

## 1. Executive Summary

ML Insights Platform is a web-based machine learning application that enables data scientists and analysts to upload datasets, train various ML models, visualize results, and deploy predictions through an intuitive interface. The platform democratizes machine learning by providing pre-configured algorithms, automated hyperparameter tuning, and interactive visualizations without requiring deep coding expertise.

## 2. Problem Statement

Data scientists and business analysts spend excessive time on repetitive ML tasks: data preprocessing, model selection, hyperparameter tuning, and deployment configuration. Small to medium businesses often lack the resources to build custom ML pipelines, while individual practitioners need a faster way to prototype and compare models. ML Insights Platform solves this by providing an end-to-end ML workflow in a single, accessible interface.

## 3. Target Users

**Primary Persona: Sarah - Data Analyst**
- 3-5 years experience in data analysis
- Basic Python knowledge, limited ML expertise
- Needs quick insights from business data
- Values ease of use and visual explanations
- Works at mid-sized company without dedicated ML team

**Secondary Persona: David - Data Scientist**
- 5+ years ML experience
- Wants to prototype models quickly
- Needs to compare multiple algorithms efficiently
- Requires model explainability for stakeholders
- Works on multiple projects simultaneously

**Tertiary Persona: Michael - Business Manager**
- Non-technical background
- Needs ML-driven insights for decision making
- Values clear visualizations and actionable recommendations
- Limited time for complex tools
- Budget-conscious

## 4. Goals & Success Metrics

### Business Objectives
- Launch MVP within 8 weeks
- Acquire 100 active users in first 3 months
- Achieve 60% user retention after 30 days
- Generate revenue through freemium model (future)

### Key Performance Indicators
- **User Engagement**: Average 3+ model training sessions per user per week
- **Time to First Model**: <15 minutes from signup to trained model
- **Model Accuracy**: >80% of models achieve baseline performance
- **User Satisfaction**: NPS score >40
- **Platform Uptime**: 99.5% availability

### Definition of Success
- Users successfully train and deploy ML models without technical support
- Platform handles datasets up to 100MB efficiently
- Models train within reasonable time (80% complete within 5 minutes)
- Users understand model performance through visualizations

## 5. User Stories

### Data Upload & Management
- As a data analyst, I want to upload CSV files so that I can analyze my business data with ML
- As a user, I want to preview my uploaded data so that I can verify it's correct before training
- As a user, I want to see data statistics and distributions so that I understand my dataset characteristics
- As a user, I want to handle missing values automatically so that I don't need manual data cleaning

### Model Training
- As a data scientist, I want to select from multiple ML algorithms so that I can find the best model for my problem
- As a user, I want to specify my target variable so that the platform knows what to predict
- As a user, I want automatic train-test splitting so that I get valid performance metrics
- As a user, I want to configure basic hyperparameters so that I can optimize model performance
- As a data analyst, I want automatic hyperparameter tuning so that I achieve good results without manual optimization
- As a user, I want to track training progress so that I know how long to wait

### Model Evaluation
- As a data scientist, I want to see confusion matrices so that I understand classification performance
- As a user, I want to see feature importance so that I understand what drives predictions
- As a user, I want to compare multiple models side-by-side so that I can select the best one
- As a user, I want to export model metrics so that I can share results with my team
- As a business manager, I want plain-language explanations of model performance so that I can make informed decisions

### Prediction & Deployment
- As a user, I want to make predictions on new data so that I can use my trained model
- As a data analyst, I want to download predictions as CSV so that I can use them in other tools
- As a developer, I want API access to my models so that I can integrate predictions into applications
- As a user, I want to save trained models so that I can reuse them later

### Account & Settings
- As a user, I want to create an account so that my work is saved and accessible
- As a user, I want to view my training history so that I can track my experiments
- As a user, I want to delete old models so that I can manage my storage quota

## 6. Functional Requirements

### 6.1 Core Features (MVP)

#### Data Management
- **File Upload**: Support CSV files up to 100MB
- **Data Preview**: Display first 50 rows of uploaded data in table format
- **Data Statistics**: Show column types, missing values, basic statistics (mean, median, std, min, max)
- **Data Visualization**: Generate histograms for numeric columns, bar charts for categorical columns
- **Missing Value Handling**: Automatic imputation (mean for numeric, mode for categorical)

#### Model Training
- **Algorithm Selection**: Support 5 algorithms initially:
  1. Logistic Regression (classification)
  2. Random Forest (classification/regression)
  3. Gradient Boosting (classification/regression)
  4. Linear Regression (regression)
  5. K-Nearest Neighbors (classification/regression)
- **Target Selection**: Allow users to select any column as prediction target
- **Problem Type Detection**: Automatically detect classification vs regression based on target
- **Train-Test Split**: Default 80-20 split with option to customize
- **Feature Selection**: All columns except target automatically used as features
- **Training Status**: Real-time progress indicator with estimated time remaining
- **Basic Hyperparameters**: Expose 2-3 key parameters per algorithm with sensible defaults

#### Model Evaluation
- **Performance Metrics**:
  - Classification: Accuracy, Precision, Recall, F1-Score, ROC-AUC
  - Regression: RMSE, MAE, R²
- **Confusion Matrix**: Interactive heatmap for classification problems
- **Feature Importance**: Horizontal bar chart showing top 10 most important features
- **ROC Curve**: For binary classification problems
- **Residual Plot**: For regression problems
- **Model Comparison Table**: Side-by-side metrics for all trained models on same dataset

#### Prediction
- **Batch Prediction**: Upload new CSV for predictions
- **Prediction Download**: Export predictions as CSV with confidence scores
- **Manual Input Prediction**: Form to enter single data point for quick prediction

#### User Management
- **Authentication**: Email/password signup and login
- **User Dashboard**: List of all datasets, models, and training runs
- **Model Management**: View, rename, delete saved models
- **Training History**: Chronological list of all training sessions with metrics

### 6.2 Future Features (Post-MVP)

#### Advanced ML Capabilities
- Deep Learning models (Neural Networks)
- Time series forecasting algorithms
- Clustering algorithms (K-Means, DBSCAN)
- Automatic feature engineering
- Advanced hyperparameter tuning (Bayesian optimization)
- Model ensembling
- AutoML mode (automatic algorithm selection)

#### Collaboration
- Team workspaces
- Model sharing with team members
- Comments and annotations on models
- Version control for models

#### Data Enhancements
- Support for more file formats (Excel, JSON, Parquet)
- Direct database connections (PostgreSQL, MySQL)
- API integrations (Google Sheets, Airtable)
- Larger file support (up to 1GB)
- Data transformation pipeline builder

#### Production Features
- REST API for real-time predictions
- Model monitoring and drift detection
- A/B testing framework
- Scheduled retraining
- Model versioning
- Containerized model deployment

#### Business Features
- Usage analytics dashboard
- Credit-based pricing system
- Team management and permissions
- SSO integration
- Audit logs

### 6.3 User Flows

#### Flow 1: First-Time User Training a Model

1. **Landing → Signup**
   - User arrives at landing page
   - Clicks "Get Started" button
   - Completes email/password signup form
   - Receives verification email, clicks link
   - Redirected to dashboard

2. **Upload Dataset**
   - Dashboard shows "Upload Your First Dataset" prompt
   - User clicks "Upload Dataset" button
   - Selects CSV file from computer
   - File uploads with progress bar
   - Redirected to dataset preview page

3. **Data Exploration**
   - User sees data table (first 50 rows)
   - Tabs for: Preview, Statistics, Visualizations
   - Reviews column types and missing values
   - Sees automatic data quality checks
   - Clicks "Train Model" button

4. **Model Configuration**
   - Selects target column from dropdown
   - Platform auto-detects problem type (classification/regression)
   - Suggested algorithms displayed (3 recommended)
   - User selects "Random Forest"
   - Reviews default hyperparameters
   - Clicks "Start Training"

5. **Training & Results**
   - Training progress bar appears
   - Model trains (typically 1-3 minutes)
   - Automatically redirected to results page
   - Sees performance metrics, confusion matrix, feature importance
   - Clicks "Save Model"
   - Model saved to dashboard

6. **Make Predictions**
   - From results page, clicks "Make Predictions"
   - Uploads new CSV file
   - Predictions generated and displayed
   - Downloads predictions as CSV
   - Success!

#### Flow 2: Experienced User Comparing Models

1. **Dashboard → Dataset**
   - User logs in to dashboard
   - Sees list of previous datasets
   - Clicks on existing dataset "customer_churn.csv"

2. **Quick Train Multiple Models**
   - Clicks "Compare Models" button
   - Selects 3 algorithms: Logistic Regression, Random Forest, Gradient Boosting
   - Clicks "Train All"
   - All three models train in parallel

3. **Model Comparison**
   - Redirected to comparison view
   - Side-by-side table of metrics
   - Gradient Boosting has highest accuracy (87%)
   - Clicks on Gradient Boosting model
   - Reviews detailed metrics and visualizations
   - Saves model as "churn_predictor_v1"

4. **API Access**
   - Clicks "Get API Key" button
   - Copies API endpoint and key
   - Integrates into production application

## 7. Technical Requirements

### 7.1 Platform

**Web Application**
- Modern web browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Responsive design: Desktop (primary), Tablet (secondary), Mobile (view-only)
- Progressive Web App capabilities (future)

**No Native Mobile Apps** (MVP focuses on web)

### 7.2 Architecture

**Frontend**
- **Framework**: Next.js 14+ (React 18+)
- **Styling**: Tailwind CSS with SmartCamp.AI design system
- **State Management**: React Context API + React Query for server state
- **Charts**: Recharts or Chart.js for visualizations
- **File Upload**: Dropzone for drag-and-drop file uploads
- **Tables**: TanStack Table for data grids

**Backend**
- **Framework**: Next.js API Routes (serverless functions) or FastAPI (Python)
- **ML Framework**: scikit-learn for all MVP algorithms
- **Data Processing**: pandas, numpy
- **Job Queue**: For training jobs (see Infrastructure section)
- **Model Storage**: Pickle/joblib for model serialization

**Database**
- **Primary DB**: PostgreSQL 15+
- **Schema**:
  - `users` (id, email, password_hash, created_at)
  - `datasets` (id, user_id, filename, columns, row_count, file_path, uploaded_at)
  - `models` (id, dataset_id, algorithm, hyperparameters, metrics, feature_importance, model_path, trained_at)
  - `predictions` (id, model_id, input_data, output_data, created_at)
  - `training_jobs` (id, model_id, status, progress, started_at, completed_at)

**File Storage**
- Uploaded datasets stored in organized directory structure
- Trained models stored as serialized files

### 7.3 Integrations

**MVP Integrations**
- None required for MVP

**Future Integrations**
- Stripe (payment processing)
- SendGrid (transactional emails)
- Google Analytics (user analytics)
- Sentry (error tracking)
- AWS S3 or Google Cloud Storage (scalable file storage)

### 7.4 Infrastructure & Hosting

**Hosting Choice**: **SmartCamp.AI VPS**

**VPS Components Used** (per `VPS_TECHNICAL_DOCUMENTATION.md`):

1. **Supabase (Database & Authentication)**
   - **Service**: `supabase-db` (PostgreSQL 15.8.1.060)
   - **Purpose**: Primary database for users, datasets, models, predictions
   - **Connection**: `postgresql://postgres:40ff78fadfcd119c14d1d5818107d1aa@db:5432/postgres`
   - **Authentication**: Supabase Auth for user management
   - **Storage**: Supabase Storage for uploaded datasets and trained models
   - **API**: Supabase REST API for database operations from frontend

2. **n8n (Background Job Processing)**
   - **Service**: `n8n_n8n_1`
   - **Purpose**: Process long-running ML training jobs asynchronously
   - **Workflow**:
     - Frontend triggers n8n webhook when user starts training
     - n8n workflow executes Python ML training script
     - Updates database with training progress and results
     - Sends notification when complete
   - **Webhook Base**: `https://n8n.smartcamp.ai/webhook/`

3. **Traefik (Reverse Proxy)**
   - **Service**: `root_traefik_1`
   - **Purpose**: SSL/TLS termination, routing
   - **Configuration**: 
     - Frontend hosted at `https://ml-insights.smartcamp.ai`
     - API routes at `https://api.ml-insights.smartcamp.ai` (if separate API server)

4. **Gotenberg (PDF Export - Future)**
   - **Service**: `gotenberg`
   - **Purpose**: Generate PDF reports of model performance (post-MVP)
   - **URL**: `https://gotenberg.smartcamp.ai`

**Deployment Model**:
- **Frontend**: Vercel (Next.js) with edge functions
  - Environment variables configured for VPS connections
  - `NEXT_PUBLIC_SUPABASE_URL=https://api.supabase.smartcamp.ai`
  - `SUPABASE_SERVICE_ROLE_KEY=[from VPS docs]`
  - `N8N_WEBHOOK_URL=https://n8n.smartcamp.ai/webhook/ml-training`

- **Backend/ML Processing**: 
  - Python scripts executed via n8n workflows on VPS
  - Alternatively, standalone FastAPI server on VPS (port TBD, e.g., 8001)
  - Traefik routes `https://api.ml-insights.smartcamp.ai` to FastAPI

**Performance Considerations**:
- VPS has 8GB RAM: Sufficient for MVP (datasets up to 100MB, simple models)
- Training jobs queue through n8n to prevent resource exhaustion
- Consider upgrade if concurrent training jobs increase

**Backup & Monitoring**:
- Leverage existing VPS backup system (every 3 days for Supabase)
- Monitor disk usage (VPS currently 51% used - sufficient headroom)
- n8n workflow logs for debugging training failures

**DNS & SSL**:
- Add DNS records for `ml-insights.smartcamp.ai` (and `api.ml-insights.smartcamp.ai` if needed)
- Traefik auto-generates SSL certificates via Let's Encrypt

### 7.5 Authentication & Security

**Authentication**
- Supabase Auth (email/password, email verification required)
- JWT tokens for API authentication
- Secure HTTP-only cookies for session management

**Authorization**
- Row-level security (RLS) in Supabase: users only access their own data
- API endpoints validate user ownership before operations

**Data Security**
- All data encrypted in transit (HTTPS)
- Passwords hashed with bcrypt (handled by Supabase)
- File uploads validated (CSV only, max 100MB)
- Input sanitization to prevent injection attacks

**ML Security**
- Model pickle files stored securely (not publicly accessible)
- Prediction API rate-limited to prevent abuse
- Uploaded datasets scanned for malicious content (basic checks)

## 8. Data Model

### Key Entities

**User**
```
User {
  id: UUID (PK)
  email: string (unique, indexed)
  password_hash: string
  name: string (optional)
  created_at: timestamp
  updated_at: timestamp
}
```

**Dataset**
```
Dataset {
  id: UUID (PK)
  user_id: UUID (FK → User)
  filename: string
  file_path: string (storage bucket path)
  row_count: integer
  column_count: integer
  columns: jsonb (array of column objects with name, type, missing_count)
  uploaded_at: timestamp
}
```

**Model**
```
Model {
  id: UUID (PK)
  dataset_id: UUID (FK → Dataset)
  user_id: UUID (FK → User)
  name: string (user-defined, default auto-generated)
  algorithm: string (enum: logistic_regression, random_forest, etc.)
  problem_type: string (classification/regression)
  hyperparameters: jsonb
  target_column: string
  feature_columns: jsonb (array)
  metrics: jsonb (accuracy, precision, etc.)
  feature_importance: jsonb (array of {feature, importance})
  model_path: string (storage bucket path)
  train_test_split: float (default 0.8)
  trained_at: timestamp
  training_duration: integer (seconds)
}
```

**TrainingJob**
```
TrainingJob {
  id: UUID (PK)
  model_id: UUID (FK → Model, nullable until model created)
  dataset_id: UUID (FK → Dataset)
  user_id: UUID (FK → User)
  status: string (pending/running/completed/failed)
  progress: integer (0-100)
  error_message: text (nullable)
  started_at: timestamp (nullable)
  completed_at: timestamp (nullable)
}
```

**Prediction**
```
Prediction {
  id: UUID (PK)
  model_id: UUID (FK → Model)
  user_id: UUID (FK → User)
  input_file_path: string (optional, for batch)
  output_file_path: string
  prediction_count: integer
  created_at: timestamp
}
```

### Relationships
- One User has many Datasets
- One User has many Models
- One Dataset has many Models
- One Model has many Predictions
- One Model has one TrainingJob (can extend to many for retraining)

## 9. UI/UX Requirements

### Design Principles
1. **Simplicity First**: Complex ML concepts presented in simple, visual ways
2. **Progressive Disclosure**: Show basics first, advanced options available but not overwhelming
3. **Immediate Feedback**: Real-time updates during training, instant validation
4. **Data-Driven Design**: Charts and visualizations over raw numbers
5. **Forgiving UX**: Easy to undo, clear error messages, helpful hints

### Branding & Visual Identity

**SmartCamp.AI Standard Branding** - This application uses the standard SmartCamp.AI design system:

- **Typography**: Jost font family (weights 300, 400, 500, 600, 700)
- **Color Palette**:
  - **Primary**: White (#ffffff) for text and UI elements
  - **Accent**: Emerald-500 (#10b981) for emphasis and success states
  - **Background**: Jungle background image (fixed attachment)
  - **Surfaces**: Glass morphism with rgba(255, 255, 255, 0.15) backgrounds
  - **Borders**: rgba(255, 255, 255, 0.2)

- **Component Styling**:
  - Cards: Glass morphism effect with backdrop-filter blur
  - Buttons: Multiple variants (default white, jungle, outline, emerald)
  - Inputs: Transparent backgrounds with white borders
  - All text uses white or white-opacity variants

- **Logo**: SmartCampAI logo in header (h-12 mobile, h-16 desktop)
- **Mascot**: Monkey mascot in footer (if space allows)

### Key Screens/Views

#### 1. Landing Page
- Hero section with clear value proposition
- "Get Started" CTA button (jungle variant)
- Feature highlights (3-4 cards with icons)
- Demo video or animated illustration
- Pricing information (if applicable)
- Footer with SmartCamp.AI branding

#### 2. Authentication
- Clean signup/login forms (glass morphism cards)
- Email verification flow
- Password reset capability
- Social auth (future)

#### 3. Dashboard
- Welcome message with user name
- "Upload Dataset" prominent CTA
- List of datasets (table or card grid)
  - Filename, rows, columns, upload date
  - Actions: View, Train Model, Delete
- List of models (table or card grid)
  - Name, algorithm, accuracy, trained date
  - Actions: View, Predict, Delete
- Quick stats: Total datasets, Total models, Best accuracy

#### 4. Dataset Upload
- Drag-and-drop zone or file picker
- File validation (CSV, max 100MB)
- Upload progress bar
- Success message with "View Dataset" CTA

#### 5. Dataset Detail Page
- Tabs: Preview | Statistics | Visualizations
- **Preview Tab**:
  - Data table (first 50 rows, paginated)
  - Column headers with type indicators
- **Statistics Tab**:
  - Table of columns with: name, type, count, missing, mean, std, min, max
  - Summary: total rows, total columns, memory usage
- **Visualizations Tab**:
  - Grid of charts (one per column)
  - Histograms for numeric, bar charts for categorical
- "Train Model" button (fixed at bottom or top-right)

#### 6. Model Training Configuration
- Step indicator (1/3: Select Target → 2/3: Choose Algorithm → 3/3: Review)
- **Step 1**: Dropdown to select target column
  - Auto-detect problem type displayed
- **Step 2**: Algorithm cards with radio selection
  - Each card shows: name, description, typical use cases
  - Recommended badge on suggested algorithms
- **Step 3**: Review screen
  - Summary of selections
  - Hyperparameter sliders/inputs (optional, collapsible)
  - Train/test split slider
  - "Start Training" button (emerald variant)

#### 7. Training Progress
- Full-screen overlay or modal
- Animated spinner or progress bar
- "Training your model..." message
- Estimated time remaining
- Cancel button (if feasible)

#### 8. Model Results Page
- Hero section with key metric (e.g., "87% Accuracy")
- Performance metrics table
- Visualizations in grid:
  - Confusion matrix (classification)
  - ROC curve (binary classification)
  - Residual plot (regression)
  - Feature importance chart
- Actions:
  - "Make Predictions" button (primary)
  - "Save Model" button
  - "Train Another Model" button (secondary)
  - "Compare Models" button (if multiple trained)

#### 9. Model Comparison
- Side-by-side table of all models on same dataset
- Columns: Algorithm, Accuracy, Precision, Recall, F1, Training Time
- Sortable by metric
- Click row to view detailed results

#### 10. Prediction Interface
- Two tabs: Batch Prediction | Manual Input
- **Batch Tab**:
  - File upload zone (CSV)
  - "Generate Predictions" button
  - Results table (preview)
  - "Download Predictions" button
- **Manual Tab**:
  - Form with input field for each feature
  - "Predict" button
  - Result displayed with confidence score

### Interaction Patterns

- **Loading States**: Skeleton loaders for tables, spinners for buttons
- **Empty States**: Friendly illustrations with CTA (e.g., "No datasets yet. Upload your first one!")
- **Tooltips**: Hover tooltips on technical terms (e.g., "F1-Score: harmonic mean of precision and recall")
- **Toasts**: Success/error notifications (top-right corner, auto-dismiss)
- **Modals**: Confirmations for destructive actions (delete dataset/model)
- **Animations**: Smooth transitions (0.2-0.3s), page transitions, chart animations

### Global Footer Requirement

**All main screens and pages must include a footer** with the following:

- **Text**: `© Created with ❤️ by SmartCamp.AI`
- **Link**: Text links to `https://smartcamp.ai`
- **Styling**: 
  - Footer background: Same jungle background with rgba(0, 0, 0, 0.3) overlay
  - Text color: White (rgba(255, 255, 255, 0.8))
  - Link hover: Emerald color (#10b981)
- **Placement**: Bottom of page, full-width, centered text
- **Responsive**: Adjust padding/font size for mobile

### Accessibility Requirements

- **WCAG 2.1 AA Compliance**:
  - Color contrast ratios meet 4.5:1 for normal text, 3:1 for large text
  - All interactive elements keyboard accessible
  - Focus indicators visible (2px solid white with offset)
  - Form labels and ARIA attributes
  - Alt text for all images/charts
- **Screen Reader Support**: Semantic HTML, ARIA landmarks
- **Keyboard Navigation**: Tab order logical, Esc closes modals
- **Reduced Motion**: Respect prefers-reduced-motion media query

## 10. Non-Functional Requirements

### Performance
- **Page Load**: First Contentful Paint <1.5s, Time to Interactive <3s
- **Training Time**: 80% of models complete within 5 minutes (for datasets <100MB)
- **API Response**: <200ms for data queries, <500ms for predictions
- **File Upload**: Support resumable uploads for large files
- **Chart Rendering**: <1s for all visualizations

### Scalability
- **MVP Target**: Support 100-500 concurrent users
- **Database**: Connection pooling, indexed queries
- **File Storage**: Organized structure to prevent single-directory bottleneck
- **Training Queue**: n8n manages concurrent training jobs (max 3 simultaneous on 8GB VPS)
- **Future Scaling**: Migrate to dedicated ML worker nodes if training load increases

### Reliability
- **Uptime**: 99.5% (leverages VPS backup/monitoring)
- **Error Handling**: Graceful degradation, user-friendly error messages
- **Data Integrity**: Transactional operations, foreign key constraints
- **Backup**: Automated VPS backups every 3 days (includes database and file storage)

### Security
- **HTTPS Only**: All traffic encrypted
- **Input Validation**: Strict validation on all uploads and inputs
- **Rate Limiting**: API endpoints rate-limited (100 requests/minute per user)
- **Data Privacy**: GDPR-ready (user data export/deletion capabilities)
- **Dependency Security**: Regular updates, vulnerability scanning

### Browser/Device Compatibility
- **Desktop Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Tablet**: iPadOS 14+, Android 10+
- **Mobile**: iOS 14+, Android 10+ (view-only, limited interaction)
- **Screen Sizes**: Optimized for 1280px+ (desktop), 768px-1279px (tablet), 320px-767px (mobile)

### Deployment & Hosting Notes
- **Frontend**: Deployed on Vercel with automatic CI/CD from main branch
- **Backend**: Python ML scripts run on SmartCamp.AI VPS via n8n workflows
- **Database**: Self-hosted Supabase on VPS (port 5432, accessible only via VPS network)
- **Domains**: 
  - Frontend: `ml-insights.smartcamp.ai`
  - API (if standalone FastAPI): `api.ml-insights.smartcamp.ai`
- **SSL**: Managed by Traefik with Let's Encrypt auto-renewal
- **Monitoring**: n8n workflow logs, Supabase logs, future integration with Sentry

## 11. Constraints & Assumptions

### Constraints
- **VPS Resources**: 8GB RAM limits concurrent training jobs and dataset sizes
- **MVP Timeline**: 8-week deadline prioritizes core features over polish
- **File Size Limit**: 100MB per dataset (VPS disk space constraint)
- **Algorithm Selection**: Limited to scikit-learn models (no deep learning in MVP)
- **No Mobile Apps**: Web-only for MVP (mobile development deferred)
- **Single-User Focus**: No team collaboration features in MVP

### Assumptions
- Users have basic understanding of ML concepts (or willing to learn via tooltips)
- Datasets are reasonably clean (minimal manual preprocessing required)
- Training times acceptable for target user base (3-5 minutes avg)
- VPS infrastructure sufficient for 100-500 users without major upgrades
- Users access platform primarily from desktop/laptop computers
- CSV format adequate for MVP (most common data export format)
- Email verification is acceptable authentication friction

## 12. Out of Scope (MVP)

### Explicitly NOT Included in MVP
- Deep learning models (TensorFlow, PyTorch)
- Natural Language Processing (NLP) models
- Computer Vision models
- Time series forecasting
- Clustering/unsupervised learning
- Advanced feature engineering (automated feature creation)
- Model explainability beyond feature importance (SHAP, LIME)
- Real-time predictions via websockets
- Collaborative features (teams, sharing, commenting)
- Payment/subscription system
- Admin dashboard for platform monitoring
- Mobile apps (iOS/Android)
- API access (POST-MVP, but infrastructure prepared)
- Model versioning and rollback
- A/B testing framework
- Jupyter notebook integration
- SQL query interface for database connections
- Integration with external data sources (Google Sheets, databases)
- Custom algorithm upload
- Multi-language support (English only for MVP)

## 13. Development Phases

### Phase 1: Foundation (Weeks 1-2)
**Infrastructure & Authentication**
- Set up Next.js project with TypeScript and Tailwind
- Configure Supabase connection (database + auth)
- Implement SmartCamp.AI design system components
- Create authentication flows (signup, login, email verification)
- Set up project structure and routing
- Configure Vercel deployment pipeline
- Implement global footer with SmartCamp.AI attribution

**Deliverables**: 
- Working authentication system
- Landing page with SmartCamp.AI branding
- Dashboard skeleton
- Footer with SmartCamp.AI link on all pages

### Phase 2: Data Management (Weeks 2-3)
**Dataset Upload & Exploration**
- Implement file upload to Supabase Storage
- Create dataset preview table component
- Build data statistics calculation (pandas backend)
- Implement data visualizations (histograms, bar charts)
- Create dataset detail page with tabs
- Handle missing value detection

**Deliverables**:
- Users can upload CSV files
- Dataset exploration interface functional
- Data quality checks in place

### Phase 3: Model Training (Weeks 3-5)
**ML Pipeline & Training Interface**
- Set up n8n workflow for training jobs
- Implement Python training script (scikit-learn)
- Create model configuration UI (target selection, algorithm choice)
- Build training job queue system
- Implement progress tracking and status updates
- Store trained models in Supabase Storage
- Calculate and store performance metrics

**Deliverables**:
- Users can train all 5 algorithms
- Training jobs execute asynchronously via n8n
- Basic hyperparameter configuration working

### Phase 4: Model Evaluation (Weeks 5-6)
**Results & Visualizations**
- Create model results page with metrics display
- Implement confusion matrix visualization
- Build feature importance chart
- Create model comparison table
- Implement ROC curve (classification)
- Implement residual plot (regression)
- Model save/load functionality

**Deliverables**:
- Comprehensive model evaluation interface
- Model comparison feature
- All visualizations rendering correctly

### Phase 5: Predictions (Week 6-7)
**Prediction Interface**
- Implement batch prediction (CSV upload)
- Create manual input form for single predictions
- Build prediction download functionality
- Integrate prediction API with saved models
- Handle prediction errors gracefully

**Deliverables**:
- Users can make predictions with trained models
- Batch and manual prediction both working
- Predictions downloadable as CSV

### Phase 6: Polish & Testing (Week 7-8)
**UX Refinement & QA**
- Implement loading states and error handling
- Add tooltips and help text
- Create empty states for dashboard
- Optimize performance (lazy loading, caching)
- Comprehensive testing (unit, integration, E2E)
- Fix bugs and edge cases
- Accessibility audit and fixes
- Documentation (user guide, API docs)

**Deliverables**:
- Polished, production-ready application
- All major bugs fixed
- Accessibility compliance
- User documentation

### Phase 7: Deployment & Launch (Week 8)
**Go-Live Preparation**
- Final security audit
- Performance optimization
- Set up monitoring and logging
- Configure production environment variables
- DNS configuration for ml-insights.smartcamp.ai
- Soft launch to beta users
- Gather initial feedback
- Public launch

**Deliverables**:
- Application live at https://ml-insights.smartcamp.ai
- Monitoring systems active
- User feedback collected

## 14. Appendix

### Technical References
- **VPS Infrastructure**: See `VPS_TECHNICAL_DOCUMENTATION.md` for complete VPS configuration, service details, and deployment procedures
- **Supabase Setup**: Database schema creation scripts, RLS policies
- **n8n Workflow**: Training job workflow JSON (to be created during Phase 3)
- **Design System**: SmartCamp.AI component library documentation

### Algorithm Details

**1. Logistic Regression**
- Use case: Binary/multi-class classification
- Pros: Fast, interpretable, probabilistic outputs
- Hyperparameters: regularization (C), max_iter
- Default: C=1.0, max_iter=100

**2. Random Forest**
- Use case: Classification and regression, handles non-linear relationships
- Pros: Robust, feature importance, handles missing data
- Hyperparameters: n_estimators, max_depth, min_samples_split
- Default: n_estimators=100, max_depth=None

**3. Gradient Boosting**
- Use case: High-accuracy classification/regression
- Pros: Excellent performance, handles complex patterns
- Hyperparameters: n_estimators, learning_rate, max_depth
- Default: n_estimators=100, learning_rate=0.1, max_depth=3

**4. Linear Regression**
- Use case: Continuous target prediction
- Pros: Simple, interpretable, fast
- Hyperparameters: fit_intercept, normalize
- Default: fit_intercept=True

**5. K-Nearest Neighbors**
- Use case: Classification/regression with local patterns
- Pros: Simple, no training phase
- Hyperparameters: n_neighbors, weights, metric
- Default: n_neighbors=5, weights='uniform'

### Success Metrics Dashboard (Future)

Track these metrics for product success:
- **Activation**: % of signups who upload first dataset
- **Engagement**: Average models trained per user per week
- **Retention**: 30-day retention rate
- **Performance**: Average training time, error rate
- **Growth**: New signups per week, referral rate
- **Satisfaction**: NPS score, feature request themes

### Open Questions (To Be Resolved During Development)
1. Should we support time-based train-test splits or just random splits?
2. What's the optimal max file size for stable performance on 8GB VPS?
3. Should model retraining be manual or offer automated schedule?
4. How to handle datasets with many columns (100+)? Auto-select top N features?
5. Should we offer downloadable model files (pickle) or keep server-side only?

---

**Document Status**: ✅ Complete and Ready for Development

**Next Steps**: 
1. Review PRD with stakeholders
2. Finalize n8n training workflow design
3. Create database schema in Supabase
4. Set up Next.js project structure
5. Begin Phase 1 development

**Contact**: 
- Product Owner: [Your Name]
- Technical Lead: [TBD]
- Design Lead: [TBD]

---

*This PRD created following SmartCamp.AI standards and infrastructure guidelines.*
