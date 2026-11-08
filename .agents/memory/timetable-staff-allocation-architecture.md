# Timetable & Staff Allocation Architecture

- **Unified Navigation Rule**: Never separate "Teacher Staff Allocation" and "Timetable Schedule" into distinct top-level sidebar items. They must always remain consolidated as a single option (`Timetable & Staff Allocation`) in the admin navigation, using internal sub-tabs for switching between:
  1. `Teacher-Subject Allocation` (class selection, faculty assignment, room assignments, priority slots).
  2. `Timetable Schedule & Grid` (weekly schedule view by Class or Faculty, manual edits, randomize missing periods, version history).
- **Class-Specific Allocation Persistence**:
  - Each class section (e.g. `II-CSE-A`) maintains independent teacher assignments.
  - When saving an allocation, baseline `TimetableEntry` records or `scheduleSlots` must be upserted so that switching between sections retains each class's chosen faculty.
- **Course Catalog Integration**: Official subjects are stored in the `Subject` table (Supabase PostgreSQL) with semester, credits, and department relations. Always ensure department records exist before inserting subject or user profile foreign keys.
- **Authentication Source of Truth**:
  - Main credentials table: `User` (`email`, `vmNo`, `password` hash, `role`).
  - `authorize()` in `src/lib/auth.ts` queries `User` first with case-insensitive `email` or `vmNo` match, with `UserMode` as legacy fallback.
