# مُستوفِي - Backend Service (Computer Vision & ML Pipeline)

الطبقة الخلفية (Backend) لنظام **مُستوفِي (MUSTAWFI)**، المسؤولة عن معالجة المستندات بالرؤية الحاسوبية (Computer Vision)، استخراج وتنظيف بيانات النماذج اليدوية والمطبوعة، تطبيق قواعد التحقق، وتشغيل نموذج تعلم الآلة (Machine Learning) للتنبؤ بأهلية القرض وإصدار التقرير.

---

## 🔄 Processing Pipeline Flow

<p align="center">
  <img src="../assets/back_flow.png" alt="Backend Processing Flow" width="100%">
</p>

المسار البرمجي لمعالجة الطلب:
1. **Intake & Alignment (`imaging.py`)**: قراءة الصورة، مقارنتها بـ Reference، وتنفيذ محاذاة تلقائية (`align_photo`).
2. **Ink Scoring & Extraction (`pipeline.py`)**: اقتطاع مربعات الأرقام والاختيارات (`crop`), حساب كثافة الحبر (`ink_score`), ومعالجة المورفولوجيا لمنع الخلط البصري (مثل 0 و 9).
3. **Feature Row Builder**: بناء صف الميزات الموحد (`build_feature_row`) وتجهيز النسب الائتمانية.
4. **ML Inference & Reporting**: تقييم البيانات المعتمدة عبر نماذج التصنيف وإخراج تقرير PDF.

---

## 🛠️ Tech Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (High-performance async Python API)
- **Computer Vision & Imaging**: OpenCV (`cv2`), NumPy
- **OCR / Parsing**: Custom morphological ink mask, connected components & OCR config whitelist
- **Machine Learning**: Scikit-Learn (Classification models & feature pipelines)
- **Data Validation**: Pydantic schemas

---

## 📁 Project Structure (`backend/`)

```text
backend/
├── cv/                     # Computer Vision & Loan Form Extraction module
│   ├── __init__.py
│   ├── layout.py           # Coordinates, bounding rects, and spec definitions
│   ├── imaging.py          # Image reading, alignment, ink masking & tensor normalization
│   └── pipeline.py         # FormExtractor class, RealDigitRecognizer & feature builder
├── model/                  # Serialized ML model binaries/checkpoints
├── uploads/                # Runtime file storage (`.gitkeep` tracked)
├── main.py                 # FastAPI application & REST endpoint routers
├── schemas.py              # Pydantic request/response contracts
├── utils.py                # Helper utilities and file handlers
├── requirements.txt        # Python package dependencies
└── .env                    # Environment configuration

```

---

## 🔌 Core API Endpoints

* `POST /applications`: Upload raw application image.
* `POST /applications/{id}/extract`: Execute CV/OCR pipeline and return structured fields with confidence scores.
* `PUT /applications/{id}/confirm`: Commit user-verified/edited field values.
* `POST /applications/{id}/predict`: Run ML eligibility prediction model.
* `GET /applications/{id}/report`: Stream downloadable evaluation PDF report.

---

## 🚀 Getting Started

### 1. Environment Setup

Create and activate a Python virtual environment:

```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

```

### 2. Install Dependencies

```bash
pip install -r requirements.txt

```

### 3. Run Development Server

```bash
uvicorn main:app --reload --port 8000

```

Interactive API docs available at: `http://localhost:8000/docs` (Swagger UI)

```
