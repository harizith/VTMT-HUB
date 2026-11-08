---
name: Timetable import integrity
description: Project rule for handling missing and unreadable timetable data in imports.
---

Timetable importers must only store values explicitly present in the source. Never synthesize missing schedule fields, infer unprovided class/faculty assignments, or fall back to a canned timetable. If a PDF layout cannot be read reliably, reject it with a clear message rather than creating rows from assumptions. Validate support against a representative source file before adding new layout-specific parsing.

**Why:** Fabricated timetable values were being stored as real schedules and could mislead students and faculty. Partial records are valid and must remain partial.

**How to apply:** Follow this rule in PDF and spreadsheet parsers, import APIs, and any future timetable extraction work. Keep missing fields null and surface unreadable layouts as errors.
