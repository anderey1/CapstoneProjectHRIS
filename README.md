# CapstoneProjectHRIS: HRIS for DepEd - Lucena City

A comprehensive Human Resource Information System (HRIS) featuring HR Management, Descriptive Analytics, and innovative Geospatial/AI integrations, tailored for DepEd - Lucena City.

## Overview
This system is designed to streamline HR operations for government agencies with multiple schools. Key features include:
- **Attendance Management:** QR code scan with Geo-validation (Haversine formula).
- **Payroll System:** Cutoff-based processing with statutory deductions and PDF payslips.
- **Leave Management:** Application and tracking of Sick, Vacation, and Emergency leaves.
- **Performance Rating:** AI-powered summaries using the Gemini API.
- **Recruitment Tracking:** Kanban-based applicant flow.
- **Descriptive Analytics:** Data-driven insights and interactive dashboards.
- **PWA Support:** Offline capabilities and mobile-first experience.

---

## Prerequisites
Ensure you have the following installed:
- **Python 3.13+**
- **Node.js (v18+) & npm**
- **PostgreSQL** (Optional: SQLite is configured for local development)

---

## Tech Stack

### Backend
- **Framework:** Django 6.x + Django REST Framework (DRF)
- **Auth:** JWT via `djangorestframework-simplejwt`
- **Database:** SQLite (Dev) / PostgreSQL (Prod)
- **AI:** Google Gemini API (`google-genai`)

### Frontend
- **Framework:** React (Vite) - JS/JSX
- **State Management:** TanStack Query (Server State), React Context (Auth)
- **Styling:** Tailwind CSS + DaisyUI
- **Icons:** Lucide React
- **Maps:** Leaflet.js
- **PWA:** `vite-plugin-pwa`

---

## Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd CapstoneProjectHRIS
```

### 2. Backend Setup
1. **Create Virtual Environment:**
   ```bash
   cd backend
   python -m venv venv
   ```
2. **Activate Virtual Environment:**
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`
3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Environment Variables:**
   Create a `.env` file in the `backend/` directory (see [Environment Variables](#environment-variables) below).
5. **Run Migrations:**
   ```bash
   python manage.py migrate
   ```
6. **Start Server:**
   ```bash
   python manage.py runserver
   ```

### 3. Frontend Setup
1. **Navigate to Frontend:**
   ```bash
   cd ../frontend
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Start Development Server:**
   ```bash
   npm run dev
   ```

---

## Environment Variables

Create a `.env` file in the `backend/` directory with the following template:

```env
# Django Settings
SECRET_KEY=your_django_secret_key_here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (Optional for PostgreSQL)
# DB_NAME=your_db_name
# DB_USER=your_db_user
# DB_PASSWORD=your_db_password
# DB_HOST=localhost
# DB_PORT=5432

# External APIs
GEMINI_API_KEY=your_google_gemini_api_key

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

---

## Project Structure
- `backend/`: Django project files, core app, and business logic.
- `frontend/`: React source code, components, and PWA configuration.
- `docs/`: (If any) Additional documentation and design manuscripts.

## License
[Insert License Information Here]
