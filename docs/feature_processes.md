# HRIS Feature Process Guide

This guide explains how each feature in the HRIS works in simple, step-by-step terms.

---

## 1. Attendance & Identity Verification
**Goal:** Ensure the right person is at the right place at the right time.

**The Process:**
1.  **Enrollment:** User goes to their **Profile** and captures their face data. This creates a unique "biometric map" stored in the system.
2.  **Location Check:** When checking in, the system uses GPS to see if the user is within the allowed **radius (usually 100 meters)** of their assigned school.
3.  **Face Scan:** The user looks at the camera. The system compares the live face to the saved biometric map.
4.  **Verification:** If the face matches and the user is at the school, the attendance is recorded as **"Present"**.
5.  **Flagging:** If a user checks in from outside the school, the system still records it but marks it as **"Flagged"** for HR review.

---

## 2. Payroll & Salary Grade Automation
**Goal:** Align salary with the government's Salary Standardization Law (SSL) and automate calculations.

**The Process:**
1.  **Salary Grade (SG) Setup:** HR maintains a table of Salary Grades (1-33) with their corresponding monthly amounts.
2.  **Employee Linkage:** Each employee is assigned an SG (e.g., "SG 11"). The system **automatically** pulls the base salary from the SG table based on their Position (e.g., "Teacher I").
3.  **Cutoff Selection:** HR selects a period (e.g., "June 1-15").
4.  **Deductions:**
    *   **Statutory:** Automatically calculates SSS, PhilHealth, and Pag-IBIG.
    *   **Loans:** Deducts active loan payments.
5.  **Net Pay:** Salary minus deductions.
6.  **Accuracy:** If the government updates the SSL, HR only updates the SG table once, and all linked employees' salaries are updated instantly.

---

## 3. Leave Management
**Goal:** Request and track time off (Sick, Vacation, etc.).

**The Process:**
1.  **Application:** Employee fills out a form choosing the leave type (e.g., Vacation) and the dates.
2.  **Review:** The Supervisor or HR receives a notification to **Approve** or **Reject** the request.
3.  **Balance Update:** Once approved, the days are automatically subtracted from the employee's **Leave Balance**.
4.  **Tracking:** Approved leaves are automatically synced with the attendance system so the employee isn't marked as "Absent."

---

## 4. Performance Rating (AI-Enhanced)
**Goal:** Evaluate employee performance with data-driven summaries.

**The Process:**
1.  **Scoring:** HR or a Supervisor rates the employee on specific metrics: Punctuality, Quality of Work, and Behavior (Scale of 1-5).
2.  **Data Integration:** The system automatically pulls the employee's actual attendance records for the period.
3.  **AI Analysis:** The system sends the scores and attendance data to **Gemini AI**.
4.  **Summary:** The AI generates a professional, 2-sentence summary explaining the employee's strengths and areas for growth.
5.  **Promotion Check:** Based on high scores and tenure, the system flags employees who are eligible for promotion.

---

## 5. Recruitment & Applicant Tracking
**Goal:** Manage the hiring process from application to hire.

**The Process:**
1.  **Application:** Applicants upload their details and resume (CV) through the portal.
2.  **PDS Extraction:** For government standard forms (PDS), the system uses **Gemini AI** to read the PDF and automatically fill out the applicant's profile (Education, Work History, etc.).
3.  **Stage Management:** HR moves applicants through a "Kanban Board" (columns like: *Applied → Screening → Interview → Hired*).
4.  **Finalization:** Once "Hired," the applicant can be converted into a regular Employee record with one click.

---

## 6. Descriptive Analytics Dashboard
**Goal:** Visualizing HR data for better decision-making.

**The Process:**
1.  **Data Gathering:** The system scans all records (Attendance, Loans, Payroll).
2.  **Visual Charts:**
    *   **Loan Health:** Shows how many loans are active vs. paid.
    *   **Attendance Trends:** Shows daily presence rates.
    *   **Department Distribution:** Shows how many staff are in each school.
3.  **Executive Summary:** **Gemini AI** looks at all the charts and writes a concise "Executive Report" for the Principal or HR Manager to read.
4.  **Geo-Mapping:** A map shows school locations and real-time attendance pins.
