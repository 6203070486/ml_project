from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os

# Initialize app
app = Flask(__name__)
CORS(app)

# Safe model path (works locally + on Render)
MODEL_PATH = os.path.join(os.path.dirname(__file__), "irrigation_model.pkl")

# Check if model exists
if not os.path.exists(MODEL_PATH) or os.path.getsize(MODEL_PATH) == 0:
    raise RuntimeError(
        f"'{MODEL_PATH}' is missing or empty. Please ensure your model file is present."
    )

# Load model
model = joblib.load(MODEL_PATH)
print("✅ Model loaded successfully.")

# Home route
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "AquaAI backend is running",
        "message": "Welcome to Smart Irrigation Prediction API"
    })

# Prediction route
@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True)

    # Check JSON
    if not data:
        return jsonify({"error": "Invalid or missing JSON body"}), 400

    # Required fields
    required_fields = ["temperature", "humidity", "soil_moisture", "rainfall"]
    missing = [field for field in required_fields if field not in data]

    if missing:
        return jsonify({
            "error": f"Missing fields: {missing}"
        }), 400

    try:
        # Convert input values
        temperature = float(data["temperature"])
        humidity = float(data["humidity"])
        soil_moisture = float(data["soil_moisture"])
        rainfall = float(data["rainfall"])

        # Prepare input for model
        features = np.array([
            temperature,
            humidity,
            soil_moisture,
            rainfall
        ]).reshape(1, -1)

    except (ValueError, TypeError) as e:
        return jsonify({
            "error": f"Invalid input values: {str(e)}"
        }), 400

    try:
        # Make prediction
        prediction = model.predict(features)[0]
        probabilities = model.predict_proba(features)[0]
        confidence = float(max(probabilities))

        # Response
        result = {
            "prediction": int(prediction),
            "confidence": round(confidence, 4),
            "label": "💧 Irrigation Needed" if prediction == 1 else "✅ No Irrigation Needed"
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({
            "error": f"Prediction failed: {str(e)}"
        }), 500


# Run server (for Render + local)
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)