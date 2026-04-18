import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib

np.random.seed(42)
n = 1000

temperature  = np.random.uniform(10, 45, n)
humidity     = np.random.uniform(10, 100, n)
soil_moisture = np.random.uniform(5, 100, n)
rainfall     = np.random.uniform(0, 150, n)

# Irrigation needed when soil is dry AND little rain AND hot/low humidity
irrigation = (
    (soil_moisture < 40) &
    (rainfall < 20) &
    ((temperature > 30) | (humidity < 40))
).astype(int)

X = np.column_stack([temperature, humidity, soil_moisture, rainfall])
y = irrigation

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

acc = accuracy_score(y_test, model.predict(X_test))
print(f"Model trained — Accuracy: {acc*100:.2f}%")

joblib.dump(model, "irrigation_model.pkl")
print("Model saved to irrigation_model.pkl")
