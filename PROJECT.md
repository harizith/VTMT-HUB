# Project: VTMT-HUB Attendance System

## Architecture
VTMT-HUB is a Next.js (App Router, React 19) campus management portal with PostgreSQL (Supabase) via Prisma ORM and NextAuth.
Page views reside in `src/views/` per Rule 5 of `AGENT.md` and are re-exported in `src/app/`.
All UI elements follow the LinkedIn design theme (`AGENT.md`).

### Data Flow & Entities
- **Database Model**: `Attendance` model in `prisma/schema.prisma` with composite unique constraint `@@unique([studentId, dateString, period])` and index `@@index([classId, dateString])`.
- **Offline / In-Memory Fallback**: `src/lib/prisma.ts` proxies Prisma client with `InMemoryStore` for zero-friction local/offline execution.
- **Portals**:
  - **Faculty / Teacher**: Attendance recording per class, date, period, and subject.
  - **HOD**: Department monitoring, class summaries, daily/period logs, and teaching attendance access.
  - **Admin**: Institutional command center tab for college-wide attendance, logs, and defaulter tracking.
  - **Student**: Personal student dashboard with live attendance overview ring, percentage, and period counts.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Student Seed Account & Sample Records | Seed `student@vtmt.org` (User, StudentProfile `II-CSE-A`, UserMode, InMemoryStore) with sample attendance records across subjects | M1 | ORIGINAL_REQUEST §2, Survey |
| 2 | Live Student Dashboard Attendance Ring | Dynamic SVG circular progress indicator in `src/views/StudentDashboardView.tsx` with LinkedIn theme colors (Green >= 75%, Amber 65-74%, Red < 65%) | M1 | ORIGINAL_REQUEST §2, AGENT.md |
| 3 | Student Dashboard Attendance Aggregation API | Query `prisma.attendance` in `src/app/api/student/dashboard/route.ts` and aggregate overall percentage, attended/total periods, and subject breakdown | M1 | ORIGINAL_REQUEST §2, Survey |
| 4 | Faculty Attendance Recording View | `src/views/FacultyAttendanceRecordingView.tsx` with period-wise attendance marking, class/subject/period selectors, and real-time stats | M2 | ORIGINAL_REQUEST §1, Rule 5 |
| 5 | Teacher Attendance API Enhancement | Support `GET` for existing attendance and robust `POST` upsert in `src/app/api/teacher/attendance/route.ts` | M2 | ORIGINAL_REQUEST §1, Survey |
| 6 | HOD Teaching Attendance Access | Enable HOD teaching attendance in `HodDashboardOverviewView.tsx`, `HodLayout.tsx`, and `src/app/api/teacher/students/route.ts` (support `hodProfile`) | M2 | ORIGINAL_REQUEST §1, Survey |
| 7 | HOD Attendance Monitoring View & API | `src/views/HodAttendanceMonitoringView.tsx`, `/hod/attendance` route, `/api/hod/attendance/route.ts`, and fix `/api/hod/attendance/export/route.ts` bug | M3 | ORIGINAL_REQUEST §1, Rule 5 |
| 8 | Admin Attendance Analytics View & API | `src/views/AdminAttendanceAnalyticsView.tsx`, Attendance tab in `AdminCommandCenterView.tsx`, and `/api/admin/attendance/route.ts` | M3 | ORIGINAL_REQUEST §1, Rule 5 |
| 9 | Dual Track E2E Test Suite | Comprehensive automated tests verifying attendance recording, HOD/Admin viewing, student ring metrics, and build/typecheck | M4 | Project Architecture |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Student Portal Attendance Ring & Seed Data | Seed `student@vtmt.org` & attendance records; connect `StudentDashboardView.tsx` ring to live database via `/api/student/dashboard` | none | PLANNED |
| 2 | Faculty & HOD Attendance Recording | `FacultyAttendanceRecordingView.tsx`, `/api/teacher/attendance` GET/POST, HOD teaching attendance access & `hodProfile` support | M1 | PLANNED |
| 3 | HOD & Admin Attendance Viewing Interfaces | `HodAttendanceMonitoringView.tsx`, `/api/hod/attendance`, fix export route; `AdminAttendanceAnalyticsView.tsx`, `/api/admin/attendance` | M1, M2 | PLANNED |
| 4 | E2E Testing & System Hardening | Requirement-driven automated E2E test suite covering Tiers 1-4, adversarial edge cases, and full project verification | M1, M2, M3 | PLANNED |

---

## Interface Contracts

### 1. Student Dashboard Attendance Contract
- **Endpoint**: `GET /api/student/dashboard`
- **Output Schema Addition**:
  ```ts
  attendance: {
    percentage: number;      // e.g. 85 (0 to 100)
    totalPeriods: number;    // e.g. 24
    attendedPeriods: number; // e.g. 21 (PRESENT + ON_DUTY)
    presentPeriods: number;  // e.g. 19
    absentPeriods: number;   // e.g. 3
    odPeriods: number;       // e.g. 2
    hasRecords: boolean;
    subjectWise: Array<{
      subjectCode: string;
      total: number;
      attended: number;
      percentage: number;
    }>;
  }
  ```

### 2. Faculty Attendance Recording Contract
- **Endpoint**: `POST /api/teacher/attendance`
- **Input Schema**:
  ```ts
  // Single record or Batch
  {
    batch?: Array<{
      studentId: string;
      classId: string;
      dateString: string; // YYYY-MM-DD
      dayOrder: string;   // "I", "II", "III", "IV", "V"
      period: number;     // 1 to 8
      subjectCode: string;
      status: "PRESENT" | "ABSENT" | "ON_DUTY";
    }>;
    // OR single fields directly
  }
  ```
- **Endpoint**: `GET /api/teacher/attendance?dateString=YYYY-MM-DD&classId=II-CSE-A&period=1`
- **Output Schema**:
  ```ts
  {
    success: boolean;
    records: Array<{
      id: string;
      studentId: string;
      classId: string;
      dateString: string;
      dayOrder: string;
      period: number;
      subjectCode: string;
      facultyName: string;
      status: "PRESENT" | "ABSENT" | "ON_DUTY";
    }>;
  }
  ```

### 3. HOD & Admin Attendance Viewing Contract
- **HOD Endpoint**: `GET /api/hod/attendance?dateString=YYYY-MM-DD&classId=II-CSE-A&period=1`
  - Returns department-level statistics (present/absent/percentage rates), class attendance summaries, and daily period-wise attendance logs.
- **Admin Endpoint**: `GET /api/admin/attendance?dateString=YYYY-MM-DD&department=CSE&classId=II-CSE-A`
  - Returns college-wide statistics, department comparison breakdowns, period-wise institutional logs, and low-attendance defaulters (< 75%).

---

## Code Layout
- `src/views/StudentDashboardView.tsx` — Student portal dashboard with live attendance ring
- `src/views/FacultyAttendanceRecordingView.tsx` — Period-wise attendance marking view (re-exported in `src/app/teacher/students/page.tsx` and `src/app/teacher/attendance/page.tsx`)
- `src/views/HodAttendanceMonitoringView.tsx` — HOD attendance monitoring view (re-exported in `src/app/hod/attendance/page.tsx`)
- `src/views/AdminAttendanceAnalyticsView.tsx` — Admin attendance command center view (embedded in `src/views/AdminCommandCenterView.tsx`)
- `src/app/api/student/dashboard/route.ts` — Student dashboard data aggregator
- `src/app/api/teacher/attendance/route.ts` — Faculty attendance recording & lookup
- `src/app/api/teacher/students/route.ts` — Faculty class roster & timetable matching (with `hodProfile` support)
- `src/app/api/hod/attendance/route.ts` — HOD department attendance queries
- `src/app/api/hod/attendance/export/route.ts` — HOD attendance CSV/Excel export
- `src/app/api/admin/attendance/route.ts` — Admin institutional attendance queries
- `scripts/seed-student-account.cjs` — Seed script for `student@vtmt.org` and attendance sample records
- `src/lib/prisma.ts` — Dual-mode client with `InMemoryStore` fallback updates
