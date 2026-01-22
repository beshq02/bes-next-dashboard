# Implementation Plan: 股東資料更新功能

**Branch**: `001-shareholder-data-update` | **Date**: 2025-12-18 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-shareholder-data-update/spec.md`

## Summary

本功能實作股東資料更新網頁，允許股東透過掃描個人專屬 QR Code 進入網頁，進行身份驗證後修改個人聯絡資料（地址和電話號碼）。技術實作採用 Next.js 15.x App Router 架構，使用 Material-UI (MUI) 元件庫構建用戶介面，使用 node-qrcode 套件產生 QR Code，資料儲存於 MSSQL 資料庫。

## Technical Context

**Language/Version**: JavaScript (Node.js 18+) / Next.js 15.x  
**Primary Dependencies**:

- Next.js 15.x (App Router)
- Material-UI (MUI) v7.3.2
- node-qrcode (QR Code 產生)
- mssql (資料庫連接)
- React Hook Form (表單處理)

**Storage**: MSSQL Server (測試環境：testrachel 資料表，正式環境：待定)  
**Testing**: Next.js 內建測試框架，必要時可加入 Jest/React Testing Library  
**Target Platform**: Web (響應式設計，支援行動裝置)  
**Project Type**: Web application (Next.js single project)  
**Performance Goals**:

- 身份驗證回應時間 < 1 秒
- 資料修改提交回應時間 < 2 秒
- 支援並發用戶數：100+

**Constraints**:

- 必須使用現有 Next.js 專案架構
- UI 元件優先使用 MUI，避免自訂元件
- 資料庫使用現有 MSSQL 連接配置
- 所有文字使用繁體中文

**Scale/Scope**:

- 預期股東數量：1000-10000 筆（大型公司規模）
- 主要頁面：2 個（股東資料更新頁面、QR Code 管理頁面）
- API 端點：4-5 個（QR Code 解析、身份驗證、資料查詢、資料更新、批次 QR Code 產生）

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. 代碼品質與可讀性檢查

- [x] 所有變數、函數、組件命名是否清晰有意義？ → 使用語義化命名（如 `ShareholderAuthDialog`, `DataUpdateForm`）
- [x] 代碼結構是否遵循單一職責原則？ → 組件拆分為獨立功能模組
- [x] 複雜邏輯是否有適當註釋（繁體中文）？ → API 路由和複雜業務邏輯將添加繁體中文註釋
- [x] 是否已配置 Prettier 和 ESLint？ → 專案已配置

### II. 繁體中文文檔檢查

- [x] 技術文檔是否使用繁體中文？ → 本計畫及相關文檔使用繁體中文
- [x] 用戶介面文字是否使用繁體中文？ → 所有 UI 文字使用繁體中文
- [x] API 文檔是否有繁體中文說明？ → API 路由將包含繁體中文註釋

### III. Next.js 框架規範檢查

- [x] 是否使用 Next.js App Router？ → 使用 App Router (`src/app/`)
- [x] Server Components 和 Client Components 使用是否適當？ → 頁面使用 Server Component，互動組件使用 Client Component
- [x] API 路由是否遵循 RESTful 設計？ → API 路由遵循 RESTful 原則
- [x] 檔案結構是否符合 Next.js 約定？ → 遵循 Next.js 檔案結構約定
- [x] 是否充分利用 Next.js 效能優化功能？ → 使用 Server Components、動態導入等優化

**違規處理**：無違規情況，所有檢查項目通過。

## Project Structure

### Documentation (this feature)

```text
specs/001-shareholder-data-update/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── shareholder/                 # 股東功能統一資料夾
│   │   ├── update/                   # 股東資料更新主頁面
│   │   │   ├── layout.jsx           # 頁面 metadata 設定（頁嵌名稱）
│   │   │   └── [qrCode]/             # 動態路由：QR Code 參數（7位數字：6位股東代號+1位檢查碼）
│   │   │       ├── page.jsx          # 主頁面（Client Component），顯示 Logo 和標題「中華工程股份有限公司股東資料回報」
│   │   │       ├── loading.jsx       # 載入狀態（Next.js 特殊檔案）
│   │   │       └── thank-you/        # 感謝頁面
│   │   │           └── page.jsx      # 感謝頁面（Server Component），顯示感謝訊息和成功提示
│   │   └── qrcode-batch/             # QR Code 管理頁面
│   │       ├── layout.jsx            # 頁面 metadata 設定（頁嵌名稱）
│   │       └── page.jsx              # 管理頁面（表格形式展現股東列表，自動顯示 QR Code，支援篩選和 Excel 匯出）
│   └── api/
│       └── shareholder/              # 股東相關 API
│           ├── verify/               # 身份驗證
│           │   └── route.js
│           ├── data/                 # 資料查詢與更新
│           │   └── [id]/             # 動態路由：股東 ID
│           │       └── route.js      # GET（查詢）、PUT（更新）
│           └── qrcode/               # QR Code 產生
│               ├── [id]/              # 動態路由：股東識別碼（6位或7位數字）
│               │   └── route.js       # GET（單一產生）
│               └── batch/             # 批次產生（Phase 6）
│                   └── route.js       # POST（批次產生）
├── components/
│   └── shareholder/                  # 股東功能組件
│       ├── AuthDialog.jsx            # 身份驗證對話框（Client Component）
│       ├── DataForm.jsx              # 資料修改表單（Client Component）
│       └── ErrorMessage.jsx          # 錯誤訊息組件（Client Component）
└── lib/
    ├── db.js                         # 資料庫連接（已存在）
    └── qrcode.js                     # QR Code 工具函數
```

**Structure Decision**: 採用 Next.js App Router 單一專案結構，功能模組化組織在 `src/app/shareholder/` 資料夾下（包含 `update/` 主頁面和 `qrcode-batch/` 管理頁面），組件放在 `src/components/shareholder/` 目錄下，API 路由遵循 RESTful 設計放在 `src/app/api/shareholder/`。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

無違規情況。

## Phase 0: Research & Technology Decisions

### Research Findings

#### 1. QR Code 產生與解析

**Decision**: 使用 `qrcode` npm 套件產生 QR Code  
**Rationale**:

- `qrcode` 是 Node.js 生態系統中最成熟穩定的 QR Code 產生套件
- 支援多種輸出格式（PNG, SVG, Data URL）
- 可自訂 QR Code 大小、錯誤修正等級等參數
- 與 Next.js Server Actions/API Routes 整合良好

**Alternatives considered**:

- `qrcode-generator`: 功能較少，不支援直接產生圖片
- `qr-image`: 維護較少，功能不如 qrcode 完整

**Implementation**:

- 在 API Route (`/api/shareholder/qrcode`) 中產生 QR Code
- QR Code 內容包含 UUID（標準 UUID 格式）
- UUID 由系統自動產生（使用 SQL Server NEWID() 函數或應用程式層 UUID 產生器）
- 輸出格式：PNG Data URL，可直接嵌入網頁

#### 2. Material-UI 元件選擇

**Decision**: 使用 MUI 現有元件構建 UI  
**Rationale**:

- 專案已安裝 MUI v7.3.2，無需額外安裝
- MUI 提供完整的對話框、表單、按鈕等元件
- 符合專案憲法要求：優先使用現有 UI 元件庫

**Components to use**:

- `Dialog` / `DialogTitle` / `DialogContent` / `DialogActions`: 身份驗證對話框
- `TextField`: 表單輸入欄位
- `Button`: 提交和取消按鈕
- `Alert`: 錯誤和成功訊息顯示
- `Box` / `Stack`: 佈局容器

#### 3. 資料庫設計

**Decision**: 建立兩個主要資料表（測試和正式環境），外加一個操作記錄表  
**Rationale**:

- 測試環境使用 `testrachel` 資料表記錄股東基本資料和最後更新的數據
- 新增 `testrachel_log` 資料表記錄每次登入行為和操作歷程
- `testrachel` 表保持不變，僅記錄當前狀態和累計統計
- `testrachel_log` 表記錄完整的操作歷史，便於追蹤和稽核
- 正式環境資料表名稱後續可配置

**Table Schema**:

**主要資料表 (testrachel)**:
```sql
CREATE TABLE testrachel (
    SHAREHOLDER_CODE NVARCHAR(6) PRIMARY KEY,       -- 股東代號（6位數字，主鍵）
    ID_NUMBER NVARCHAR(10) NOT NULL,                -- 身分證字號
    BIRTH_DATE DATE NOT NULL,                       -- 出生年月日
    NAME NVARCHAR(50) NOT NULL,                     -- 姓名
    UUID UNIQUEIDENTIFIER NOT NULL UNIQUE DEFAULT NEWID(), -- UUID（用於 QR Code URL）
    ORIGINAL_ADDRESS NVARCHAR(200) NOT NULL,        -- 原地址
    ORIGINAL_HOME_PHONE NVARCHAR(20) NULL,          -- 原住家電話
    ORIGINAL_MOBILE_PHONE NVARCHAR(20) NULL,        -- 原手機電話
    UPDATED_ADDRESS NVARCHAR(200) NULL,             -- 更新地址
    UPDATED_HOME_PHONE NVARCHAR(20) NULL,           -- 更新住家電話
    UPDATED_MOBILE_PHONE NVARCHAR(20) NULL,          -- 更新手機電話
    LOGIN_COUNT INT NOT NULL DEFAULT 0,              -- 登入次數
    UPDATE_COUNT INT NOT NULL DEFAULT 0,             -- 修改次數
    CREATED_AT DATETIME DEFAULT GETDATE(),
    UPDATED_AT DATETIME DEFAULT GETDATE()
)
```

**操作記錄表 (testrachel_log)**:
```sql
CREATE TABLE testrachel_log (
    LOG_ID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),  -- 記錄 ID（UUID格式主鍵）
    SHAREHOLDER_CODE NVARCHAR(6) NOT NULL,                -- 股東代號（6位數字）
    ID_NUMBER NVARCHAR(10) NOT NULL,                      -- 身分證字號（從testrachel表帶入）
    SCAN_TIME DATETIME NOT NULL DEFAULT GETDATE(),        -- 掃描進入頁面時間
    LOGIN_TIME DATETIME NOT NULL DEFAULT GETDATE(),       -- 驗證請求時間
    VERIFICATION_TYPE NVARCHAR(10) NOT NULL,              -- 驗證類型：'phone' 或 'id'
    PHONE_NUMBER_USED NVARCHAR(20) NULL,                  -- 使用的手機號碼（僅手機驗證時）
    PHONE_VERIFICATION_TIME DATETIME NULL,                -- 手機驗證完成時間（僅手機驗證成功時）
    RANDOM_CODE NVARCHAR(4) NULL,                         -- 系統產生的原始驗證碼（僅手機驗證時）
    HAS_UPDATED_DATA BIT NOT NULL DEFAULT 0,              -- 是否更新資料（0=否，1=是）
    UPDATED_ADDRESS NVARCHAR(200) NULL,                   -- 更新的地址（如有變更）
    UPDATED_HOME_PHONE NVARCHAR(20) NULL,                 -- 更新的住家電話（如有變更）
    UPDATED_MOBILE_PHONE NVARCHAR(20) NULL                -- 更新的手機電話（如有變更）
)

-- 建立索引
CREATE INDEX IX_testrachel_log_SHAREHOLDER_CODE_ID_NUMBER ON testrachel_log(SHAREHOLDER_CODE, ID_NUMBER)
CREATE INDEX IX_testrachel_log_SHAREHOLDER_CODE ON testrachel_log(SHAREHOLDER_CODE)
CREATE INDEX IX_testrachel_log_ID_NUMBER ON testrachel_log(ID_NUMBER)
CREATE INDEX IX_testrachel_log_LOGIN_TIME ON testrachel_log(LOGIN_TIME)
CREATE INDEX IX_testrachel_log_SCAN_TIME ON testrachel_log(SCAN_TIME)
```

**QR Code UUID 生成規則**:

- 股東代號：6 位數字（例如：`123456`），是系統的唯一識別碼（主鍵）
- UUID 產生規則：系統自動產生標準 UUID（使用 SQL Server NEWID() 函數或應用程式層 UUID 產生器）
  - 格式：標準 UUID（36 字元，包含連字號）
  - 範例：`550e8400-e29b-41d4-a716-446655440000`
- QR Code URL：`{protocol}://{host}/shareholder/update/{uuid}`
- 完整 URL 範例：`http://localhost:6230/shareholder/update/550e8400-e29b-41d4-a716-446655440000`
- 管理頁面輸入：只需輸入 6 位股東代號，系統會根據股東代號查詢資料庫中已儲存的 `UUID`。UUID 在資料建立時就由系統自動產生並儲存，確保唯一性和資料一致性

#### 4. 身份驗證流程

**Decision**: 根據股東資料中的手機號碼決定驗證方式（優先使用最新修改的手機號碼）
- 如果股東資料中有最新修改的手機號碼（`UPDATED_MOBILE_PHONE` 不為空）→ 使用該手機號碼進行驗證碼驗證
- 如果沒有最新修改的手機號碼，但資料中有原始手機號碼（`ORIGINAL_MOBILE_PHONE` 不為空）→ 使用原始手機號碼進行驗證碼驗證
- 如果兩個手機號碼欄位都為空 → 使用身分證末四碼驗證

**Rationale**:

- 股東可重複修改手機號碼，系統會記錄原始手機號碼和最新修改的手機號碼
- 優先使用最新修改的手機號碼，確保使用最即時、最準確的聯絡方式
- 手機號碼驗證提供更現代化的驗證體驗
- 同時保留身分證末四碼作為備用驗證方式，確保所有股東都能使用系統
- 兩者結合提供安全且便捷的驗證機制

**Flow**:

1. QR Code 掃描 → 解析出 UUID（標準 UUID 格式）
2. 系統根據 UUID 查詢對應股東資料 (WHERE UUID = uuid)
3. 系統檢查該股東資料的手機號碼欄位（優先順序：`UPDATED_MOBILE_PHONE` → `ORIGINAL_MOBILE_PHONE`）
   - **如果有手機號碼（任一欄位不為空）**：
     a. 優先使用最新修改的手機號碼（`UPDATED_MOBILE_PHONE`），如果為空則使用原始手機號碼（`ORIGINAL_MOBILE_PHONE`）
     b. 系統自動產生 4 位數字驗證碼
     c. 系統透過 Node.js 簡訊模組（例如 `src/lib/sms.js`，由 `/api/shareholder/send-verification-code` 路由呼叫）直接呼叫簡訊服務商 HTTP API（e8d.tw）發送驗證碼至該手機號碼（驗證碼有效期為 1 分鐘，重新發送間隔為 1 分鐘）。系統必須在輸入驗證碼介面顯示倒數計時器（顯示剩餘秒數），當驗證碼過期（倒數至 0）時，自動跳回原介面（顯示手機號碼與操作按鈕），允許用戶重新發送驗證碼。**系統必須在發送驗證碼時，在 `testrachel_log` 中建立或更新記錄，設定 `ACTION_TYPE = 'verify'`，並同步更新 `PHONE_NUMBER_USED` 和 `RANDOM_CODE` 欄位**
     d. 顯示身份驗證對話框，提示「驗證碼已發送至您的手機，請輸入驗證碼」
     e. 輸入欄位下方顯示說明：「請輸入手機驗證碼（4 碼數字）」
     f. 用戶輸入驗證碼 → 驗證是否正確（驗證碼有效期 1 分鐘）。若在 1 分鐘內嘗試重新發送驗證碼，系統將拒絕並顯示錯誤訊息。系統必須在輸入驗證碼介面顯示倒數計時器（顯示剩餘秒數），當驗證碼過期（倒數至 0）時，自動跳回原介面（顯示手機號碼與操作按鈕），允許用戶重新發送驗證碼
   - **如果兩個手機號碼欄位都為空**：
     a. 顯示身份驗證對話框
     b. 輸入欄位下方顯示說明：「請輸入身分證末四碼」
     c. 輸入身分證末四碼 → 驗證是否與 QR Code 對應的股東資料相符
4. 驗證失敗時，在原本輸入驗證碼/身分證末四碼的彈窗內顯示錯誤資訊（不導向新頁面，以利重新輸入），並且**系統必須在 testrachel_log 中建立一筆記錄**（記錄失敗的驗證嘗試）：
   - 格式錯誤 → 顯示「格式錯誤」錯誤資訊，並記錄 log
   - QR Code 與驗證碼不符 → 顯示「請掃描信件上的 QR Code」錯誤資訊，並記錄 log
   - 驗證碼不存在或打錯 → 重點顯示「請確認驗證碼」錯誤資訊，並用提示方式簡單顯示「請聯絡我們」的資訊，並記錄 log
   - 驗證碼過期（僅手機驗證碼模式）→ 顯示「驗證碼已過期，請重新發送驗證碼」，並記錄 log
   - 重新發送間隔未達 1 分鐘（僅手機驗證碼模式）→ 顯示「請於 X 秒後再次發送驗證碼」（顯示剩餘秒數）
5. 驗證成功時，系統必須：
   a. 更新 testrachel.LOGIN_COUNT = LOGIN_COUNT + 1
   b. 更新 testrachel_log 記錄（記錄已在發送驗證碼時建立，ACTION_TYPE = 'verify'），更新以下欄位：
      - 手機驗證完成時間（PHONE_VERIFICATION_TIME，僅手機驗證成功時）
      - 注意：PHONE_NUMBER_USED 和 RANDOM_CODE 已在發送驗證碼時記錄，不需要再次更新
   c. 載入並顯示股東資料（包含股東代號、姓名、身分證字號、出生年月日、原地址、原住家電話、原手機電話、更新地址、更新住家電話、更新手機電話等）

#### 5. 資料更新流程

**Decision**: 點擊「資料確認」按鈕後直接跳轉到感謝頁面，背景異步記錄修改次數  
**Rationale**:

- 極簡化用戶體驗，無需等待
- 提供即時反饋（立即跳轉到感謝頁面）
- 符合規格要求：點擊按鈕後直接跳轉，背景記錄修改次數

#### 6. QR Code 管理頁面

**Decision**: 頁面載入時自動顯示 QR Code，提供 Excel 匯出功能  
**Rationale**:

- 自動顯示 QR Code 提供更好的使用者體驗，無需額外操作
- 表格中直接顯示 QR Code 圖片，方便管理員快速查看
- Excel 匯出功能方便管理員進行資料管理和備份
- 使用固定生產環境 URL 確保 QR Code 長期有效

**Implementation Strategy**:

- **環境變數管理**: 使用 `NEXT_PUBLIC_QRCODE_BASE_URL` 環境變數設定生產環境 URL
  - 開發環境：使用動態 base URL（從 request.url 取得）
  - 生產環境：使用固定的環境變數值
- **QR Code 產生參數**:
  - 解析度：300px 寬度（標準解析度，適合螢幕顯示）
  - 錯誤修正等級：`M`（中等等級，適合一般用途）
  - 邊距：2（標準邊距）
- **自動批次產生**: 頁面載入時自動為當前分頁顯示的股東產生 QR Code
  - 使用 `POST /api/shareholder/qrcode/batch` API
  - 接受股東代號陣列（僅包含當前分頁的股東）
  - 返回當前分頁的 QR Code 的 Data URL 陣列
  - 當分頁變更時，自動為新分頁的股東產生 QR Code
- **Excel 匯出功能**:
  - 使用 `exceljs` 套件產生 Excel 檔案（支援圖片嵌入功能）
  - 匯出所有股東資料（不受分頁限制）
  - 匯出時必須為所有股東產生 QR Code（呼叫批次產生 API，傳入所有股東代號，不受分頁限制）
  - 包含欄位：股東代號、身分證字號、姓名、驗證碼、完整 URL、QR Code 圖片（嵌入 Excel 儲存格）
  - QR Code 圖片以 PNG 格式嵌入 Excel，圖片大小為 80x80 像素

**Technical Details**:

```javascript
// 環境變數設定範例
NEXT_PUBLIC_QRCODE_BASE_URL=https://shareholder.yourcompany.com

// QR Code 標準選項
const qrCodeOptions = {
  errorCorrectionLevel: 'M',
  type: 'image/png',
  width: 300,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
}

// Excel 匯出實作（使用 exceljs）
import ExcelJS from 'exceljs'

// 建立工作簿
const workbook = new ExcelJS.Workbook()
const worksheet = workbook.addWorksheet('股東資料')

// 設定欄位標題
worksheet.columns = [
  { header: '股東代號', key: 'shareholderCode', width: 12 },
  { header: '身分證字號', key: 'idNumber', width: 12 },
  { header: '姓名', key: 'name', width: 15 },
     { header: 'UUID', key: 'uuid', width: 40 },
  { header: '完整 URL', key: 'fullUrl', width: 50 },
  { header: 'QR Code', key: 'qrCode', width: 20 },
]

// 轉換 base64 Data URL 為 Uint8Array（瀏覽器相容）
const base64ToUint8Array = (base64String) => {
  const base64Data = base64String.replace(/^data:image\/png;base64,/, '')
  const binaryString = atob(base64Data)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

// 嵌入 QR Code 圖片到 Excel
const imageBuffer = base64ToUint8Array(qrCodeDataUrl)
const imageId = workbook.addImage({
  buffer: imageBuffer,
  extension: 'png',
})
worksheet.addImage(imageId, {
  tl: { col: 5, row: rowNumber - 1 }, // QR Code 欄位是第 6 欄（索引 5）
  ext: { width: 80, height: 80 },
})
row.height = 80 // 調整行高以容納圖片
```

## Phase 1: Data Model & API Contracts

### Data Model

詳見 `data-model.md`（將在 Phase 1 生成）

### API Contracts

詳見 `contracts/` 目錄（將在 Phase 1 生成）

主要 API 端點：

1. `GET /api/shareholder/qrcode/[id]` - 產生單一 QR Code
2. `POST /api/shareholder/qrcode/batch` - 批次產生 QR Code（管理頁面自動載入用）
3. `POST /api/shareholder/verify` - 身份驗證
4. `GET /api/shareholder/data/[id]` - 查詢股東資料
5. `PUT /api/shareholder/data/[id]` - 更新股東資料
6. `GET /api/shareholder/list` - 查詢所有股東列表（管理頁面用）
7. `GET /api/shareholder/list` - 查詢股東列表（管理頁面用）

主要頁面：

1. `/shareholder/update/[qrCode]` - 股東資料更新主頁面（公開頁面，供股東使用）
2. `/shareholder/qrcode-batch` - QR Code 管理頁面（管理功能，表格形式展現股東列表，自動顯示 QR Code，支援篩選和 Excel 匯出）

### Quickstart Guide

詳見 `quickstart.md`（將在 Phase 1 生成）

## Database Setup

### 測試資料表建立

由於 MCP 權限限制，請手動執行以下 SQL 腳本建立測試資料表：

```sql
-- 建立測試資料表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[testrachel]') AND type in (N'U'))
BEGIN
    CREATE TABLE testrachel (
        SHAREHOLDER_CODE NVARCHAR(6) PRIMARY KEY,       -- 股東代號（6位數字，主鍵）
        ID_NUMBER NVARCHAR(10) NOT NULL,                -- 身分證字號
        BIRTH_DATE DATE NOT NULL,                       -- 出生年月日
        NAME NVARCHAR(50) NOT NULL,                     -- 姓名
        UUID UNIQUEIDENTIFIER NOT NULL UNIQUE DEFAULT NEWID(), -- UUID（用於 QR Code URL）
        ORIGINAL_ADDRESS NVARCHAR(200) NOT NULL,        -- 原地址
        ORIGINAL_HOME_PHONE NVARCHAR(20) NOT NULL,       -- 原住家電話（必填）
        ORIGINAL_MOBILE_PHONE NVARCHAR(20) NULL,        -- 原手機電話（可選，約4成有）
        UPDATED_ADDRESS NVARCHAR(200) NULL,             -- 更新地址
        UPDATED_HOME_PHONE NVARCHAR(20) NULL,           -- 更新住家電話
        UPDATED_MOBILE_PHONE NVARCHAR(20) NULL,          -- 更新手機電話
        LOGIN_COUNT INT NOT NULL DEFAULT 0,              -- 登入次數
        UPDATE_COUNT INT NOT NULL DEFAULT 0,             -- 修改次數
        CREATED_AT DATETIME DEFAULT GETDATE(),
        UPDATED_AT DATETIME DEFAULT GETDATE()
    )

    -- 建立索引以提升查詢效能
    CREATE UNIQUE INDEX IX_testrachel_UUID ON testrachel(UUID)
    CREATE INDEX IX_testrachel_ID_NUMBER ON testrachel(ID_NUMBER)
END
GO

-- 建立股東操作記錄表
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[testrachel_log]') AND type in (N'U'))
BEGIN
    CREATE TABLE testrachel_log (
        LOG_ID BIGINT IDENTITY(1,1) PRIMARY KEY,              -- 記錄 ID（自動遞增主鍵）
        SHAREHOLDER_CODE NVARCHAR(6) NOT NULL,                -- 股東代號（6位數字）
        LOGIN_TIME DATETIME NOT NULL DEFAULT GETDATE(),       -- 掃碼登入時間
        VERIFICATION_TYPE NVARCHAR(10) NOT NULL,              -- 驗證類型：'phone' 或 'id'
        VERIFICATION_CODE NVARCHAR(4) NULL,                   -- 手機驗證碼（4位數字，僅手機驗證時）
        PHONE_NUMBER_USED NVARCHAR(20) NULL,                  -- 使用的手機號碼（僅手機驗證時）
        HAS_UPDATED_DATA BIT NOT NULL DEFAULT 0,              -- 是否更新資料（0=否，1=是）
        UPDATED_ADDRESS NVARCHAR(200) NULL,                   -- 更新的地址（如有變更）
        UPDATED_HOME_PHONE NVARCHAR(20) NULL,                 -- 更新的住家電話（如有變更）
        UPDATED_MOBILE_PHONE NVARCHAR(20) NULL,               -- 更新的手機電話（如有變更）
        CREATED_AT DATETIME DEFAULT GETDATE()                 -- 記錄建立時間
    )

    -- 建立索引以提升查詢效能
    CREATE INDEX IX_testrachel_log_SHAREHOLDER_CODE ON testrachel_log(SHAREHOLDER_CODE)
    CREATE INDEX IX_testrachel_log_LOGIN_TIME ON testrachel_log(LOGIN_TIME)
END
GO

-- 插入 10 筆測試資料
-- UUID 由系統自動產生（使用 NEWID() 函數）
-- 範例資料：所有資料都有原住家電話，約4成（4筆）有原手機電話
INSERT INTO testrachel (SHAREHOLDER_CODE, ID_NUMBER, BIRTH_DATE, NAME, UUID, ORIGINAL_ADDRESS, ORIGINAL_HOME_PHONE, ORIGINAL_MOBILE_PHONE, LOGIN_COUNT, UPDATE_COUNT) VALUES
('123456', 'A123456789', '1980-01-15', N'王小明', NEWID(), N'台北市信義區信義路五段7號', '02-23456789', '0912345678', 0, 0),
('234567', 'B234567890', '1975-03-22', N'陳美麗', NEWID(), N'新北市板橋區文化路一段188巷', '02-34567890', NULL, 0, 0),
('345678', 'C345678901', '1985-05-10', N'張志強', NEWID(), N'台中市西屯區台灣大道三段99號', '04-45678901', '0934567890', 0, 0),
('456789', 'D456789012', '1990-07-08', N'李雅婷', NEWID(), N'高雄市前金區中正四路211號', '07-56789012', NULL, 0, 0),
('567890', 'E567890123', '1982-09-25', N'林建宏', NEWID(), N'桃園市中壢區中正路100號', '03-67890123', '0956789012', 0, 0),
('678901', 'F678901234', '1978-11-12', N'黃淑芬', NEWID(), N'台南市東區中華東路三段332號', '06-78901234', NULL, 0, 0),
('789012', 'G789012345', '1988-02-18', N'吳文雄', NEWID(), N'新竹市東區光復路二段101號', '03-89012345', '0978901234', 0, 0),
('890123', 'H890123456', '1983-04-30', N'劉佳玲', NEWID(), N'基隆市仁愛區愛一路1號', '02-90123456', NULL, 0, 0),
('901234', 'I901234567', '1992-06-14', N'鄭國華', NEWID(), N'嘉義市西區垂楊路300號', '05-01234567', NULL, 0, 0),
('012345', 'J012345678', '1987-08-20', N'許雅雯', NEWID(), N'屏東縣屏東市自由路527號', '08-12345678', NULL, 0, 0)
GO
```

### 正式資料表

正式環境資料表名稱和結構將後續確定，目前先使用測試資料表進行開發。

## Next Steps

1. **Phase 1 完成後**：生成 `data-model.md`、`contracts/`、`quickstart.md`
2. **執行 `/speckit.tasks`**：將計畫分解為具體實作任務
3. **開始實作**：按照任務清單逐步實作功能
