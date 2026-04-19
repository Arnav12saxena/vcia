🐄 Indian Cattle Breed Identification using YOLOv8x + EfficientNetV2-S
🧬 A Two-Stage Computer Vision Pipeline for Fine-Grained Breed Classification
This project presents a two-stage deep learning pipeline for automatic identification of Indian indigenous cattle breeds from real-world farm images.
It integrates:

YOLOv8x (COCO-pretrained) for cattle region extraction
EfficientNetV2-S for fine-grained breed classification
Despite severe dataset issues and minimal high-quality crops, the classifier achieves:

Top-1 Accuracy: ~78%
Top-5 Accuracy: ~98%
Macro F1-Score: ~0.78
📌 Introduction
Breed identification plays a critical role in:

Livestock productivity
Feeding and breeding optimization
Genetic conservation
Health monitoring
However, India’s bovine datasets suffer from:

Mixed cattle and buffalo species
Non-standardized backgrounds
High intra-class variation
Very similar-looking breeds
Partial-body images
Class imbalance
This project addresses these issues through a two-stage workflow:

🐮 YOLOv8x (COCO pretrained)
Used only as a detector to crop cattle from raw images.

🌾 EfficientNetV2-S
Fine-tuned for multi-class Indian cattle breed classification.

This is one of the few experimental works focusing on Indian indigenous breeds.

🎯 Experimental Objective
The goal was to build a robust end-to-end pipeline that can:

Detect cattle in real-world images
Generate consistent YOLO-based crops
Classify breeds using EfficientNetV2-S
Handle non-ideal conditions
Test feasibility of field deployment
⚠️ Not Attempted: Body Condition Score (BCS)
BCS requires side-view images, pose estimation, and labeled BCS datasets.
These were not available.

🗂 Dataset Description
📥 Source
Kaggle: Indian Bovine Breeds Dataset
Contains both cattle and buffalo images.

⚠️ Raw Dataset Problems
Mixed buffalo and cow species
Class imbalance
Partial-body visibility
Real-world farm backgrounds
High inter-breed similarity
Inconsistent viewpoints
🧹 Final Dataset After Cleaning
Buffalo classes removed
16 cattle breeds retained
YOLO crops generated using yolov8x.pt
Crops manually verified
📊 Final Image Split
Split	Count
Train	2176
Validation	625
Test	318
Stored in: final_class_distribution.csv

🔧 Methodology
🐮 Stage 1 — YOLOv8x Detection
YOLOv8x COCO was used without retraining:

from ultralytics import YOLO
detector = YOLO("yolov8x.pt")
🔍 Key Observations
COCO has only one generic cow class
Indian breeds vary drastically
~0.5% successful detections on raw dataset
Frequent detection failures:
Head-only detections
Missed animals
False positives
Even so, enough clean crops were gathered.

🖼 Figure 1: Example YOLO Crops
(from cow_crops/)

Example YOLO Crops

🖼 Figure 2: Detection Success vs Failure
(from figure2_fallback.png)

Detection Success vs Failure

🌾 Stage 2 — EfficientNetV2-S Classification
⚙️ Training Configuration
Input: 256×256
Optimizer: Adam
Loss: SparseCategoricalCrossentropy
Batch size: 16–32
🚀 Two-Phase Training
🔵 Phase 1 — Feature Adaptation (12 epochs)
Higher LR
Adapt pretrained backbone
🟢 Phase 2 — Fine-Tuning (15 epochs)
Lower LR
Reduced overfitting
Stable convergence
Final model saved as:
efficientnet_v2s_final.keras

📈 Results & Evaluation
🏆 Overall Performance
Metric	Score
Top-1 Accuracy	~78%
Top-5 Accuracy	98.1%
Macro F1-Score	~0.78
Test Accuracy	0.75786
📌 Interpretation
Strong generalization
Reliable under noisy backgrounds
Captures fine visual differences
📉 Training Curves
Found in /results/:

EfficientNet Training Accuracy
EfficientNet Training Loss
Training Accuracy Training Loss

🔢 Confusion Matrix
Includes:

Confusion Matrix
Normalized Confusion Matrix
Confusion Matrix Normalized Confusion Matrix

⚠️ Major Confusions
Hallikar ↔ Bargur
Ongole ↔ Deoni
Jersey ↔ Brown Swiss
Reasons: visual similarity, partial crops, imbalance.

🐄 Per-Class Performance
Strongest:

🟢 Banni — 100%
🟢 Holstein — 100%
Toda — 85%
Brown Swiss — 83%
Sahiwal — 81%
Weakest:

🔴 Ongole — 58%
🔴 Jersey — 62%
🟠 Bargur — 66%
🧪 Qualitative Prediction Grid
Image: Prediction_Grid (4x6).png
Displays correct, incorrect, and borderline samples.

Prediction Grid

💡 System Effectiveness
High accuracy despite dataset noise
Robust cattle detection + fine-grained classification
Works well in cluttered farm backgrounds
Practical foundation for livestock monitoring systems
⚠️ Limitations
🟥 Detection
YOLO COCO cannot detect Indian cattle reliably
Very low detection success
Head-only crops & missed detections
🟨 Classification
Several breeds visually identical
Partial visibility reduces accuracy
Class imbalance impacts learning
🐄 BCS (Body Condition Score)
No side-view images
No labeled BCS dataset
Requires pose estimation
🚀 Future Scope
Train YOLO on Indian cattle
Add pose estimation (HRNet, MediaPipe)
Use segmentation for precise masks
Extend to BCS prediction
Upgrade model to Swin-ViT / CoAtNet
Add TTA, SAM, or metric learning
Build an on-field mobile/edge deployment
🏁 Conclusion
A two-stage system was developed using:

YOLOv8x for cattle detection
EfficientNetV2-S for breed classification
Despite data limitations, it achieved:

~78% Top-1 Accuracy
98% Top-5 Accuracy
~0.78 Macro F1 Score
A strong baseline for:

Automated livestock identification
Precision agriculture
Smart dairy & cattle monitoring
📁 Project Structure
cattle-detection-classification/
│── Final_cattle_model.ipynb
│── class_distribution_final_16.py
│── final_class_distribution.py
│── Global_Classification_Metrics.csv
│── classification_report.txt
│── per_class_accuracy.csv
│── final_class_distribution.csv
│── Cow_Experimentation_Arnav Saxena.docx
│
├── results/
│   ├── Confusion Matrix.png
│   ├── Normalized Confusion Matrix.png
│   ├── EfficientNet Training Accuracy (Reconstructed).png
│   ├── EfficientNet Training Loss (Reconstructed).png
│   ├── Prediction_Grid (4x6).png
│   ├── figure1_cropped.png
│   └── figure2_fallback.png
│
└── README.md
📬 Contact
Arnav Saxena
🔗 LinkedIn: https://www.linkedin.com/in/arnav-saxena-a9a217367
📧 Email: arnav12saxena@gmail.com
