# OCPL Performance Management System — Claude Code Context

## Project overview
A single-file React web app (`src/App.jsx`) that manages the full employee performance lifecycle for Otto Clothing (OCPL). Built with React 18 + Vite + Tailwind CSS 3 + lucide-react + SheetJS (xlsx). All state persists in `localStorage`.

## Tech stack
- **React 18** with hooks (useState, useEffect)
- **Vite 5** — dev server and build tool
- **Tailwind CSS 3** — utility-first styling (no component libraries)
- **lucide-react 0.383.0** — icons
- **xlsx / SheetJS** — Excel import and export
- **localStorage** — persistence (no backend yet)

## Running locally
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
```

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
- **Single file** — all components, hooks, and utilities live in `src/App.jsx`. Do not split into multiple files unless explicitly asked.
- **No component library** — only Tailwind utility classes. No shadcn, MUI, etc.
- **Tailwind v3** — use only stable base utilities. No arbitrary values like `[#hex]`.
- **Surgical edits preferred** — when modifying App.jsx, change only the relevant section rather than rewriting the whole file.
- **Validate JSX** after edits — run a Babel parse check before presenting changes.
- **Employee ID is the primary key** — used in `rKey()`, cycle participants arrays, and reporting manager references. Changing an Emp ID must cascade to: other users' RM fields, cycle participants, and record keys.
- **Weightage must total 100%** — enforced in Goal Setting before submission and on KRA upload.
- **Password** stored as plain text for UAT simplicity. Hash before production.

## Planned next steps
- Supabase backend for real multi-user shared data across machines
- Real email delivery via SendGrid/SES (currently notification emails are logged in-app only)
- Password hashing before production rollout

## GitHub
Repository: https://github.com/DeepakDPK112/PMS-OCPL
Branch: main
Deploy: Vercel (auto-deploys on push to main)
