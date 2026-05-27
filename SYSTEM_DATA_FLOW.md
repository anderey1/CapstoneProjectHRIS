# DepEd Lucena HRIS — System Data Flow

A simple guide to how information moves through the HRIS prototype.

## 1. High-Level Architecture
The system follows a standard **Client-Server** model:
*   **Frontend (React + Vite):** The user interface where staff and admins interact.
*   **Backend (Django + DRF):** The "brain" that processes logic, security, and database operations.
*   **Database (SQLite/PostgreSQL):** Where all employee, payroll, and loan records are stored.

---

## 2. Secure Access (Authentication)
1.  **Login:** User enters credentials on the Frontend.
2.  **Verification:** Frontend sends a POST request to `/api/token/`.
3.  **Token Issued:** Backend verifies and returns a **JWT (JSON Web Token)**.
4.  **Storage:** Frontend saves this token in `localStorage`.
5.  **Role Identity:** The `AuthContext` reads the token to know if you are an `ADMIN`, `HR`, `ACCOUNTANT`, `SUPERVISOR`, or `EMPLOYEE`.

---

## 3. Core Feature Flows

### A. Attendance (QR & Geo-Validation)
1.  **Scan:** Employee triggers a scan on the Frontend.
2.  **GPS Check:** Frontend captures the user's current Latitude/Longitude.
3.  **Validation:** Backend compares user location vs. assigned School location (using the **Haversine formula**).
4.  **Flagging:** 
    *   If **Inside** range: Recorded as "Validated".
    *   If **Outside** range: Recorded but marked as **"Flagged"** (Geo-Flag).
5.  **Storage:** Record is saved in the `Attendance` table for HR review.

### B. Loan Life Cycle (The Resubmission Flow)
1.  **Application:** Employee submits a loan with documents. (Status: `Pending`)
2.  **Review:** Supervisor/HR views documents via the Dashboard.
3.  **Action:**
    *   **Approve:** Status becomes `Approved`.
    *   **Reject:** Supervisor adds remarks. Status becomes `Rejected`.
4.  **Correction (Resubmission):** 
    *   Employee clicks **"Resubmit"** on a Rejected loan.
    *   Frontend pre-fills the form with old data.
    *   Employee fixes info and sends back.
    *   Backend resets status to `Pending` and clears old remarks.

### C. Payroll Release (Realistic Multi-Stage)
1.  **Generation:** Accountant generates a **Draft** payslip (calculations only).
2.  **Approval:** HR/Admin reviews the draft and clicks **Approve**.
3.  **Release:** Accountant clicks **Release**. 
    *   Funds are marked as disbursed.
    *   **Crucial Step:** Any loan deductions in the payroll are only **officially paid** to the loan balance at this stage.
4.  **Visibility:** Employee can now see and print their official Payslip.

---

## 4. Visual Analytics (Charts)
1.  **Aggregation:** Backend periodically counts records (e.g., how many "Approved" vs "Paid" loans).
2.  **API Delivery:** Backend sends these counts via `/api/dashboard/` and `/api/analytics/`.
3.  **Rendering:** Frontend uses **Recharts** to turn that raw numbers into Area, Bar, and Pie charts tailored to each user's role.

---

## 5. Security Layers
*   **Frontend Routing:** Unauthorized roles cannot see certain pages (e.g., Employees can't see the Geofencing page).
*   **Backend Permissions:** Even if a user knows the URL, the Backend (via `IsAdminOrHR`) will block any API request that doesn't match their role.
*   **Audit Logs:** Every major action (Created Employee, Approved Loan, Released Payroll) is automatically logged for transparency.
