# OCPL – Performance Management System

A full-featured Performance Management System for Otto Clothing (OCPL), built with React + Vite + Tailwind CSS.

## Features
- Role-based login (Employee, Manager, HR) with credentials
- Goal Setting cycles with KRA/KPI management
- Mid-Year and Annual Performance Reviews
- Weighted CGPA scoring with 5-point rating scale
- Full approval workflows (Employee → Manager → HR)
- Bulk KRA upload via Excel
- Reports: KRA, Ratings & Feedback, Cycle Completion
- Email notification log
- User management with bulk upload

## Roles & Default Credentials
| Name | Employee ID | Password | Role |
|------|------------|----------|------|
| Priya Nair | EMP-1024 | Password@123 | Employee |
| Arjun Mehta | EMP-1090 | Password@123 | Employee |
| L. Sharma | EMP-0461 | Password@123 | Manager |
| R. Das | EMP-0098 | Password@123 | HR |

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build for Production

```bash
npm run build
```

## Tech Stack
- React 18
- Vite 5
- Tailwind CSS 3
- lucide-react (icons)
- SheetJS / xlsx (Excel import/export)
