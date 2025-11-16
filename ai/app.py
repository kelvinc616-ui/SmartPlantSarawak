from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image, ImageOps
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
    return "<h3> SmartPlantSarawak AI Backend</h3><p>Use <b>/predict</b> to send an image and get a prediction.</p>"

# ---------------------------
# Image Preprocessing Function
# ---------------------------
def preprocess_image(file):
    # Read image bytes from request
    image_bytes = file.read()
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Fix mobile rotation issues (EXIF)
    img = ImageOps.exif_transpose(img)

    # Resize to match training input
    img = img.resize((224, 224))

    # Convert to numpy array and preprocess
    img_array = np.expand_dims(np.array(img), axis=0).astype(np.float32)
    img_array = tf.keras.applications.mobilenet_v3.preprocess_input(img_array)

    print(f"🖼️ Image processed: shape={img_array.shape}, dtype={img_array.dtype}, "
          f"range=({np.min(img_array):.2f}, {np.max(img_array):.2f})")

    return img_array

# ---------------------------
# Predict Endpoint
# ---------------------------
@app.route("/predict", methods=["POST"])
def predict():
    try:
        img = None

        # Case 1️⃣: File directly uploaded via multipart/form-data
        if "file" in request.files:
            file = request.files["file"]
            if file.filename == "":
                return jsonify({"error": "Empty file name"}), 400
            img = file

        # Case 2️⃣: JSON payload with Firebase Storage URL
        elif request.is_json and "image_url" in request.json:
            image_url = request.json["image_url"]
            import requests, io
            response = requests.get(image_url)
            if response.status_code != 200:
                return jsonify({"error": f"Failed to fetch image from URL ({response.status_code})"}), 400
            img = io.BytesIO(response.content)

        else:
            return jsonify({"error": "No image provided (file or image_url required)"}), 400

        # Preprocess the image
        img_array = preprocess_image(img)

        # Perform prediction
        preds = model.predict(img_array)[0]  # shape: (num_classes,)

        # Sort predictions by confidence
        top_indices = np.argsort(preds)[::-1][:3]  # Top 3 descending order
        top_labels = [labels[i] for i in top_indices]
        top_confidences = [float(preds[i]) * 100 for i in top_indices]

        # Build full response
        top_predictions = [
            {"label": lbl, "confidence": round(conf, 2)}
            for lbl, conf in zip(top_labels, top_confidences)
        ]

        # Best (Top-1) result
        best_label = top_labels[0]
        best_confidence = round(top_confidences[0], 2)

        result = {
            "predicted_label": best_label if best_confidence >= 50 else "Unknown",
            "confidence": best_confidence,
            "top_predictions": top_predictions,
            "model_version": MODEL_VERSION,
            "timestamp": datetime.utcnow().isoformat()
        }

        print("\nTop-3 Predictions:")
        for rank, (lbl, conf) in enumerate(zip(top_labels, top_confidences), 1):
            print(f"  {rank}. {lbl} ({conf:.2f}%)")
        print(f"Final Prediction: {result['predicted_label']} ({result['confidence']}%)\n")

        return jsonify(result)

    except Exception as e:
        print("Prediction Error:", str(e))
        return jsonify({"error": str(e)}), 500



# ---------------------------
# Run the App
# ---------------------------
if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)
