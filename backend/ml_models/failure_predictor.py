import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
import pickle
import os

class StudentFailurePredictor:
    def __init__(self, model_path='ml_models/model.pkl'):
        self.model_path = model_path
        self.model = None
        self.load_model()

    def generate_synthetic_data(self, samples=1000):
        """Generates synthetic data for student performance prediction."""
        np.random.seed(42)
        data = {
            'study_hours': np.random.uniform(1, 10, samples),
            'attendance_rate': np.random.uniform(0.5, 1.0, samples),
            'previous_score': np.random.uniform(20, 100, samples),
            'engagement_score': np.random.uniform(0, 100, samples),
            'failed': []
        }
        
        for i in range(samples):
            # Logic: higher study hours, attendance and score reduce failure chance
            risk = (10 - data['study_hours'][i]) * 0.5 + \
                   (1.0 - data['attendance_rate'][i]) * 10 + \
                   (100 - data['previous_score'][i]) * 0.1
            
            # Add some randomness
            risk += np.random.normal(0, 2)
            data['failed'].append(1 if risk > 12 else 0)
            
        return pd.DataFrame(data)

    def train_model(self):
        """Trains a Logistic Regression model on synthetic or provided data."""
        df = self.generate_synthetic_data()
        X = df[['study_hours', 'attendance_rate', 'previous_score', 'engagement_score']]
        y = df['failed']
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        self.model = LogisticRegression()
        self.model.fit(X_train, y_train)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        with open(self.model_path, 'wb') as f:
            pickle.dump(self.model, f)
        
        print(f"Model trained and saved to {self.model_path}")

    def load_model(self):
        if os.path.exists(self.model_path):
            with open(self.model_path, 'rb') as f:
                self.model = pickle.load(f)
            print(f"Model loaded from {self.model_path}")
        else:
            print("No saved model found. Preparing to train...")
        
    def predict(self, data):
        """
        Predicts failure risk.
        Input: list of [study_hours, attendance_rate, previous_score, engagement_score]
        """
        if self.model is None:
            self.train_model()
            # Reload to fix the pickle.dump error in __init__ if I didn't fix it there
            with open(self.model_path, 'rb') as f:
                self.model = pickle.load(f)
                
        prediction = self.model.predict([data])
        probability = self.model.predict_proba([data])[0][1]
        return int(prediction[0]), float(probability)

if __name__ == "__main__":
    predictor = StudentFailurePredictor()
    predictor.train_model()
    # Test prediction
    res, prob = predictor.predict([5, 0.8, 60, 50])
    print(f"Test Prediction: {'Fail' if res else 'Pass'} (Risk Probability: {prob:.2f})")
