from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
from datetime import datetime
import io
import json
import time
import os

# ---------------------------
# App Initialization
# ---------------------------
app = Flask(__name__)
CORS(app)

MODEL_PATH = "final_mobilenetv3_finetuned.keras"
LABELS_PATH = "labels.json"

# ---------------------------
# Load Model and Labels
# ---------------------------
start_time = time.time()
model = tf.keras.models.load_model(MODEL_PATH)
load_time = round(time.time() - start_time, 2)

with open(LABELS_PATH, "r") as f:
    labels = json.load(f)

MODEL_VERSION = "v1"

print(f"Model loaded: {MODEL_PATH}")
print(f"Labels loaded: {len(labels)} classes")
print(f"Load time: {load_time} seconds")

# ---------------------------
# Health Check
# ---------------------------
@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "model": {
            "model_path": MODEL_PATH,
            "model_version": MODEL_VERSION,
            "tf_version": tf.__version__,
            "loaded_in_seconds": load_time
        }
    })

# ---------------------------
# Version Endpoint
# ---------------------------
@app.route("/version")
def version():
    return jsonify({"model_version": MODEL_VERSION})

# ---------------------------
# Home Page
# ---------------------------
@app.route("/")
def index():
    return "<h3> SmartPlantSarawak AI Backend</h3><p>Use /predict to send an image and get a prediction.</p>"

# ---------------------------
# Predict Endpoint
# ---------------------------
@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file part in request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    try:
        # Load and preprocess the image
        img = Image.open(io.BytesIO(file.read())).convert("RGB")
        img = img.resize((224, 224))  # Adjust if your model uses a different size
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        labels = json.load(open("labels.json"))
        print(len(labels))
        
        # Predict
        preds = model.predict(img_array)
        print("Raw probabilities:", preds[0])
        print("Argmax index:", np.argmax(preds[0]))
        pred_index = int(np.argmax(preds))
        confidence = float(np.max(preds))

        result = {
            "predicted_label": labels[pred_index] if pred_index < len(labels) else "Unknown",
            "confidence": round(confidence * 100, 2),
            "model_version": MODEL_VERSION
        }

        print(f" Prediction: {result['predicted_label']} ({result['confidence']}%)")
        return jsonify(result)

    except Exception as e:
        print(" Prediction Error:", str(e))
        return jsonify({"error": str(e)}), 500

# @app.route("/predict", methods=["POST"])
# def predict():
#     if "file" not in request.files:
#         return jsonify({"error": "no file"}), 400
#     file = request.files["file"]
#     if file.filename == "":
#         return jsonify({"error": "empty file"}), 400

#     # Load & preprocess image
#     img = Image.open(file.stream).convert("RGB")
#     img = img.resize((224, 224))
#     x = np.expand_dims(np.array(img) / 255.0, axis=0)

#     preds = model.predict(x)
#     i = int(np.argmax(preds[0]))
#     conf = float(preds[0][i]) * 100
#     label = labels[i] if i < len(labels) else "Unknown"

#     # low-confidence threshold
#     if conf < 60:
#         label = "Unknown"

#     result = {
#         "predicted_label": label,
#         "confidence": round(conf, 2),
#         "model_version": "v1",
#         "timestamp": datetime.utcnow().isoformat()
#     }
#     print("✅ Prediction:", result)
#     return jsonify(result)

# ---------------------------
# Run the App
# ---------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=True)
