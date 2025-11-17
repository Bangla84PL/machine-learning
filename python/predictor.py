"""
Prediction Script for ML Insights Platform

This script handles making predictions using trained models.
"""

import sys
import json
import logging
import pandas as pd
import numpy as np
from ml_trainer import MLTrainer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def predict(model_path: str, input_data_path: str, output_path: str) -> dict:
    """
    Make predictions using a trained model.

    Args:
        model_path: Path to the saved model
        input_data_path: Path to input CSV file
        output_path: Path to save predictions

    Returns:
        Dictionary with prediction results
    """
    try:
        # Load model
        logger.info(f"Loading model from {model_path}")
        trainer = MLTrainer.load_model(model_path)

        # Load input data
        logger.info(f"Loading input data from {input_data_path}")
        df = pd.read_csv(input_data_path)

        # Validate features
        missing_features = set(trainer.feature_names) - set(df.columns)
        if missing_features:
            raise ValueError(f"Missing required features: {missing_features}")

        # Select and reorder features
        X = df[trainer.feature_names]

        # Preprocess data (same as training)
        from sklearn.preprocessing import LabelEncoder
        categorical_cols = X.select_dtypes(include=['object', 'category']).columns
        if len(categorical_cols) > 0:
            for col in categorical_cols:
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col].astype(str))

        # Apply scaling if model was trained with scaling
        if trainer.scaler is not None:
            X_scaled = trainer.scaler.transform(X)
            X = pd.DataFrame(X_scaled, columns=X.columns)

        # Make predictions
        logger.info("Making predictions...")
        predictions = trainer.model.predict(X.values)

        # Get prediction probabilities if available
        if hasattr(trainer.model, 'predict_proba'):
            probabilities = trainer.model.predict_proba(X.values)
            if trainer.problem_type == 'classification' and trainer.label_encoder is not None:
                # Decode predictions
                predictions = trainer.label_encoder.inverse_transform(predictions)
        else:
            probabilities = None

        # Create output dataframe
        output_df = df.copy()
        output_df['prediction'] = predictions

        if probabilities is not None:
            # Add confidence score (max probability)
            output_df['confidence'] = probabilities.max(axis=1)

            # For binary classification, add probability columns
            if probabilities.shape[1] == 2:
                output_df['probability_class_0'] = probabilities[:, 0]
                output_df['probability_class_1'] = probabilities[:, 1]

        # Save predictions
        logger.info(f"Saving predictions to {output_path}")
        output_df.to_csv(output_path, index=False)

        return {
            'success': True,
            'prediction_count': len(predictions),
            'output_path': output_path
        }

    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}", exc_info=True)
        return {
            'success': False,
            'error': str(e)
        }


def main():
    """Main function for making predictions."""
    if len(sys.argv) < 2:
        print("Usage: python predictor.py <config_json>")
        sys.exit(1)

    try:
        # Parse configuration
        config = json.loads(sys.argv[1])

        model_path = config['model_path']
        input_data_path = config['input_data_path']
        output_path = config['output_path']

        # Make predictions
        result = predict(model_path, input_data_path, output_path)

        # Output results as JSON
        print(json.dumps(result))

        if not result['success']:
            sys.exit(1)

    except Exception as e:
        logger.error(f"Prediction script failed: {str(e)}", exc_info=True)
        output = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(output))
        sys.exit(1)


if __name__ == '__main__':
    main()
