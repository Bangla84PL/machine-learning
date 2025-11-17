import { AlgorithmInfo, AlgorithmType } from '@/types'

// Algorithm configurations
export const ALGORITHMS: Record<AlgorithmType, AlgorithmInfo> = {
  logistic_regression: {
    id: 'logistic_regression',
    name: 'Logistic Regression',
    description: 'Fast and interpretable binary/multi-class classification',
    use_cases: ['Customer churn prediction', 'Email spam detection', 'Disease diagnosis'],
    problem_types: ['classification'],
    hyperparameters: [
      {
        name: 'C',
        label: 'Regularization Strength (C)',
        type: 'number',
        default: 1.0,
        min: 0.01,
        max: 10.0,
        step: 0.1,
        description: 'Inverse of regularization strength; smaller values specify stronger regularization',
      },
      {
        name: 'max_iter',
        label: 'Max Iterations',
        type: 'integer',
        default: 100,
        min: 50,
        max: 1000,
        step: 50,
        description: 'Maximum number of iterations for solver convergence',
      },
    ],
  },
  random_forest: {
    id: 'random_forest',
    name: 'Random Forest',
    description: 'Robust ensemble method for classification and regression',
    use_cases: ['Feature importance analysis', 'Customer segmentation', 'Sales forecasting'],
    problem_types: ['classification', 'regression'],
    hyperparameters: [
      {
        name: 'n_estimators',
        label: 'Number of Trees',
        type: 'integer',
        default: 100,
        min: 10,
        max: 500,
        step: 10,
        description: 'Number of trees in the forest',
      },
      {
        name: 'max_depth',
        label: 'Max Depth',
        type: 'integer',
        default: 10,
        min: 2,
        max: 50,
        step: 1,
        description: 'Maximum depth of each tree (None for unlimited)',
      },
      {
        name: 'min_samples_split',
        label: 'Min Samples Split',
        type: 'integer',
        default: 2,
        min: 2,
        max: 20,
        step: 1,
        description: 'Minimum samples required to split an internal node',
      },
    ],
    recommended: true,
  },
  gradient_boosting: {
    id: 'gradient_boosting',
    name: 'Gradient Boosting',
    description: 'High-accuracy ensemble method using sequential tree building',
    use_cases: ['Ranking problems', 'Click-through rate prediction', 'Risk assessment'],
    problem_types: ['classification', 'regression'],
    hyperparameters: [
      {
        name: 'n_estimators',
        label: 'Number of Boosting Stages',
        type: 'integer',
        default: 100,
        min: 10,
        max: 500,
        step: 10,
        description: 'Number of boosting stages to perform',
      },
      {
        name: 'learning_rate',
        label: 'Learning Rate',
        type: 'number',
        default: 0.1,
        min: 0.01,
        max: 1.0,
        step: 0.01,
        description: 'Shrinks contribution of each tree',
      },
      {
        name: 'max_depth',
        label: 'Max Depth',
        type: 'integer',
        default: 3,
        min: 1,
        max: 10,
        step: 1,
        description: 'Maximum depth of individual trees',
      },
    ],
    recommended: true,
  },
  linear_regression: {
    id: 'linear_regression',
    name: 'Linear Regression',
    description: 'Simple and interpretable regression for continuous targets',
    use_cases: ['Price prediction', 'Trend analysis', 'Resource estimation'],
    problem_types: ['regression'],
    hyperparameters: [
      {
        name: 'fit_intercept',
        label: 'Fit Intercept',
        type: 'select',
        default: true,
        options: [
          { value: true, label: 'Yes' },
          { value: false, label: 'No' },
        ],
        description: 'Whether to calculate the intercept for this model',
      },
    ],
  },
  knn: {
    id: 'knn',
    name: 'K-Nearest Neighbors',
    description: 'Instance-based learning for classification and regression',
    use_cases: ['Recommendation systems', 'Pattern recognition', 'Anomaly detection'],
    problem_types: ['classification', 'regression'],
    hyperparameters: [
      {
        name: 'n_neighbors',
        label: 'Number of Neighbors (K)',
        type: 'integer',
        default: 5,
        min: 1,
        max: 20,
        step: 1,
        description: 'Number of neighbors to use',
      },
      {
        name: 'weights',
        label: 'Weight Function',
        type: 'select',
        default: 'uniform',
        options: [
          { value: 'uniform', label: 'Uniform' },
          { value: 'distance', label: 'Distance' },
        ],
        description: 'Weight function used in prediction',
      },
    ],
  },
}

// File upload constraints
export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
export const ALLOWED_FILE_TYPES = ['.csv']

// Default train-test split ratio
export const DEFAULT_TRAIN_TEST_SPLIT = 0.8

// Pagination
export const ITEMS_PER_PAGE = 10

// Training status polling interval (ms)
export const TRAINING_POLL_INTERVAL = 2000

// Chart colors (for SmartCamp.AI theme)
export const CHART_COLORS = {
  primary: '#10b981',
  secondary: '#ffffff',
  accent: '#34d399',
  background: 'rgba(255, 255, 255, 0.15)',
  grid: 'rgba(255, 255, 255, 0.2)',
}
