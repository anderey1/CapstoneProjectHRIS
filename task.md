# Pre-Oral Prototype (Demo-Ready) Checklist

This task list tracks the development of the missing features required for the Pre-Oral defense.

## 1. Frontend Core & Authentication
- `[ ]` Build Login Page UI (React + Tailwind + DaisyUI)
- `[ ]` Build main Application Shell (Sidebar, Navbar, responsive layout)
- `[ ]` Integrate Login UI with Backend JWT endpoints
- `[ ]` Implement protected routes and role-based redirects

## 2. Dashboard & Analytics (Descriptive Analytics Innovation)
- `[ ]` Develop the 3rd analytics endpoint (e.g., Attendance Trends or Leave Rates)
- `[ ]` Build Frontend Dashboard UI to visualize the 3 charts (Loan Status, Department, +1 new)
- `[ ]` Implement Gemini API integration in `core/utils.py` for HR summary generation
- `[ ]` Build Frontend UI to display the AI-generated HR Analytics executive summary

## 3. Attendance & Geo-Location (GeoSpatial Innovation)
- `[ ]` Create Backend `Attendance` model (employee, date, in/out, lat/lng, status, geo_flag)
- `[ ]` Implement Haversine formula logic in `core/utils.py` for distance validation (< 100m)
- `[ ]` Create Backend endpoint for generating a time-limited daily QR code token
- `[ ]` Create Backend endpoint for processing a mock QR scan (receives token + employee GPS)
- `[ ]` Build Frontend UI for Admin/School to display the daily QR code
- `[ ]` Build Frontend UI for Employees to simulate scanning the QR code and submitting location
- `[ ]` Build Frontend Leaflet.js Map UI to display the school pin and plotted attendance markers

## 4. Performance Rating (AI/ML Innovation)
- `[ ]` Create Backend `PerformanceRating` model (employee, period, scores, rating, ai_summary, promo_flag)
- `[ ]` Implement Gemini API logic in `core/utils.py` to convert numerical scores into an English summary
- `[ ]` Create Backend endpoints for submitting performance reviews
- `[ ]` Build Frontend Form UI for HR to submit employee ratings
- `[ ]` Build Frontend UI to display the AI-generated performance summary and promotion flag

## 5. PWA Functionality
- `[ ]` Configure `manifest.webmanifest` (app name, icons, theme colors) in Vite
- `[ ]` Ensure Service Worker is registered for offline viewing/installation prompt
