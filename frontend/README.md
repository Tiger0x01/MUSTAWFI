# مُستوفِي - Frontend Application

واجهة مستخدم ذكية ومدروسة لتطبيق **مُستوفِي (MUSTAWFI)** المخصصة لرفع طلبات القروض، متابعة حالة المعالجة، مراجعة البيانات المستخرجة (Human Checkpoint)، وعرض توقعات الأهلية بذكاء.

---

## 🔄 User Journey & Flow

<p align="center">
  <img src="../assets/front_flow.png" alt="Frontend Journey Flow" width="100%">
</p>

1. **الرفع / التقاط الكاميرا (`Upload`)**: رفع صورة الطلب (JPG, PNG, WEBP) أو الالتقاط المباشر بكاميرا الويب.
2. **المعالجة البصرية (`Processing`)**: واجهة محاكاة تفاعلية تعرض خطوات مسح وتطابق المستند.
3. **المراجعة البشرية (`Review Checkpoint`)**: مراجعة وتعديل الحقول المستخرجة مقسمة لمجموعات (شخصية، قرض، ائتمان) مع شارات تحقق.
4. **النتيجة والتحليل (`Result & Insights`)**: حلقة الثقة (Confidence Ring)، تحليل العوامل المؤثرة، تحميل تقرير PDF، وإعادة الفحص.

---

## 🛠️ Tech Stack

- **Framework**: TanStack Start / React 19 (`SSR / SPA`)
- **Routing**: TanStack Router (File-based routing)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`), custom oklch glassmorphism design system
- **Animations**: `motion` (Framer Motion)
- **UI Primitives**: Radix UI primitives (`dialog`, `tooltip`, `accordion`, `dropdown-menu`, etc.)
- **Icons**: Lucide React
- **Forms/Validation**: React Hook Form, Zod (`@hookform/resolvers`)

---

## 📁 Project Structure (`src/`)

```text
src/
├── api/                    # API client layer & contracts
│   ├── client.ts           # Fetch wrapper with auto-blob support for PDF reports
│   ├── types.ts            # TypeScript interfaces for payloads/responses
│   └── application.ts      # Upload, extract, confirm, predict & report hooks
├── components/
│   ├── ui/                 # Reusable Radix/Tailwind design system primitives
│   ├── core.tsx            # Layout shells, Navbar, Footer, JourneyBar
│   ├── upload.tsx          # Drag-and-drop zone + live MediaStream webcam capture modal
│   └── application.tsx     # Processing visualizer, Review form groups, Confidence ring, Result breakdown
├── context/
│   └── ApplicationContext.tsx # Global state machine (sessionStorage persistence, theme, i18n)
├── hooks/
│   └── use-mobile.tsx      # Responsive breakpoint hook
├── lib/
│   ├── i18n.ts             # Bilingual dictionary (Arabic RTL & English LTR)
│   ├── utils.ts            # Class merging & Eastern/Arabic numerals converter
│   └── error-capture.ts    # SSR & error boundary diagnostics
├── routes/                 # File-based routes (TanStack Start)
│   ├── __root.tsx          # Root shell, providers, SEO meta, 404/Error boundaries
│   ├── index.tsx           # Landing page (Hero + Pipeline + Features)
│   ├── about.tsx           # Architecture & privacy overview
│   └── analyze/            # Multi-step analysis flow layout & pages
├── styles.css              # Global styles, oklch themes, glassmorphism, print media queries
└── start.ts                # TanStack Start & CSRF middleware config

```

---

## 🌐 Bilingual & RTL Support

* دعم كامل للغة العربية (`dir="rtl"`) والإنجليزية (`dir="ltr"`) عبر `ApplicationContext` و `i18n.ts`.
* تحويل تلقائي للأرقام للنمط العربي عند اللزوم (`toArabicDigits`).

---

## 🚀 Getting Started

### 1. Environment Setup

create a `.env` file inside the `frontend` root:

```env
VITE_API_BASE_URL=http://localhost:8000

```

> *Note: If `VITE_API_BASE_URL` is omitted, the app automatically switches to rich interactive demo/mock mode.*

### 2. Install Dependencies

```bash
npm install

```

### 3. Run Development Server

```bash
npm run dev

```

Open [http://localhost:3000](http://localhost:3000?utm_source=gemini) to view the app.

### 4. Production Build

```bash
npm run build
npm run preview

```
