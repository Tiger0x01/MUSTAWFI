<p align="center">
  <img src="assets/mus_logo.png" alt="MUSTAWFI Logo" width="65%">
</p>


<p align="center">
  <strong>Smart Loan Eligibility Intelligence</strong><br>
  <em>A cutting-edge platform combining Computer Vision and Machine Learning to automate and predict loan application eligibility.</em>
</p>

<p align="center">
  <a href="#about-the-project">About</a> •
  <a href="#system-flow">System Flow</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a>
</p>

---

## 🖥️ Main Interface

<p align="center">
  <img src="assets/main_page.png" alt="MUSTAWFI Main Interface" width="950">
</p>

## 💡 About the Project

**MUSTAWFI** (مُستوفِي) is an intelligent document-processing pipeline designed to modernize the loan application workflow. Instead of manual data entry and subjective evaluation, MUSTAWFI allows institutions to upload raw, handwritten, or printed loan applications. 

The system leverages **Computer Vision** to detect, align, and extract structured data from the forms. It then introduces a **Human-in-the-Loop** verification step before passing the validated data to a robust **Machine Learning** model that predicts the applicant's eligibility based on historical credit data.

### Key Features
- **Intelligent OCR & Alignment:** Automatically crops, aligns, and extracts data from application form images.
- **Human Checkpoint:** A sleek UI for reviewers to verify and edit extracted fields before final prediction.
- **ML-Powered Prediction:** Predicts loan eligibility and provides confidence scores and visual factor breakdowns.
- **Bilingual Interface:** Fully supports both English and Arabic (RTL) with seamless switching.

---

## 🔄 System Flow

<p align="center">
  <img src="assets/flow.png" alt="MUSTAWFI System Flow" width="950">
</p>

The intelligence pipeline consists of 4 main stages:
1. **Upload:** Secure intake of the document image.
2. **Computer Vision (Extraction):** The backend aligns the form, isolates character boxes, and predicts digits/text.
3. **Validation (Human-in-the-loop):** Extracted data is presented to the user for rapid review and correction.
4. **Machine Learning (Prediction):** Confirmed data is evaluated against an ML model to determine eligibility.

---

## 🛠️ Tech Stack

### Frontend (User Interface)
- **Framework:** [TanStack Start](https://tanstack.com/start) / React 19
- **Styling:** Tailwind CSS v4, Framer Motion
- **Components:** shadcn/ui, Radix Primitives
- **State/Routing:** TanStack Router, React Context

### Backend (Computer Vision & ML)
- **Framework:** FastAPI (Python)
- **Computer Vision:** OpenCV, NumPy
- **Machine Learning:** Scikit-Learn (Classification models)
- **Document Processing:** Custom OCR & Morphological transformations

---

## 📂 Project Structure

```text
MUSTAWFI/
├── assets/         # Static assets (Logos, Screenshots, Diagrams)
├── backend/        # FastAPI server, Computer Vision pipeline, ML models
├── frontend/       # TanStack React application
└── notebooks/      # Jupyter notebooks for ML model training and CV testing
````

## 🚀 Getting Started

To run this project locally, you will need **Node.js** and **Python 3.10+**.

  

### 1. Clone the repository

Bash

```
git clone [https://github.com/yourusername/MUSTAWFI.git](https://github.com/yourusername/MUSTAWFI.git)
cd MUSTAWFI
```

### 2. Setup the Backend

Bash

```
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
uvicorn main:app --reload
```

_The backend API will be available at `http://localhost:8000`_

  

### 3. Setup the Frontend

Open a new terminal window:

  

Bash

```
cd frontend
npm install
npm run dev
```

_The frontend will be available at `http://localhost:3000`_

  

## 👨‍💻 Developer

**Developed by: [Mohamed Zakaria Elnemr](https://www.linkedin.com/in/tiger0x01/?utm_source=gemini)**

  

Computer Science & AI Engineer passionate about building end-to-end intelligent systems.
