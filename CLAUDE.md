# CLAUDE.md - AI Assistant Guide for BES Next Dashboard

## Project Overview

Enterprise internal dashboard for BES (a construction/engineering company) built with Next.js 15 App Router and React 19. The application provides several business modules: weekly work reports, shareholder data management, government tender tracking, employee analytics, and utility tools. The UI is written in Traditional Chinese (繁體中文).

## Quick Reference

```bash
npm run dev          # Start dev server (Turbo mode, port 6230)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Jest tests
```

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 15.5 (App Router), React 19 |
| Language | JavaScript (JSX) — no TypeScript |
| Styling | Tailwind CSS 3.4, MUI 7, Emotion, styled-components |
| UI Components | Shadcn/UI (new-york style), Radix UI, Aceternity UI, Magic UI |
| Forms | React Hook Form + Zod validation |
| Charts | Recharts, ECharts |
| Database | MSSQL (via `mssql` package), Supabase |
| Testing | Jest 30, babel-jest |
| Linting | ESLint 9 (flat config), Prettier |
| Package Manager | npm (bun.lock also present) |

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.js                 # Root layout
│   ├── page.js                   # Root page (redirects to ICCC)
│   ├── globals.css               # Global styles & Tailwind directives
│   ├── api/                      # API route handlers
│   │   ├── shareholder/          # Shareholder CRUD, QR codes, SMS verification
│   │   ├── employee/             # Employee analytics APIs
│   │   ├── file/[fileId]/        # File download handler
│   │   ├── token-validation/     # Auth token validation
│   │   └── db/                   # DB connection test
│   ├── weekly-report/            # Weekly report dashboard (charts, sections)
│   ├── gcc-tender/               # Government tender tracking module
│   ├── shareholder/              # Shareholder management (QR batch, update forms)
│   ├── employee-resigned-analysis/ # Employee resignation analytics
│   ├── employee-stock-trust/     # Stock trust information
│   ├── lunch/                    # Lunch picker utility
│   ├── admin/                    # Admin panel
│   └── token-expired/            # Token expiration page
├── components/
│   ├── ui/                       # Shadcn/UI primitives (DO NOT edit manually)
│   ├── shareholder/              # Shareholder-specific components
│   ├── aceternity-ui/            # Aceternity UI components
│   └── magic-ui/                 # Magic UI components
├── hooks/                        # Custom React hooks
├── lib/                          # Utilities and shared logic
│   ├── db.js                     # MSSQL connection pool singleton
│   ├── supabase.js               # Supabase client
│   ├── errors.js                 # Standardized API error/success responses
│   ├── validation.js             # Form validation rules
│   ├── sms.js                    # SMS sending (e8d.tw)
│   ├── qrcode.js                 # QR code generation with logo
│   ├── utils.js                  # cn() helper (clsx + tailwind-merge)
│   └── pdf/                      # PDF generation templates
├── theme/                        # MUI theme configuration
├── fonts/                        # Geist font files
├── utils/                        # Additional utilities
├── config-global.js              # Centralized env config, color/size constants
└── __tests__/                    # Jest test suite
    ├── helpers/setup.js          # Shared mocks & test fixtures
    └── api/shareholder/          # API endpoint tests
```

## Key Conventions

### Import Path Alias

Use `@/` to import from `src/`. Configured in `jsconfig.json`:
```js
import db from '@/lib/db'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
```

### Import Ordering (enforced by eslint-plugin-perfectionist)

Imports are auto-sorted by line length in this group order:
1. Styles
2. Types
3. Built-in / External packages
4. Shadcn components (`@/components/**`)
5. MUI (`@mui/**`)
6. Hooks (`@/hooks/**`)
7. Utilities
8. Internal modules
9. Components, sections
10. Parent/sibling/index

### Code Style (Prettier)

- **No semicolons** (`semi: false`)
- **Single quotes** (`singleQuote: true`)
- **Print width**: 100 characters
- **Trailing commas**: ES5
- **Arrow function parens**: avoid when possible (`arrowParens: 'avoid'`)
- **Tab width**: 2 spaces
- Tailwind classes are auto-sorted by `prettier-plugin-tailwindcss`

### Component Patterns

- **Server Components** are the default — use for data fetching and static rendering
- **Client Components** require `'use client'` directive at the top of the file
- Each feature module (e.g., `weekly-report`, `gcc-tender`) has its own `components/` subdirectory for module-specific components
- Shared UI components live in `src/components/ui/` (Shadcn) — these are generated and should not be manually edited
- Use `cn()` from `@/lib/utils` for conditional Tailwind class merging

### API Route Conventions

API routes use Next.js App Router route handlers with named exports (`GET`, `POST`, `PUT`).

**Standard response format** (use helpers from `@/lib/errors.js`):

```js
// Success
import { createSuccessResponse } from '@/lib/errors'
return NextResponse.json(createSuccessResponse(data))
// → { success: true, data: ... }

// Error
import { createErrorByCode, ERROR_CODES } from '@/lib/errors'
const error = createErrorByCode(ERROR_CODES.DATABASE_ERROR)
return NextResponse.json(error, { status: error.statusCode })
// → { success: false, error: { code: 'DATABASE_ERROR', message: '資料庫錯誤' }, statusCode: 500 }
```

**Error codes** are defined in `ERROR_CODES` constant. HTTP status codes are automatically mapped:
- 400: `MISSING_REQUIRED_FIELD`, `INVALID_FORMAT`, `NO_CHANGES`
- 401: `AUTHENTICATION_FAILED`
- 404: `SHAREHOLDER_NOT_FOUND`, `QR_CODE_INVALID`
- 500: `DATABASE_ERROR`, `INTERNAL_SERVER_ERROR`

### Database Access

Use the singleton `db` from `@/lib/db.js` — never create new connection pools:

```js
import db from '@/lib/db'

const results = await db.query(
  'SELECT * FROM table WHERE id = @id',
  { id: someValue }
)
```

- Parameterized queries with `@param` placeholders — always use params to prevent SQL injection
- Auto type inference: strings → `NVarChar`, numbers → `Int`, null → `NVarChar`
- Connection pool: max 50, min 5, 30s timeout

### Form Validation

Validation rules are centralized in `@/lib/validation.js`. Forms use React Hook Form + Zod schemas. Key validations:
- ID number: 1 letter + 9 digits (10 chars)
- Phone: 10 digits
- Address: max 200 characters
- QR code: 7 digits

### Environment Variables

Configured in `.env` and accessed via `src/config-global.js`:

```js
import { CONFIG } from '@/config-global'
// CONFIG.API_HOST, CONFIG.MSSQL_SERVER, CONFIG.MSSQL_PORT, etc.
```

- `NEXT_PUBLIC_*` variables are exposed to the client
- Database credentials and SMS keys are server-only

### UI Messages

All user-facing text is in **Traditional Chinese (繁體中文)**. Error messages, labels, and UI copy should follow this convention.

## Testing

Tests are in `src/__tests__/` and use Jest with a Node test environment.

```bash
npm test                    # Run all tests
npx jest --testPathPattern shareholder  # Run specific tests
```

### Test patterns

- Tests mock `@/lib/db` (the database module) and `next/server` (NextResponse)
- Shared mocks and fixtures are in `__tests__/helpers/setup.js`
- Import the setup file at the top of each test:
  ```js
  import { createMockRequest, createParams, MOCK_SHAREHOLDER, resetAllMocks } from '../helpers/setup'
  import db from '@/lib/db'
  ```
- Use `resetAllMocks()` in `beforeEach` to clear mock state
- Test both success and error paths for API endpoints
- Next.js 15 dynamic params are Promises — use `createParams({ id: 'value' })` helper

### ESLint notes

- `src/components/ui/**` is excluded from linting (Shadcn generated code)
- `src/__tests__/**` is excluded from linting
- ESLint is skipped during `next build` (configured in `next.config.mjs`)

## Build & Deployment

- Dev server runs on `0.0.0.0:6230` with Turbo mode
- `mssql` and `tedious` are marked as `serverExternalPackages` in Next.js config
- Client-side webpack fallbacks disable Node.js built-in modules (`fs`, `net`, `crypto`, etc.)
- Remote images allowed from `cpm2.bes.com.tw`

## Common Tasks

### Adding a new API endpoint

1. Create route handler in `src/app/api/<module>/route.js`
2. Use `db.query()` for database access with parameterized queries
3. Return responses using `createSuccessResponse()` / `createErrorByCode()` from `@/lib/errors.js`
4. Add corresponding test in `src/__tests__/api/<module>/`

### Adding a new page

1. Create directory under `src/app/<route>/`
2. Add `page.jsx` (use `.jsx` extension)
3. Optionally add `layout.jsx`, `loading.jsx`, `error.jsx`
4. Module-specific components go in `src/app/<route>/components/`

### Adding a Shadcn UI component

```bash
npx shadcn@latest add <component-name>
```

Components are installed to `src/components/ui/`. Do not manually edit these files.

### Working with the database

- The `Database` class in `src/lib/db.js` manages a MSSQL connection pool singleton
- Always use parameterized queries — never concatenate user input into SQL strings
- The pool auto-reconnects if the connection drops
- UTC is disabled (`useUTC: false`) so dates use local timezone (UTC+8)
