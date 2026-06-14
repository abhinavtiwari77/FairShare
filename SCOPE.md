# Scope and Anomaly Log

## Database Schema Highlights
To meet the rigorous assignment requirements, the database schema underwent significant modifications.

**1. Membership Time-Tracking**
`GroupMember` now includes:
- `joinedAt DateTime @default(now())`
- `leftAt DateTime?`
This ensures `SplitEngine` correctly omits Meera from April expenses and excludes Sam from March expenses.

**2. Importer Pipeline**
Two new tables manage the import pipeline:
- `ImportJob`: Tracks the CSV file upload session.
- `ImportIssue`: Logs each anomaly, its severity, raw JSON data, and the `userAction` taken to resolve it. No silent guesses.

**3. Currency Support**
`Expense` now includes:
- `currency String @default("INR")`
- `exchangeRate Decimal?`
- `originalAmount Decimal?`
This preserves Priya's requirement that dollars aren't blindly treated as rupees.

## Anomaly Log (`expenses_export.csv`)

The data importer detected the following 12 intentional anomalies:

1. **Row 5 & 6 (Duplicate Expense)**: "Dinner at Marina Bites" vs "dinner - marina bites". Both same date, same payer, same amount.
   - *Action Taken*: Surfaced as `DUPLICATE` anomaly. Suggested Action: `REJECT` Row 6.

2. **Row 7 (Formatting Error)**: Amount is `"1,200"` instead of `1200`.
   - *Action Taken*: Cleaned via regex during parsing, but flagged as a `FORMAT_ISSUE` (Warning) for user visibility.

3. **Row 9 & 11 (Unknown User)**: `priya` (case issue) and `Priya S` (unknown alias).
   - *Action Taken*: Case issues (`priya`) were auto-resolved using case-insensitive mapping. Unknown aliases (`Priya S`) flagged as `UNKNOWN_USER`. User must override or map to Priya.

4. **Row 12 (Unequal Split)**: Aisha's birthday cake. Aisha not charged.
   - *Action Taken*: Passed validation as `split_details` accurately sum to the total.

5. **Row 13 (Missing Payer)**: "House cleaning supplies" with no `paid_by`.
   - *Action Taken*: Flagged as `MISSING_FIELDS` Error. Import blocked until user assigns a payer.

6. **Row 14 (Settlement Logged as Expense)**: "Rohan paid Aisha back", amount 5000.
   - *Action Taken*: Flagged as `SETTLEMENT_LOGGED_AS_EXPENSE`. Suggested Action: `CONVERT_TO_SETTLEMENT`. If accepted, writes to `Settlement` table instead of `Expense`.

7. **Row 15 (Invalid Split Sum)**: Percentage split sums to 110%.
   - *Action Taken*: Flagged as `INVALID_SPLIT_SUM` Error. Import blocked until percentages are corrected to sum to 100%.

8. **Row 20 & 21 (Currency Mixing)**: USD expenses.
   - *Action Taken*: Flagged as `CURRENCY_MIXING` Info. Converted to INR using a standard exchange rate (83.5) while preserving `originalAmount` as USD in the DB.

9. **Row 23 (Unknown Split Participant)**: `Dev's friend Kabir`.
   - *Action Taken*: Flagged as `UNKNOWN_USER`. Kabir is not in the DB. User must override or assign to Dev.

10. **Row 24 & 25 (Different Amount Duplicate)**: "Dinner at Thalassa" (2400) vs "Thalassa dinner" (2450).
    - *Action Taken*: Flagged as `DIFFERENT_AMOUNT_DUPLICATE`. Suggested Action: `REJECT` one.

11. **Row 26 (Negative Amount)**: Amount `-30` USD.
    - *Action Taken*: Flagged as `NEGATIVE_AMOUNT`. Suggested Action: `CONVERT_TO_REFUND`.

12. **Row 36 (Expense After Member Left)**: Meera included in April Groceries.
    - *Action Taken*: Flagged as `MEMBERSHIP_ERROR`. Meera left end of March. User must override to omit Meera from the split.

13. **Row 38 (Expense Before Member Joined / Settlement)**: Sam deposit share.
    - *Action Taken*: Flagged as `MEMBERSHIP_ERROR` (Sam wasn't officially moved in until later, depending on date boundaries) and potentially `SETTLEMENT_LOGGED_AS_EXPENSE`.
