# Decision Log

## 1. CSV Import Pipeline
**Decision**: Use a two-stage import process (`ImportJob` -> `ImportIssue`) instead of trying to clean data and insert directly into `Expense` tables in one shot.
**Options Considered**: 
1. Auto-clean the data silently. (Rejected: Explicitly banned by the assignment rubric).
2. Fail the entire upload if an error is found. (Rejected: Frustrating UX, forces user to fix the CSV manually, which is banned by the prompt).
3. Staging tables with a Review UI.
**Why**: This provides Meera the exact control she requested ("I want to approve anything the app deletes or changes"). It ensures no silent data mutations occur.

## 2. Membership Time Bounds
**Decision**: Store `joinedAt` and `leftAt` timestamps on the `GroupMember` model.
**Options Considered**: 
1. Calculate membership implicitly by looking at activity logs. (Rejected: Too fragile).
2. Explicit date boundaries on the join table.
**Why**: Ensures splitting logic strictly respects time. If a user tries to split an expense in April with Meera, the system hard-rejects it or flags it as an anomaly because Meera's `leftAt` is `March 31`.

## 3. Handling Settlements logged as Expenses
**Decision**: Detect "paid back" in description without a split type and convert the row into a true `Settlement` record.
**Why**: Keeping it as an Expense corrupts the debt graph because the SplitEngine would try to divide the 5000 refund amongst the group. By routing it to the `Settlement` table, it accurately reduces the pairwise debt without inflating group spending metrics.

## 4. Ledger Trace View (No Magic Numbers)
**Decision**: Build a sequential Ledger calculator (`getLedgerTrace` API) that generates an itemized receipt for a specific user.
**Why**: Rohan requested exact traceability. Instead of just displaying `Net Balance: -₹2300`, the Ledger Trace computes exactly how much a user paid vs owed on every single expense and settlement, providing a chronological running balance.

## 5. Multi-Currency 
**Decision**: Store `originalAmount` and `currency` but convert everything to an internal base currency (`INR`) for balance calculations.
**Options Considered**:
1. Run parallel debt graphs for each currency. (Rejected: High complexity, users generally want to settle in one currency).
2. Convert at runtime.
3. Convert at insertion time using an `exchangeRate` column.
**Why**: Converting at insertion time (e.g. 1 USD = 83.5 INR) freezes the value so historical balances don't drift as forex rates change. It fulfills Priya's requirement seamlessly.
