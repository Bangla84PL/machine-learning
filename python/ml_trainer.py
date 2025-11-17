"""
ML Model Training Script for ML Insights Platform

This script handles training of machine learning models using scikit-learn.
It supports multiple algorithms for classification and regression tasks.
"""

import os
import sys
import json
import joblib
import logging
from typing import Dict, Any, Tuple, List
from datetime import datetime

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.impute import SimpleImputer

# Classification models
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neighbors import KNeighborsClassifier

# Regression models
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.neighbors import KNeighborsRegressor

# Metrics
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
    confusion_matrix, mean_squared_error, mean_absolute_error, r2_score
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MLTrainer:
    """
    Machine Learning model trainer supporting multiple algorithms.

    Attributes:
        algorithm: Algorithm type (e.g., 'logistic_regression', 'random_forest')
        problem_type: Either 'classification' or 'regression'
        hyperparameters: Dictionary of model hyperparameters
    """

    CLASSIFICATION_ALGORITHMS = {
        'logistic_regression': LogisticRegression,
        'random_forest': RandomForestClassifier,
        'gradient_boosting': GradientBoostingClassifier,
        'knn': KNeighborsClassifier
    }

    REGRESSION_ALGORITHMS = {
        'linear_regression': LinearRegression,
        'random_forest': RandomForestRegressor,
        'gradient_boosting': GradientBoostingRegressor,
        'knn': KNeighborsRegressor
    }

    def __init__(self, algorithm: str, problem_type: str, hyperparameters: Dict[str, Any]):
        """
        Initialize the ML trainer.

        Args:
            algorithm: Algorithm identifier
            problem_type: 'classification' or 'regression'
            hyperparameters: Model hyperparameters
        """
        self.algorithm = algorithm
        self.problem_type = problem_type
        self.hyperparameters = hyperparameters
        self.model = None
        self.scaler = None
        self.label_encoder = None
        self.feature_names = []

    def _get_model_class(self):
        """Get the model class based on algorithm and problem type."""
        if self.problem_type == 'classification':
            return self.CLASSIFICATION_ALGORITHMS.get(self.algorithm)
        else:
            return self.REGRESSION_ALGORITHMS.get(self.algorithm)

    def _preprocess_data(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        is_training: bool = True
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Preprocess features and target variable.

        Args:
            X: Feature dataframe
            y: Target series
            is_training: Whether this is training data

        Returns:
            Preprocessed X and y as numpy arrays
        """
        # Store feature names
        if is_training:
            self.feature_names = X.columns.tolist()

        # Handle missing values
        if X.isnull().any().any():
            logger.info("Handling missing values in features")
            imputer = SimpleImputer(strategy='mean')
            X = pd.DataFrame(
                imputer.fit_transform(X),
                columns=X.columns,
                index=X.index
            )

        # Encode categorical variables
        categorical_cols = X.select_dtypes(include=['object', 'category']).columns
        if len(categorical_cols) > 0:
            logger.info(f"Encoding categorical features: {list(categorical_cols)}")
            for col in categorical_cols:
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col].astype(str))

        # Scale features (important for distance-based algorithms)
        if self.algorithm in ['logistic_regression', 'knn']:
            if is_training:
                self.scaler = StandardScaler()
                X_scaled = self.scaler.fit_transform(X)
            else:
                X_scaled = self.scaler.transform(X)
            X = pd.DataFrame(X_scaled, columns=X.columns, index=X.index)

        # Handle target variable
        if self.problem_type == 'classification':
            if y.dtype == 'object' or y.dtype.name == 'category':
                if is_training:
                    self.label_encoder = LabelEncoder()
                    y = self.label_encoder.fit_transform(y)
                else:
                    y = self.label_encoder.transform(y)

        return X.values, y.values if isinstance(y, pd.Series) else y

    def train(
        self,
        X_train: pd.DataFrame,
        X_test: pd.DataFrame,
        y_train: pd.Series,
        y_test: pd.Series
    ) -> Dict[str, Any]:
        """
        Train the model and evaluate on test set.

        Args:
            X_train: Training features
            X_test: Test features
            y_train: Training target
            y_test: Test target

        Returns:
            Dictionary containing metrics and feature importance
        """
        start_time = datetime.now()

        # Preprocess data
        logger.info("Preprocessing training data")
        X_train_processed, y_train_processed = self._preprocess_data(
            X_train, y_train, is_training=True
        )
        X_test_processed, y_test_processed = self._preprocess_data(
            X_test, y_test, is_training=False
        )

        # Initialize model
        model_class = self._get_model_class()
        if model_class is None:
            raise ValueError(f"Unknown algorithm: {self.algorithm}")

        logger.info(f"Initializing {self.algorithm} model with hyperparameters: {self.hyperparameters}")
        self.model = model_class(**self.hyperparameters)

        # Train model
        logger.info("Training model...")
        self.model.fit(X_train_processed, y_train_processed)

        # Make predictions
        y_pred = self.model.predict(X_test_processed)

        # Calculate metrics
        metrics = self._calculate_metrics(y_test_processed, y_pred, X_test_processed)

        # Get feature importance
        feature_importance = self._get_feature_importance()

        # Calculate training duration
        training_duration = (datetime.now() - start_time).total_seconds()

        logger.info(f"Training completed in {training_duration:.2f} seconds")

        return {
            'metrics': metrics,
            'feature_importance': feature_importance,
            'training_duration': int(training_duration)
        }

    def _calculate_metrics(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        X_test: np.ndarray
    ) -> Dict[str, Any]:
        """
        Calculate performance metrics based on problem type.

        Args:
            y_true: True labels
            y_pred: Predicted labels
            X_test: Test features (for probability predictions)

        Returns:
            Dictionary of metrics
        """
        metrics = {}

        if self.problem_type == 'classification':
            # Classification metrics
            metrics['accuracy'] = float(accuracy_score(y_true, y_pred))

            # Handle binary vs multiclass
            n_classes = len(np.unique(y_true))
            average = 'binary' if n_classes == 2 else 'weighted'

            metrics['precision'] = float(precision_score(
                y_true, y_pred, average=average, zero_division=0
            ))
            metrics['recall'] = float(recall_score(
                y_true, y_pred, average=average, zero_division=0
            ))
            metrics['f1_score'] = float(f1_score(
                y_true, y_pred, average=average, zero_division=0
            ))

            # ROC-AUC for binary classification with probability support
            if n_classes == 2 and hasattr(self.model, 'predict_proba'):
                try:
                    y_prob = self.model.predict_proba(X_test)[:, 1]
                    metrics['roc_auc'] = float(roc_auc_score(y_true, y_prob))
                except Exception as e:
                    logger.warning(f"Could not calculate ROC-AUC: {e}")
                    metrics['roc_auc'] = None
            else:
                metrics['roc_auc'] = None

            # Confusion matrix
            cm = confusion_matrix(y_true, y_pred)
            metrics['confusion_matrix'] = cm.tolist()

            logger.info(f"Classification metrics - Accuracy: {metrics['accuracy']:.4f}, F1: {metrics['f1_score']:.4f}")

        else:
            # Regression metrics
            metrics['rmse'] = float(np.sqrt(mean_squared_error(y_true, y_pred)))
            metrics['mae'] = float(mean_absolute_error(y_true, y_pred))
            metrics['r2'] = float(r2_score(y_true, y_pred))

            logger.info(f"Regression metrics - RMSE: {metrics['rmse']:.4f}, R²: {metrics['r2']:.4f}")

        return metrics

    def _get_feature_importance(self) -> List[Dict[str, Any]]:
        """
        Extract feature importance from the model.

        Returns:
            List of dictionaries with feature names and importance scores
        """
        importance_list = []

        try:
            if hasattr(self.model, 'feature_importances_'):
                # Tree-based models
                importances = self.model.feature_importances_
            elif hasattr(self.model, 'coef_'):
                # Linear models
                if len(self.model.coef_.shape) > 1:
                    # Multiclass: use mean absolute coefficient
                    importances = np.abs(self.model.coef_).mean(axis=0)
                else:
                    importances = np.abs(self.model.coef_)
            else:
                logger.info("Model does not support feature importance")
                return []

            for feature, importance in zip(self.feature_names, importances):
                importance_list.append({
                    'feature': feature,
                    'importance': float(importance)
                })

            # Sort by importance
            importance_list.sort(key=lambda x: x['importance'], reverse=True)

        except Exception as e:
            logger.error(f"Error calculating feature importance: {e}")

        return importance_list

    def save_model(self, filepath: str):
        """
        Save the trained model to disk.

        Args:
            filepath: Path to save the model
        """
        if self.model is None:
            raise ValueError("No model to save. Train a model first.")

        # Create model bundle
        model_bundle = {
            'model': self.model,
            'scaler': self.scaler,
            'label_encoder': self.label_encoder,
            'feature_names': self.feature_names,
            'algorithm': self.algorithm,
            'problem_type': self.problem_type
        }

        # Save using joblib
        joblib.dump(model_bundle, filepath)
        logger.info(f"Model saved to {filepath}")

    @staticmethod
    def load_model(filepath: str) -> 'MLTrainer':
        """
        Load a trained model from disk.

        Args:
            filepath: Path to the saved model

        Returns:
            MLTrainer instance with loaded model
        """
        model_bundle = joblib.load(filepath)

        trainer = MLTrainer(
            algorithm=model_bundle['algorithm'],
            problem_type=model_bundle['problem_type'],
            hyperparameters={}
        )
        trainer.model = model_bundle['model']
        trainer.scaler = model_bundle['scaler']
        trainer.label_encoder = model_bundle['label_encoder']
        trainer.feature_names = model_bundle['feature_names']

        logger.info(f"Model loaded from {filepath}")
        return trainer


def main():
    """
    Main function for training ML models.
    Expected to be called with JSON configuration.
    """
    if len(sys.argv) < 2:
        print("Usage: python ml_trainer.py <config_json>")
        sys.exit(1)

    try:
        # Parse configuration
        config = json.loads(sys.argv[1])

        dataset_path = config['dataset_path']
        target_column = config['target_column']
        algorithm = config['algorithm']
        problem_type = config['problem_type']
        hyperparameters = config.get('hyperparameters', {})
        train_test_split_ratio = config.get('train_test_split', 0.8)
        model_output_path = config['model_output_path']

        # Load dataset
        logger.info(f"Loading dataset from {dataset_path}")
        df = pd.read_csv(dataset_path)

        # Validate target column
        if target_column not in df.columns:
            raise ValueError(f"Target column '{target_column}' not found in dataset")

        # Split features and target
        X = df.drop(columns=[target_column])
        y = df[target_column]

        # Train-test split
        logger.info(f"Splitting data: {train_test_split_ratio*100}% train, {(1-train_test_split_ratio)*100}% test")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            train_size=train_test_split_ratio,
            random_state=42,
            stratify=y if problem_type == 'classification' else None
        )

        # Initialize trainer
        trainer = MLTrainer(algorithm, problem_type, hyperparameters)

        # Train model
        results = trainer.train(X_train, X_test, y_train, y_test)

        # Save model
        trainer.save_model(model_output_path)

        # Output results as JSON
        output = {
            'success': True,
            'metrics': results['metrics'],
            'feature_importance': results['feature_importance'],
            'training_duration': results['training_duration'],
            'model_path': model_output_path
        }

        print(json.dumps(output))

    except Exception as e:
        logger.error(f"Training failed: {str(e)}", exc_info=True)
        output = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(output))
        sys.exit(1)


if __name__ == '__main__':
    main()
