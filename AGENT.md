# Project Style Foundation: LinkedIn Design Theme

This project follows the official **LinkedIn design theme** palette, typography, and styling variables. All UI components, styles, and layouts must adhere to these foundations.

---

## 1. Color Palette

| Role | Color Name | Hex Code | Purpose / Usage |
| :--- | :--- | :--- | :--- |
| **Primary Brand** | LinkedIn Blue | `#0A66C2` | Buttons, links, primary icons, active states |
| **Primary Hover** | Dark Blue | `#004182` | Button hover, active link press |
| **Primary Light** | Soft Blue Tint | `#EBF4FD` | Badge backgrounds, hover tint on icon buttons |
| **Main Background** | Warm Light Gray | `#F4F2EE` (or `#F3F2EF`) | Page body background |
| **Card / Surface** | Pure White | `#FFFFFF` | Feed cards, sidebars, modal popups, navbar |
| **Border / Divider** | Subtle Gray | `#E0DFDC` / `#EBEBEB` | Card borders, horizontal rules, input borders |
| **Primary Text** | Off-Black | `#181818` (or `rgba(0, 0, 0, 0.9)`) | Headlines, titles, post body copy |
| **Secondary Text** | Muted Gray | `#5E5E5E` (or `rgba(0, 0, 0, 0.6)`) | Timestamps, subtitles, meta text, inactive icons |
| **Success / Open to Work** | LinkedIn Green | `#01754F` | Status pills, badges, success tags |
| **Warning / Premium** | LinkedIn Gold/Amber | `#915907` / `#C37D16` | Premium badge, highlights |

---

## 2. Dark Mode Palette (LinkedIn Dark)

| Role | Hex Code | Purpose / Usage |
| :--- | :--- | :--- |
| **Main Background** | `#000000` / `#0F0F0F` | Outer page backdrop |
| **Card / Surface** | `#1D2226` | Feed cards, navigation bar |
| **Border / Divider** | `#38434F` | Card outlines, separation lines |
| **Primary Brand** | `#70B5F9` | Link color & button accents in dark mode |
| **Primary Text** | `#FFFFFF` (`rgba(255, 255, 255, 0.9)`) | Main readable headings & copy |
| **Secondary Text** | `#9E9E9E` (`rgba(255, 255, 255, 0.6)`) | Metadata, timestamps, helper text |

---

## 3. Typography & Styling Guidelines

- **Font Family**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- **Card Border Radius**: `8px` (`rounded-lg`) or `10px`
- **Button Border Radius**: Pill-shaped (`rounded-full` / `24px` radius) for action buttons ("Follow", "Connect", "Post")
- **Card Border / Shadow**:
  - Border: `1px solid #E0DFDC`
  - Shadow: Subtly flat, e.g. `0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)`

---

## 4. Tailwind CSS Theme Variables

```css
@theme {
  --color-li-primary: #0A66C2;
  --color-li-primary-hover: #004182;
  --color-li-primary-light: #EBF4FD;
  
  --color-li-bg: #F4F2EE;
  --color-li-surface: #FFFFFF;
  --color-li-border: #E0DFDC;
  
  --color-li-text-main: #181818;
  --color-li-text-sub: #5E5E5E;
  
  --color-li-green: #01754F;
  --color-li-amber: #915907;

  /* Dark mode variants */
  --color-li-dark-bg: #0F0F0F;
  --color-li-dark-surface: #1D2226;
  --color-li-dark-border: #38434F;
  --color-li-dark-primary: #70B5F9;
}
```



---

## 5. File & Component Naming Conventions (Strict Rule)

- **Descriptive & Explicit Naming**: Files must be named after their exact feature, function, domain entity, or responsibility.
- **No Generic / Ambiguous File Names**: Never use generic or uninformative file names such as `route.ts`, `index.ts`, `data.ts`, `utils.ts`, `types.ts`, `helpers.ts`, or `page.tsx` without domain specificity.
- **Examples**:
  - ❌ Avoid: `route.ts`, `page.tsx`, `utils.ts`, `auth.ts`
  - ✅ Use: `studentAttendanceRoute.ts`, `StudentDashboardView.tsx`, `timetableConflictValidator.ts`, `userSessionAuthenticator.ts`
- **Component Files**: Match the component name directly (e.g., `CourseSyllabusCard.tsx`, `FacultyRosterTable.tsx`).
- **Service & Utility Files**: Reflect the exact operation performed (e.g., `attendanceCsvParser.ts`, `curriculumSummaryGenerator.ts`).
