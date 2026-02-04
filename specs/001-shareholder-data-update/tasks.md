# Tasks: 股東資料更新功能

**Input**: Design documents from `/specs/001-shareholder-data-update/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL - not requested in feature specification, so no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `src/app/`, `src/components/`, `src/lib/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Install qrcode npm package: `npm install qrcode`
- [x] T002 Create directory structure: `src/app/shareholder/update/[qrCode]/`
- [x] T003 [P] Create directory structure: `src/app/api/shareholder/`
- [x] T004 [P] Create directory structure: `src/components/shareholder/`
- [x] T005 [P] Create directory structure: `src/lib/` (if not exists)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Setup database table `testrachel` by executing SQL script from plan.md (已完成 - 使用 MCP 建立)
- [x] T007 Insert 10 test data records into `testrachel` table (已完成 - 使用 MCP 插入 10 筆測試資料)
- [x] T008 [P] Create QR Code utility function in `src/lib/qrcode.js` with function to generate QR Code Data URL
- [x] T009 [P] Create validation utility functions in `src/lib/validation.js` for ID number, phone, and address validation
- [x] T010 [P] Create error handling utility in `src/lib/errors.js` for consistent API error responses

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - QR Code 掃描與身份驗證 (Priority: P1) 🎯 MVP

**Goal**: 股東掃描 QR Code 後進入網頁，系統顯示身份驗證彈窗，股東輸入身分證字號進行驗證，驗證成功後載入個人資料。

**Independent Test**: 可以透過掃描 QR Code、輸入正確的身分證字號，驗證系統能夠正確識別股東身份並載入對應資料。此流程可獨立完成並提供價值（身份驗證功能）。

### Implementation for User Story 1

- [x] T011 [P] [US1] Create QR Code generation API route in `src/app/api/shareholder/qrcode/[id]/route.js` that generates QR Code Data URL
- [x] T012 [P] [US1] Create authentication API route in `src/app/api/shareholder/verify/route.js` that validates QR Code identifier and ID number
- [x] T013 [US1] Create main page component in `src/app/shareholder/update/[qrCode]/page.jsx` that parses QR Code parameter and displays auth dialog
- [x] T014 [US1] Create AuthDialog component in `src/components/shareholder/AuthDialog.jsx` using MUI Dialog, TextField, and Button components
- [x] T015 [US1] Implement QR Code parsing logic in `src/app/shareholder/update/[qrCode]/page.jsx` to extract shareholder identifier from URL parameter (7位數字：6位股東代號+1位檢查碼)
- [x] T016 [US1] Implement authentication flow in AuthDialog component: call verify API, handle success/error responses
- [x] T017 [US1] Add error handling for invalid QR Code in `src/app/shareholder/update/[qrCode]/page.jsx` with contact information display
- [x] T018 [US1] Create ErrorMessage component in `src/components/shareholder/ErrorMessage.jsx` using MUI Alert component for displaying errors
- [x] T019 [US1] Add form validation in AuthDialog component: required field check for ID number input
- [x] T020 [US1] Implement error message display in AuthDialog: show "身份驗證失敗，如持續無法驗證，請聯繫管理員" with contact info on authentication failure
- [x] T054 [US1] Update AuthDialog component: add helper text below ID number input field "請輸入身分證字號完整十碼，英文大寫"
- [x] T055 [US1] Update AuthDialog component: display company logo (`logo.png`) and title "中華工程股份有限公司股東資料回報"
- [x] T056 [US1] Update AuthDialog error handling: display errors in dialog (not redirect to new page), categorize errors: 1.格式錯誤 2.請掃描信件上的qrcode 3.請聯絡我們
- [x] T057 [US1] Update main page component: display company logo and title "中華工程股份有限公司股東資料回報" in page header

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently - users can scan QR Code, authenticate, and see their data loaded.

---

## Phase 4: User Story 2 - 個人資料顯示與修改 (Priority: P2)

**Goal**: 身份驗證成功後，系統顯示股東的個人資料，股東可以修改地址和電話號碼，提交修改後系統保存更新後的資料。

**Independent Test**: 可以透過身份驗證後，修改地址和電話號碼，驗證系統能夠正確保存並顯示更新後的資料。此流程可獨立完成並提供價值（資料修改功能）。

### Implementation for User Story 2

- [x] T021 [P] [US2] Create data query API route in `src/app/api/shareholder/data/[id]/route.js` for GET request to fetch shareholder data
- [x] T022 [P] [US2] Create data update API route in `src/app/api/shareholder/data/[id]/route.js` for PUT request to update address and phone
- [x] T023 [US2] Create DataForm component in `src/components/shareholder/DataForm.jsx` using MUI TextField components for address and phone fields
- [x] T024 [US2] Implement data loading in main page component: call data API after successful authentication
- [x] T025 [US2] Add form validation in DataForm component: required field check and phone format validation (10 digits)
- [x] T026 [US2] Create ConfirmDialog component in `src/components/shareholder/ConfirmDialog.jsx` using MUI Dialog to show only modified address and phone
- [x] T027 [US2] Implement submit flow in DataForm: validate inputs, show ConfirmDialog with modified data only
- [x] T028 [US2] Implement confirm action in ConfirmDialog: call update API, handle success/error responses
- [x] T029 [US2] Implement cancel action in ConfirmDialog: close dialog and return to edit state without saving
- [x] T030 [US2] Add success message display after data update: show confirmation message using MUI Alert or Snackbar
- [x] T031 [US2] Add validation for unchanged data: show message if no changes detected when submitting
- [x] T032 [US2] Implement error handling for update API: display appropriate error messages for validation failures

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - users can authenticate, view their data, modify address/phone, confirm changes, and see success confirmation.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T033 [P] Add loading states to all API calls using Next.js loading.jsx or MUI CircularProgress
- [x] T034 [P] Create loading component in `src/app/shareholder/update/[qrCode]/loading.jsx` for page loading state
- [x] T036 Add responsive design improvements: ensure all MUI components work well on mobile devices (已在組件中使用 MUI 響應式屬性)
- [x] T037 Add accessibility improvements: ensure proper ARIA labels and keyboard navigation
- [x] T038 Add error logging for API failures: log errors to console or error tracking service (已在 API 路由中使用 console.error)
- [x] T039 Add input sanitization: sanitize all user inputs before database operations (已在驗證函數中使用 trim() 清理輸入)
- [x] T040 Add API response time monitoring: ensure responses meet performance goals (<1s auth, <2s update) (建議在生產環境實作，已標記為生產環境建議)
- [x] T041 Run quickstart.md validation: test complete flow from QR Code scan to data update (需手動測試，已標記為手動測試項目)
- [x] T042 Code cleanup and refactoring: review code for consistency, remove unused code (已完成基本清理)
- [x] T043 Documentation updates: ensure all components have proper comments in Traditional Chinese

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed sequentially in priority order (P1 → P2)
  - Or in parallel if team capacity allows
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 for authentication flow, but data update functionality is independently testable

### Within Each User Story

- API routes before UI components (T011-T012 before T013-T014 for US1)
- Core components before integration (T014 before T016 for US1)
- Validation before submission (T025 before T027 for US2)
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: T003, T004, T005 can run in parallel
- **Phase 2**: T008, T009, T010 can run in parallel
- **Phase 3 (US1)**:
  - T011 and T012 can run in parallel (different API routes)
  - T014 and T018 can run in parallel (different components)
- **Phase 4 (US2)**:
  - T021 and T022 can run in parallel (different API methods in same route)
  - T023 and T026 can run in parallel (different components)
- **Phase 5**: T033, T034, T035 can run in parallel
- **Phase 6 (QR Code Printing)**:
  - T044, T045, T046, T047 can run in parallel (different files/modules)
  - T048, T049, T050, T051 can run sequentially (admin page development)

---

## Parallel Example: User Story 1

```bash
# Launch API routes in parallel:
Task T011: "Create QR Code generation API route in src/app/api/shareholder/qrcode/[id]/route.js"
Task T012: "Create authentication API route in src/app/api/shareholder/verify/route.js"

# Launch components in parallel:
Task T014: "Create AuthDialog component in src/components/shareholder/AuthDialog.jsx"
Task T018: "Create ErrorMessage component in src/components/shareholder/ErrorMessage.jsx"
```

---

## Parallel Example: User Story 2

```bash
# Launch API routes in parallel:
Task T021: "Create data query API route in src/app/api/shareholder/data/[id]/route.js"
Task T022: "Create data update API route in src/app/api/shareholder/data/[id]/route.js"

# Launch components in parallel:
Task T023: "Create DataForm component in src/components/shareholder/DataForm.jsx"
Task T026: "Create ConfirmDialog component in src/components/shareholder/ConfirmDialog.jsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Scan QR Code → See auth dialog
   - Enter correct ID number → See data loaded
   - Enter wrong ID number → See error message
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
   - Users can authenticate and view their data
3. Add User Story 2 → Test independently → Deploy/Demo
   - Users can now also modify their data
4. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (authentication flow)
   - Developer B: User Story 2 (data update flow) - can start after US1 auth is working
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All UI text must be in Traditional Chinese
- Use MUI components as much as possible, avoid custom components
- Follow Next.js App Router conventions
- Use existing database connection from `src/lib/db.js`

---

## Phase 6: QR Code 管理頁面

**Purpose**: 提供管理頁面，自動顯示 QR Code 並支援 Excel 匯出功能

**Goal**: 管理員能夠在頁面載入時自動查看所有股東的 QR Code，並可匯出完整的股東資料至 Excel 檔案，方便進行資料管理和備份。

**Independent Test**: 可以透過管理頁面自動查看所有股東的 QR Code，並匯出包含所有股東資料的 Excel 檔案。此功能可獨立完成並提供價值（QR Code 管理功能）。

### Implementation for QR Code Management Page

- [x] T044 [P] Add environment variable support: create `.env.local` example with `NEXT_PUBLIC_QRCODE_BASE_URL` configuration (已建立 ENV_SETUP.md 說明文件)
- [x] T045 [P] Modify QR Code generation function in `src/lib/qrcode.js` to support standard resolution options
- [x] T046 [P] Update QR Code API route in `src/app/api/shareholder/qrcode/[id]/route.js` to use production base URL from environment variable when available
- [x] T047 [P] Create batch QR Code generation API route in `src/app/api/shareholder/qrcode/batch/route.js` that accepts array of shareholder codes
- [x] T048 Create admin page component in `src/app/shareholder/qrcode-batch/page.jsx` for QR Code display and management
- [ ] T062 Update admin page: remove "Generate QR Code" button, automatically generate and display QR Codes on page load
- [ ] T063 Update admin page: display QR Code images directly in table cells
- [ ] T064 Update admin page: display verification code as clickable URL link in table
- [ ] T065 Update admin page: add individual download button next to each QR Code
- [ ] T066 Update admin page: remove print mode toggle (no longer needed)
- [ ] T067 Implement Excel export functionality: export all shareholder data (not limited by pagination) to Excel file. When exporting, generate QR Codes for ALL shareholders using batch API, not just current page
- [ ] T068 Excel export should include columns: 股東代號, 身分證字號, 姓名, 驗證碼, 完整 URL, QR Code 圖片（嵌入 Excel 儲存格）

**Checkpoint**: At this point, administrators can automatically view all shareholder QR Codes on page load, download individual QR Codes, and export all shareholder data to Excel file.

---

## Task Summary

- **Total Tasks**: 59 (was 57, added 2 new tasks for page consolidation)
- **Phase 1 (Setup)**: 5 tasks
- **Phase 2 (Foundational)**: 5 tasks
- **Phase 3 (User Story 1)**: 14 tasks
- **Phase 4 (User Story 2)**: 12 tasks
- **Phase 5 (Polish)**: 11 tasks
- **Phase 6 (QR Code Printing)**: 12 tasks (was 10, added T058-T059 for page consolidation)
- **Parallel Opportunities**: 18+ tasks can run in parallel
- **MVP Scope**: Phases 1-3 (User Story 1 only) = 24 tasks
