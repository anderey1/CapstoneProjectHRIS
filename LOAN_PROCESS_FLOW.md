# Provident Loan Lifecycle — Step-by-Step Flow

This guide explains the exact journey of a loan application from start to finish.

## Phase 1: The Application (Start)
1.  **Employee Action:** Opens "My Loans" and clicks "Apply".
2.  **Submission:** Fills in amount, purpose, term, and co-maker. Uploads required PDFs (LAF, Payslip, etc.).
3.  **System State:** 
    *   A new record is created in the `ProvidentLoan` table.
    *   Initial Status: **`Pending`**.
    *   Deductions: Monthly amortization is automatically calculated based on the 5% interest rate.

---

## Phase 2: Management Review
1.  **Supervisor/HR Action:** Opens "Loan Review" dashboard.
2.  **Verification:** Clicks "Review" to see application details and **View** the uploaded documents.
3.  **The Decision:**
    *   **IF OK:** Supervisor clicks **"Approve"**. Status moves to **`Approved`**.
    *   **IF ISSUES (missing docs, wrong info):** Supervisor clicks **"Reject"** and MUST provide **Remarks** (e.g., "Missing co-maker signature").

---

## Phase 3: The Resubmission (Correction Loop)
*This phase only happens if the loan was Rejected.*

1.  **Employee Alert:** Employee sees **`Rejected`** status and reads the supervisor's remarks.
2.  **Employee Action:** Clicks **"Edit & Resubmit"**.
3.  **The Form:** Application form opens with all previous data pre-filled. Employee fixes the info or re-uploads the correct files.
4.  **System Reset:** 
    *   Status is reset back to **`Pending`**.
    *   Old rejection remarks are cleared.
    *   Loan reappears in the Supervisor's "Pending" queue for a fresh review.

---

## Phase 4: Disbursement (Getting the Money)
1.  **System Logic:** Even if a loan is `Approved`, it is not "paid" yet. It is waiting for the next payroll cycle.
2.  **Accountant Action:** During payroll processing, the Accountant includes the loan in the **Payroll Release**.
3.  **The Trigger:** Once the Payroll status hits **`Released`**, the system officially marks the loan as active.
4.  **Funds:** The employee receives the loan amount (simulated in the prototype by the status change and history update).

---

## Phase 5: Repayment & Completion (Finish)
1.  **Automatic Deduction:** Every succeeding semi-monthly payroll automatically deducts the calculated amortization.
2.  **Payment Tracking:** Every time a payroll is **`Released`**, a new record is added to the `LoanPayment` table.
3.  **Balance Check:** After every payment, the system checks: 
    *   `Total Repayable - Total Payments = Remaining Balance`.
4.  **The Finish Line:** When the `Remaining Balance` reaches **0**.
5.  **Final System State:** 
    *   Status automatically changes to **`Paid`**.
    *   The loan is moved to the "History" section.
    *   The employee is now eligible to apply for a new loan.
