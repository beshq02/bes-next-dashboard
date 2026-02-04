# Research: 股東資料更新功能

**Date**: 2025-12-18  
**Feature**: 股東資料更新功能

## Technology Decisions

### 1. QR Code 產生與解析

**Decision**: 使用 `qrcode` npm 套件產生 QR Code

**Rationale**:

- `qrcode` 是 Node.js 生態系統中最成熟穩定的 QR Code 產生套件
- 支援多種輸出格式（PNG, SVG, Data URL）
- 可自訂 QR Code 大小、錯誤修正等級等參數
- 與 Next.js Server Actions/API Routes 整合良好
- 活躍維護，社群支援良好

**Alternatives considered**:

- `qrcode-generator`: 功能較少，不支援直接產生圖片，需要額外處理
- `qr-image`: 維護較少，功能不如 qrcode 完整，文件較少

**Implementation Notes**:

- 安裝：`npm install qrcode`
- 在 API Route (`/api/shareholder/qrcode/[id]`) 中產生 QR Code
- QR Code 內容為完整 URL，格式：`{protocol}://{host}/shareholder/update/{shareholder_identifier}`
- 股東識別碼格式：7 位數字，由 6 位股東代號 + 1 位系統自動產生的隨機碼組成
- 範例：股東代號 `123456` + 系統自動產生的隨機碼 `7` = QR Code URL: `1234567`
- API 輸入處理：
  - 如果輸入 6 位數字（股東代號），系統會自動產生 1 位隨機碼組成 7 位數字的 QR Code URL
  - 如果輸入 7 位數字（完整 QR Code URL），系統直接使用該識別碼
- 輸出格式：PNG Data URL，可直接嵌入網頁或下載
- API 會自動從請求中取得 base URL，確保 QR Code 包含完整網址
- 如果 host 為 `0.0.0.0`，會自動替換為 `localhost` 以方便掃描

**Example Usage**:

```javascript
import QRCode from 'qrcode'

// 構建完整 URL
const baseUrl = 'http://localhost:6230' // 從 request.url 取得
const qrCodeUrl = `${baseUrl}/shareholder/update/${shareholderIdentifier}`

// 產生 QR Code Data URL（包含完整 URL）
const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, {
  errorCorrectionLevel: 'M',
  type: 'image/png',
  width: 300,
})
```

**QR Code URL Format**:

- 完整 URL：`http://localhost:6230/shareholder/update/1234567`
- 識別碼格式：6 位股東代號 + 1 位隨機碼（共 7 位數字）
- 範例：股東代號 `123456` + 隨機碼 `7` = QR Code URL: `1234567`
- 確保從紙本掃描時可以正確開啟，無需依賴當前頁面的 base URL

### 2. Material-UI 元件選擇

**Decision**: 使用 MUI 現有元件構建 UI

**Rationale**:

- 專案已安裝 MUI v7.3.2，無需額外安裝
- MUI 提供完整的對話框、表單、按鈕等元件
- 符合專案憲法要求：優先使用現有 UI 元件庫，避免自訂元件
- MUI 元件支援響應式設計，適合行動裝置使用
- 豐富的文件和範例，開發效率高

**Components to use**:

- `Dialog` / `DialogTitle` / `DialogContent` / `DialogActions`: 身份驗證和確認對話框
- `TextField`: 表單輸入欄位（身分證字號、地址、電話）
- `Button`: 提交和取消按鈕
- `Alert`: 錯誤和成功訊息顯示
- `Box` / `Stack`: 佈局容器
- `Typography`: 文字顯示

**Styling Approach**:

- 使用 MUI 的 `sx` prop 進行樣式自訂
- 遵循 MUI 設計系統的間距和顏色規範
- 確保符合無障礙設計標準

### 3. 資料庫設計

**Decision**: 建立兩個資料表（測試和正式環境）

**Rationale**:

- 測試環境使用 `testrachel` 資料表，便於開發和測試
- 正式環境資料表名稱後續可配置，透過環境變數切換
- 資料表結構包含股東基本資料和 QR Code 資訊
- 使用現有 MSSQL 連接配置，無需額外設定

**Table Schema Design**:

- `id`: 主鍵，自動遞增
- `id_number`: 身分證字號，唯一索引，用於身份驗證
- `name`: 姓名
- `address`: 地址（必填）
- `phone`: 電話號碼（必填）
- `qr_code_url`: QR Code URL 或識別碼（可選）
- `created_at`: 建立時間
- `updated_at`: 更新時間

**Indexing Strategy**:

- `id_number` 建立唯一索引，提升查詢效能
- `qr_code_url` 建立索引，用於 QR Code 解析

### 4. 身份驗證流程設計

**Decision**: QR Code 包含股東識別碼，結合身分證字號進行雙重驗證

**Rationale**:

- QR Code 提供快速進入頁面的便利性
- 身分證字號驗證確保身份正確性
- 兩者結合提供安全且便捷的驗證機制
- 符合規格要求：QR Code 掃描後仍需輸入身分證字號驗證

**Flow Design**:

1. QR Code 掃描 → 解析出股東識別碼（7 位數字：6 位股東代號 + 1 位隨機碼）
2. 系統根據識別碼查詢對應股東資料
3. 顯示身份驗證對話框（MUI Dialog），標題顯示「中華工程股份有限公司股東資料回報」，顯示 `logo.png` 作為公司 Logo
4. 輸入欄位下方顯示說明：「請輸入身分證字號完整十碼，英文大寫」
5. 用戶輸入身分證字號
6. 驗證身分證字號是否與 QR Code 對應的股東資料相符
7. 驗證成功 → 載入並顯示股東資料
8. 驗證失敗 → 在原本輸入身分證字號的彈窗內顯示錯誤資訊（不導向新頁面，以利重新輸入），根據錯誤類型顯示：
   - 格式錯誤 → 顯示「格式錯誤」錯誤資訊
   - QR Code 與身分證不符 → 顯示「請掃描信件上的 QR Code」錯誤資訊
   - 身分證不存在或打錯 → 重點顯示「請確認身分證字號」錯誤資訊，並用提示方式簡單顯示「請聯絡我們」的資訊
9. 允許無限次重試，所有錯誤都在原本的彈窗內處理

**Security Considerations**:

- QR Code 識別碼建議使用 UUID 或加密字串，避免可預測性
- 身分證字號驗證在伺服器端進行，不在客戶端處理
- 錯誤訊息不洩露系統內部資訊（如「身分證字號不存在」改為通用錯誤訊息）

### 5. 資料更新流程設計

**Decision**: 點擊「資料確認」按鈕後直接跳轉到感謝頁面，背景異步記錄修改次數

**Rationale**:

- 符合規格要求：點擊按鈕後直接跳轉，背景記錄修改次數
- 極簡化用戶體驗，無需等待任何處理
- 提供即時反饋（立即跳轉到感謝頁面）
- 提升操作流暢度，減少用戶等待時間

**Flow Design**:

1. 用戶查看或修改地址或電話號碼
2. 點擊「資料確認」按鈕
3. 立即跳轉到感謝頁面（不等待任何處理）
4. 背景異步調用 API 記錄修改次數（不影響跳轉）

### 6. Next.js App Router 架構

**Decision**: 使用 Next.js App Router 的動態路由和 Server/Client Components

**Rationale**:

- 專案已使用 Next.js 15.x App Router
- 動態路由 `[qrCode]` 用於接收 QR Code 參數
- Server Components 用於初始資料載入和 SEO
- Client Components 用於互動功能（對話框、表單）

**Route Structure**:

- `/shareholder/update/[qrCode]` - 主頁面，接收 QR Code 參數
- `/api/shareholder/verify` - 身份驗證 API
- `/api/shareholder/data/[id]` - 資料查詢和更新 API
- `/api/shareholder/qrcode/[id]` - QR Code 產生 API

## Integration Points

### 現有系統整合

1. **資料庫連接**: 使用現有 `src/lib/db.js` 模組
2. **UI 元件庫**: 使用已安裝的 MUI v7.3.2
3. **專案結構**: 遵循現有 Next.js App Router 結構
4. **樣式系統**: 可選使用 Tailwind CSS（專案已配置）或 MUI 的 `sx` prop

### 外部依賴

1. **qrcode**: 需要安裝 `npm install qrcode`
2. **mssql**: 已安裝，用於資料庫操作
3. **@mui/material**: 已安裝，用於 UI 元件
4. **react-hook-form**: 可選，用於表單處理（專案已安裝）

## Performance Considerations

1. **QR Code 產生**: 在伺服器端產生，避免客戶端計算負擔
2. **資料查詢**: 使用索引優化查詢效能
3. **API 回應時間**: 目標 < 1 秒（身份驗證）、< 2 秒（資料更新）
4. **客戶端優化**: 使用 Next.js 的動態導入和代碼分割

## Security Considerations

1. **身份驗證**: 伺服器端驗證，不信任客戶端輸入
2. **SQL 注入防護**: 使用參數化查詢（現有 db.js 已支援）
3. **錯誤訊息**: 不洩露系統內部資訊
4. **QR Code 安全性**: 使用不可預測的識別碼（UUID）

## Testing Strategy

1. **單元測試**: 測試 QR Code 產生和資料驗證邏輯
2. **整合測試**: 測試 API 端點和資料庫操作
3. **E2E 測試**: 測試完整用戶流程（QR Code 掃描 → 驗證 → 修改）

## Open Questions / Future Considerations

1. **QR Code 過期機制**: 目前規格未明確，後續可能需要實作
2. **修改歷史記錄**: 是否需要記錄資料修改歷史？
3. **通知機制**: 資料修改後是否需要通知管理員？
4. **批次 QR Code 產生**: 是否需要批次產生多個股東的 QR Code？
