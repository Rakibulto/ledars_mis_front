# Central Dashboard — MUI v7 Redesign

This is a drop-in replacement for the previous Tailwind-based `central-dashboard`
folder. Same data flow, same API endpoint, same props — only the UI layer changed
from Tailwind classes / `src/tailwind_components/ui/*` to native **MUI v7**
components, and the page is now organized into **tabs** instead of one long
vertical scroll.

## What changed

- **UI library**: Tailwind CSS classes and the custom `tailwind_components/ui/*`
  kit (`Card`, `Skeleton`, `Badge`, `Alert`, `EmptyState`, `Button`, `ChartContainer`)
  are gone. Every component now uses `@mui/material` (`Card`, `Grid`, `Stack`,
  `Typography`, `Chip`, `Alert`, `Skeleton`, `Table`, `Tabs`, etc.), matching the
  MUI v7 already used throughout the rest of the project.
- **Layout**: the 9 original sections are grouped into 4 tabs so nothing requires
  excessive scrolling:
  1. **Overview** — Key Metrics (KPI cards) + Analytics (charts)
  2. **Activity & Schedule** — Recent Activities + Today's Schedule + Notifications
  3. **Modules & Actions** — Module Overview widgets + Quick Actions
  4. **Recent Records** — the compact per-module tables
- **Responsiveness**: all grids use MUI's `Grid` `size` prop (`xs/sm/md/lg/xl`)
  so the layout adapts smoothly from mobile → tablet → desktop; the tab bar is
  `scrollable` with scroll buttons on small screens.
- **Charts**: still `recharts` (already a project dependency), just re-themed to
  sit inside MUI `Card`s instead of the Tailwind `ChartContainer` wrapper.
- **Icons**: kept `lucide-react` (already a dependency used throughout the
  original files) — only the surrounding chrome moved to MUI, so no new icon
  library was introduced.

## What did NOT change

- `hooks/use-central-dashboard.js` — identical. Still calls
  `GET /api/central-dashboard/` via the existing `fetcher` from `src/utils/axios`.
- `utils/formatters.js` — identical, pure JS, no UI dependency.
- All data shapes, prop names, and business logic (routing links, `paths.*`
  usage, module keys, KPI keys, chart keys) are unchanged.
- No new API route was created or modified — this redesign only touches
  presentation.

## Drop-in instructions

1. Replace your existing `central-dashboard/` folder (same relative path it
   lived in before) with this one.
2. No new dependencies are required — `@mui/material`, `@mui/icons-material`,
   `recharts`, `lucide-react`, and `dayjs` are already in `package.json`.
3. The page that renders `<CentralDashboardMain />` at `/dashboard/` needs no
   changes — the export from `index.jsx` is unchanged.
