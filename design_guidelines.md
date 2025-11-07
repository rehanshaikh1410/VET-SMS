# School Management System - Design Guidelines

## Design Approach
**System Selected:** Material Design 3 principles adapted for productivity
**Rationale:** Information-dense application requiring consistent patterns, clear data hierarchy, and robust component library for dashboards, tables, and forms.

## Core Design Principles
1. **Role Clarity:** Visual distinction between Admin, Teacher, and Student interfaces through subtle layout variations
2. **Data Priority:** Information hierarchy optimized for scanning tables, analytics, and reports
3. **Efficient Actions:** Primary actions always accessible, minimal clicks to complete tasks
4. **Responsive Density:** Comfortable spacing on desktop, optimized compact layouts on mobile

## Typography System
- **Primary Font:** Inter (Google Fonts) - excellent for data-heavy interfaces
- **Headings:** 
  - Page Titles: text-3xl font-bold
  - Section Headers: text-xl font-semibold
  - Card Headers: text-lg font-medium
- **Body:** text-base for general content, text-sm for table data and secondary info
- **Data Display:** font-mono for IDs, codes, and numerical data

## Layout System
**Spacing Primitives:** Use Tailwind units of 2, 4, 6, and 8 consistently
- Component padding: p-4 to p-6
- Section spacing: mb-6 to mb-8
- Card gaps: gap-4 to gap-6
- Form field spacing: space-y-4

**Container Structure:**
- Dashboard: Sidebar (w-64) + Main Content (flex-1)
- Content max-width: max-w-7xl mx-auto
- Card padding: p-6
- Responsive breakpoints: Mobile-first, sidebar collapses to hamburger on md and below

## Component Library

### Navigation
**Sidebar (Desktop):**
- Fixed left sidebar with role-specific navigation items
- Logo/branding at top (h-16)
- Navigation groups with subtle dividers
- Active state: Background highlight + font-semibold
- User profile section at bottom with logout

**Mobile Header:**
- Hamburger menu icon (top-left)
- Page title (center)
- User avatar (top-right)
- Slide-out drawer navigation

### Dashboard Cards
**Analytics Cards (4-column grid on desktop, 1-column mobile):**
- Icon on left (w-12 h-12 rounded-full with soft background)
- Metric value: text-2xl font-bold
- Metric label: text-sm text-gray-600
- Trend indicator where applicable (small arrow icon + percentage)
- Card structure: rounded-lg border with hover:shadow-md transition

### Data Tables
**Structure:**
- Sticky header row with sorting indicators
- Alternating row backgrounds (subtle stripe pattern)
- Actions column (right-aligned): Icon buttons for edit/delete/view
- Pagination: Bottom-right with page numbers and prev/next
- Search bar: Top-right with icon prefix
- Filters: Top-left as chip/badge selections
- Mobile: Transform to stacked cards showing key fields

### Forms
**Layout:**
- Two-column grid on desktop (grid-cols-2 gap-6), single column on mobile
- Label above input: text-sm font-medium mb-2
- Input fields: Consistent height (h-10), border with focus:ring-2 state
- Required indicators: Red asterisk next to label
- Error messages: text-sm text-red-600 mt-1
- Submit buttons: Primary button bottom-right
- Cancel/Back: Secondary button to left of submit

### Modals
- Overlay with backdrop-blur-sm
- Modal container: max-w-2xl, rounded-lg, shadow-xl
- Header: pb-4 border-b with title and close icon
- Body: p-6 with scrollable content if needed
- Footer: pt-4 border-t with action buttons right-aligned

### Quiz Interface (Student)
**Question Display:**
- Question number badge (top-left)
- Question text: text-lg mb-4
- Answer options: Radio buttons or checkboxes in vertical list (p-4 border rounded-lg, hover and selected states)
- Navigation: Previous/Next buttons at bottom
- Progress indicator: Top bar showing questions completed
- Submit quiz: Prominent button after last question

**Results View:**
- Score card at top (large centered metric)
- Question-by-question breakdown: Green/red indicators for correct/incorrect
- Show correct answers with explanations

### Charts & Analytics
- Use chart library like Chart.js or Recharts
- Bar charts for attendance comparison
- Line charts for performance trends over time
- Pie/donut charts for grade distribution
- Consistent height: h-64 to h-80
- Responsive: Maintain aspect ratio on mobile

### Notices/Announcements
- Card-based list with avatar/icon on left
- Title: font-semibold
- Timestamp: text-sm text-gray-500
- Description: text-sm with max-height and "Read more" expansion
- Priority indicators: Border-left accent (red for urgent, blue for info)

## Role-Specific Layouts

**Admin Dashboard:**
- 4-card metrics row (total students, teachers, classes, active quizzes)
- Recent activity feed (2-column: left for attendance summary chart, right for notices)
- Quick actions: Floating action button or prominent button group

**Teacher Dashboard:**
- Today's schedule card (prominent top-left)
- Attendance quick-mark widget
- Student performance chart
- Upcoming quizzes/assignments list

**Student Dashboard:**
- Today's timetable card (full-width top)
- Attendance percentage circular progress
- Upcoming quizzes with countdown
- Recent grades table

## Interaction Patterns
- Toast notifications: Top-right corner, 4-second auto-dismiss
- Loading states: Skeleton screens for tables, spinner for actions
- Empty states: Icon + message + CTA button
- Confirmation dialogs: For destructive actions (delete, logout)
- Form autosave indicators where applicable

## Images
No hero images needed - this is a productivity application. Use:
- Icons throughout (Heroicons via CDN)
- User avatars (placeholder initials in colored circles if no photo)
- Optional: School logo in sidebar header
- Charts/graphs for data visualization

## Accessibility
- Proper heading hierarchy (h1 > h2 > h3)
- Form labels associated with inputs
- Keyboard navigation for all interactive elements
- Focus indicators visible (ring-2 ring-blue-500)
- Sufficient contrast ratios (WCAG AA minimum)