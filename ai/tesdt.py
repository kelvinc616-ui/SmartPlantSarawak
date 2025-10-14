import tensorflow as tf
import numpy as np
from PIL import Image
from tensorflow.keras.applications.mobilenet_v3 import preprocess_input

labels = [
  "Ageratum_conyzoides", 
  "Amaranthus_albus", 
  "Amaranthus_deflexus", 
  "Bidens_frondosa", 
  "Carpesium_abrotanoides", 
  "Cuscuta_campestris", 
  "Cyperus_iria", 
  "Echinochloa_crus-galli", 
  "Erigeron_canadensis", 
  "Heliotropium_europaeum", 
  "Salvia_officinalis", 
  "Schistidium_crassipilum", 
  "Setaria_viridis", 
  "Sorghum_halepense"
]

model = tf.keras.models.load_model("final_mobilenetv3_finetuned.keras")
img = Image.open("test_plant_img2.jpg").convert("RGB").resize((224,224))
x = np.expand_dims(np.array(img), 0)
x = preprocess_input(x)
preds = model.predict(x)


predicted_index = np.argmax(preds[0])
confidence = preds[0][predicted_index] * 100
print(f"Prediction: {labels[predicted_index]} ({confidence:.2f}%)")
