# OCPL Performance Management System — Claude Code Context

## Project overview
A single-file React web app (`src/App.jsx`) that manages the full employee performance lifecycle for Otto Clothing (OCPL). Built with React 18 + Vite + Tailwind CSS 3 + lucide-react + SheetJS (xlsx). Data persists in Supabase (Postgres); `currentUserId` alone stays in `localStorage` for session continuity across refreshes.

## Tech stack
- **React 18** with hooks (useState, useEffect, useRef)
- **Vite 5** — dev server and build tool
- **Tailwind CSS 3** — utility-first styling (no component libraries)
- **lucide-react 0.383.0** — icons
- **xlsx / SheetJS** — Excel import and export
- **Supabase (Postgres)** — backend. `src/supabaseClient.js` instantiates the client from `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (set in `.env.local`, not committed — see `.env.example`). Schema/RLS/RPCs are defined in the SQL migration run directly in the Supabase SQL Editor (not checked into this repo as a file yet).

## Running locally
```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL + anon key
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
```

## Auth & data access model
- Login stays Employee ID + password. Passwords are bcrypt-hashed (`pgcrypto`) in the `users` table and verified via the `verify_login` Postgres RPC — the client never reads password hashes.
- The `users` table has **zero** direct anon table policies — all reads/writes go through `SECURITY DEFINER` RPCs (`verify_login`, `list_users`, `create_user`, `bulk_create_users`, `delete_user`, `change_password`, `edit_user`).
- `cycles`, `records`, `emails` have permissive anon RLS policies (open read/write to anyone holding the anon key) — same trust model as the old client-only app, just centralized. There is no per-user authorization at the DB layer since there's no Supabase Auth session.
- No realtime sync yet — each client loads data on mount via `refetchAll()`; two browsers won't see each other's changes until reload.
- `records` writes are optimistic-local + debounced (~600ms) for per-keystroke edits, and flushed immediately for discrete workflow actions (submit/approve/reject/finalize/HR decisions) — see `setRecord`/`persistRecord` in `App.jsx`.

## Project structure
```
PMS-OCPL/
├── src/
│   ├── App.jsx        ← ENTIRE app lives here (single file)
│   ├── main.jsx       ← React entry point
│   └── index.css      ← Tailwind directives only
├── public/
│   └── favicon.svg
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Architecture — everything is in src/App.jsx

### Constants (top of file)
- `RATING_SCALE` — 5-point scale: Exceptional → Needs Improvement
- `CYCLE_TYPES` — Goal Setting | Mid-Year Review | Annual Performance Review
- `USER_ROLE` — employee | manager | hr
- `KRA_TEMPLATE` — default KRA/KPI structure loaded for new Goal Setting records
- `initialUsers` — 4 demo users (Priya Nair, Arjun Mehta, L. Sharma, R. Das)
- `initialCycles` — 2 demo cycles (Goal Setting 2026, Mid-Year 2026)
- `EMPTY_USER` — blank user form template

### Key utility functions
- `rKey(cid, eid)` → `"cycleId::employeeId"` — record key for the records map
- `defaultRecord(type)` → initial record shape for a cycle type
- `totalWeight(kras)` → sum of all KPI weightages
- `cgpaToBand(cgpa)` → converts weighted score to 1-5 band
- `recStatus(cycle, rec)` → returns `{ label, tone }` for status pills

### App state (in App component)
```javascript
users        // array of user objects
cycles       // array of cycle objects
records      // flat map: { "cycleId::empId": recordObject }
emails       // array of notification email objects (inbox)
currentUserId // employeeId string of logged-in user
view         // current page/tab string
```

### Record shapes
**Goal Setting record:**
```javascript
{ kras: [...], status: "Draft|Submitted|Approved|Changes Requested", note: "" }
```

**Review record (Mid-Year / Annual):**
```javascript
{
  review: {
    [kpiId]: { selfRating, selfComment, mgrRating, mgrComment, attachments },
    __overall: { selfComment, mgrComment },
    __returnNote: "",   // manager → employee rejection note
    __hrNote: "",       // HR → manager rejection note
  },
  stage: "self|manager|hr|done"
}
```

### Component tree
```
App
├── LoginScreen          — Emp ID + password credential form
├── ChangePwdModal       — Change password overlay
├── Header (nav tabs)
└── Pages (routed by `view` state):
    ├── HomeDashboard    — Role-aware landing with quick-action cards
    ├── MyTasksPage      — Active pending cycles for current user
    ├── CompletedPage    — Finished reviews with CGPA scores
    ├── ApprovedKRAPage  — Read-only approved KRA sheet with download
    ├── TeamPage         — Manager's direct reports across active cycles
    ├── ApprovalsPage    — HR: annual reviews at HR stage
    ├── CyclesAdmin      — HR: create/manage cycles, enroll participants
    ├── UsersAdmin       — HR: add/edit/bulk-upload users, upload KRAs
    ├── ReportsPage      — HR: KRA report, ratings report, completion status
    └── InboxPage        — Notification email log (all roles)
```

### Approval workflows
**Goal Setting:** Employee Draft → Submitted → Manager (Approve | Request Changes) → Approved
**Mid-Year Review:** Employee self → Manager review → Done (no HR step)
**Annual Review:** Employee self → Manager review → HR approval → Done

### Notification system
`notify(event, { cycle, subject, note })` is called at every workflow action.  
`composeEmails(event, ctx)` builds email objects (to, from, subject, body).  
Emails are stored in the `emails` array and shown in InboxPage.  
Events: `enrolled | kra_submitted | kra_approved | kra_changes | self_submitted | review_to_hr | midyear_complete | review_returned | hr_approved | hr_rejected`

### User object shape
```javascript
{
  id, name, employeeId, email, department, designation,
  role,                    // "employee" | "manager" | "hr"
  reportingManager,        // name string
  reportingManagerId,      // employeeId string
  reportingManagerEmail,
  password                 // plain text, default "Password@123"
}
```

### Demo credentials
| Name | Employee ID | Password | Role |
|------|------------|----------|------|
| Priya Nair | EMP-1024 | Password@123 | Employee |
| Arjun Mehta | EMP-1090 | Password@123 | Employee |
| L. Sharma | EMP-0461 | Password@123 | Manager |
| R. Das | EMP-0098 | Password@123 | HR |

## Key constraints & patterns
- **Single file** — all components, hooks, and utilities live in `src/App.jsx`. `src/supabaseClient.js` is the one approved exception (just instantiates the Supabase client). Do not split further unless explicitly asked.
- **No component library** — only Tailwind utility classes. No shadcn, MUI, etc.
- **Tailwind v3** — use only stable base utilities. No arbitrary values like `[#hex]`.
- **Surgical edits preferred** — when modifying App.jsx, change only the relevant section rather than rewriting the whole file.
- **Validate JSX** after edits — run a Babel parse check before presenting changes.
- **Employee ID is the mutable business key** — used in `rKey()`, cycle participants arrays, and reporting manager references. Changing it goes through the `edit_user` Postgres RPC, which atomically cascades to: other users' RM fields, `records.employee_id`, and `cycles.participants`.
- **Weightage must total 100%** — enforced in Goal Setting before submission and on KRA upload.
- **Password** hashed with bcrypt (`pgcrypto`) server-side. Never write plaintext passwords to the `users` table or send hashes to the client — all password read/write paths go through RPCs.

## Planned next steps
- Realtime cross-browser sync (Supabase Realtime subscriptions) so concurrent users see each other's changes live
- Real email delivery via SendGrid/SES (currently notification emails are logged in the `emails` table and shown in-app only)
- Per-user authorization at the DB layer (would require adopting Supabase Auth sessions — currently `cycles`/`records`/`emails` are open to anyone holding the anon key)

## GitHub
Repository: https://github.com/DeepakDPK112/PMS-OCPL
Branch: main
Deploy: Vercel (auto-deploys on push to main)
