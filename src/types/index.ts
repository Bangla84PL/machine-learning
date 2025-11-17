// User types
export interface User {
  id: string
  email: string
  name?: string
  created_at: string
  updated_at: string
}

// Dataset types
export interface Dataset {
  id: string
  user_id: string
  filename: string
  file_path: string
  row_count: number
  column_count: number
  columns: ColumnInfo[]
  uploaded_at: string
}

export interface ColumnInfo {
  name: string
  type: 'numeric' | 'categorical' | 'datetime'
  missing_count: number
  unique_count?: number
  mean?: number
  std?: number
  min?: number
  max?: number
}

// Model types
export type AlgorithmType =
  | 'logistic_regression'
  | 'random_forest'
  | 'gradient_boosting'
  | 'linear_regression'
  | 'knn'

export type ProblemType = 'classification' | 'regression'

export interface Model {
  id: string
  dataset_id: string
  user_id: string
  name: string
  algorithm: AlgorithmType
  problem_type: ProblemType
  hyperparameters: Record<string, any>
  target_column: string
  feature_columns: string[]
  metrics: ModelMetrics
  feature_importance: FeatureImportance[]
  model_path: string
  train_test_split: number
  trained_at: string
  training_duration: number
}

export interface ModelMetrics {
  // Classification metrics
  accuracy?: number
  precision?: number
  recall?: number
  f1_score?: number
  roc_auc?: number
  confusion_matrix?: number[][]

  // Regression metrics
  rmse?: number
  mae?: number
  r2?: number
}

export interface FeatureImportance {
  feature: string
  importance: number
}

// Training job types
export type TrainingStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface TrainingJob {
  id: string
  model_id?: string
  dataset_id: string
  user_id: string
  status: TrainingStatus
  progress: number
  error_message?: string
  started_at?: string
  completed_at?: string
}

// Prediction types
export interface Prediction {
  id: string
  model_id: string
  user_id: string
  input_file_path?: string
  output_file_path: string
  prediction_count: number
  created_at: string
}

// Training configuration
export interface TrainingConfig {
  dataset_id: string
  target_column: string
  algorithm: AlgorithmType
  hyperparameters?: Record<string, any>
  train_test_split?: number
}

// Algorithm info
export interface AlgorithmInfo {
  id: AlgorithmType
  name: string
  description: string
  use_cases: string[]
  problem_types: ProblemType[]
  hyperparameters: HyperparameterInfo[]
  recommended?: boolean
}

export interface HyperparameterInfo {
  name: string
  label: string
  type: 'number' | 'integer' | 'select'
  default: any
  min?: number
  max?: number
  step?: number
  options?: Array<{ value: any; label: string }>
  description: string
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

// Data statistics
export interface DataStatistics {
  total_rows: number
  total_columns: number
  memory_usage: string
  missing_values_total: number
  numeric_columns: number
  categorical_columns: number
  datetime_columns: number
}
