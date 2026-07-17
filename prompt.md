You are acting as a Senior Product Designer, Senior Frontend Architect, and Senior Software Engineer simultaneously.

MISSION:
Completely redesign and modernize the entire frontend/UI/UX of this project while preserving ALL existing business logic, backend integrations, APIs, routes, database interactions, authentication systems, state management, permissions, and feature behavior.

IMPORTANT RULES:

### 1. DO NOT BREAK ANY EXISTING SYSTEM
You MUST NOT:

- modify backend logic
- change API contracts
- alter database schema
- remove existing functionality
- change authentication flow
- modify permissions/roles
- change business rules
- remove existing routes
- break realtime features
- remove state management logic

Frontend redesign must be fully backward compatible.

---

### 2. FIRST PERFORM FULL PROJECT AUDIT

Before making any changes:

1. Scan the entire codebase.
2. Identify:

- pages
- sub pages
- layouts
- components
- reusable UI elements
- dialogs
- popup cards
- modals
- forms
- tables
- dashboard widgets
- navigation systems
- sidebar items
- mobile views
- responsive behavior
- feature dependencies
- state dependencies
- API usage
- hooks
- context providers
- realtime components
- animations

Create an internal dependency map before editing anything.

Do not start redesigning before understanding the whole architecture.

---

### 3. REDESIGN SCOPE

Redesign EVERYTHING in the frontend:

#### Pages
- Landing pages
- Dashboard pages
- Settings pages
- Authentication pages
- Admin pages
- User pages
- Error pages
- Empty states

#### Components
- Cards
- Tables
- Buttons
- Inputs
- Forms
- Dropdowns
- Tabs
- Accordions
- Notifications
- Toasts
- Modals
- Popups
- Tooltips
- Sidebar
- Navbar
- Footer
- Search bars
- Pagination
- Profile sections
- Status indicators
- Loading screens
- Skeleton loaders

#### Sub Features
- Create forms
- Edit forms
- Delete confirmations
- Detail views
- Wizards
- Multi-step forms
- File uploads
- Realtime indicators
- Chat panels
- Activity logs
- Filters
- Sorting systems

Everything should receive a complete UI/UX redesign.

---

### 4. DESIGN PRINCIPLES

Create a professional modern interface inspired by:

- Linear
- Notion
- Stripe Dashboard
- Vercel
- Framer
- Apple Human Interface Guidelines

Characteristics:

- clean hierarchy
- premium appearance
- excellent spacing
- modern typography
- better readability
- soft shadows
- subtle animations
- proper empty states
- responsive design
- accessibility support
- intuitive navigation
- mobile-first optimization

Avoid clutter.

Use clear information architecture.

---

### 5. USER EXPERIENCE IMPROVEMENTS

Improve:

- navigation flow
- page hierarchy
- information grouping
- component consistency
- visual feedback
- loading states
- error states
- onboarding clarity
- action discoverability

Every action should feel obvious and intuitive.

---

### 6. CODE REQUIREMENTS

Maintain:

- existing routes
- existing component names if possible
- existing props contracts
- existing hooks
- existing API calls

Refactor only frontend structure.

Create reusable components when necessary.

Avoid duplicated code.

Ensure:

- no TypeScript errors
- no lint errors
- no hydration issues
- no runtime errors
- no broken imports
- no memory leaks

---

### 7. TESTING REQUIREMENTS

After redesign:

Verify every:

- page
- sub page
- modal
- popup
- button
- form
- navigation flow
- realtime feature
- API interaction
- state update
- responsive layout

Ensure all old features still behave exactly the same.

---

### 8. SAFETY REQUIREMENTS

Before replacing any component:

1. Understand existing logic.
2. Preserve event handlers.
3. Preserve states.
4. Preserve side effects.
5. Preserve permissions.
6. Preserve feature conditions.

Never remove code unless absolutely certain it is unused.

If uncertain, ask for confirmation rather than deleting functionality.

---

### 9. DELIVERABLES

For each modification provide:

1. What changed
2. Why it changed
3. Components affected
4. Risk analysis
5. Validation checklist

---

FINAL OBJECTIVE:

Create a complete premium redesign of the entire frontend while keeping 100% feature parity and preserving every existing functionality.

The final application should look entirely new and significantly better while behaving exactly the same as before.