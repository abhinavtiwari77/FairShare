# AI Usage Log

## AI Tool Used
- **Agent**: Google DeepMind Antigravity (Agentic AI)
- **Role**: Primary Backend/Frontend Developer & Architect

## Key Prompts Used
1. *"Re-architect the `schema.prisma` to add a staging layer for CSV imports (`ImportJob` and `ImportIssue`) so we can review anomalies instead of inserting directly."*
2. *"Write a strict parser in Node.js that checks each row of `expenses_export.csv` against a 12-rule validation matrix (duplicates, bounds, currency, etc)."*
3. *"Build a React UI that iterates over the `ImportIssue` list and provides Accept/Reject/Override buttons for each anomaly."*
4. *"Create a ledger trace API that generates a sequential ledger of exact impacts (positive and negative) on a user's net balance, ordered by date."*

## 3 Cases Where the AI Produced Something Wrong

**1. Replacing File Content without Adjusting Scope**
- **What happened**: When modifying `task.md` to update progress checklists, the AI attempted to use `replace_file_content` but targeted too narrow a block, breaking the markdown structure.
- **How I caught it**: I noticed the output of the tool call returning a malformed diff and checked the generated UI. 
- **What I changed**: I prompted the AI to simply `write_to_file` with `Overwrite: true` to reliably wipe and rewrite the markdown file cleanly.

**2. Incorrect Express Router Mounting**
- **What happened**: When adding `importRoutes`, the AI injected `app.use('/api/v1/groups', importRoutes)` directly into `index.js`, bypassing the main `routes/index.js` aggregator, which caused 404 errors on the frontend because of router scope mismatches.
- **How I caught it**: The `npm run dev` server was running and I checked the Network tab, noticing the `/import` endpoints were unresolvable.
- **What I changed**: I had the AI revert its changes to `index.js` and correctly add `router.use('/groups', importRoutes)` to `src/routes/index.js` where `mergeParams: true` context is maintained.

**3. Database Relation Validation Error in Prisma**
- **What happened**: The AI added an `ImportJob` model with a `createdBy User` relation but forgot to add the reciprocal `importJobs ImportJob[]` field on the `User` model.
- **How I caught it**: `npx prisma migrate dev` failed immediately with error `P1012: The relation field createdBy on model ImportJob is missing an opposite relation field...`
- **What I changed**: I reviewed the error trace and directed the AI to modify the `User` model to include the reciprocal array field before re-running the migration.
