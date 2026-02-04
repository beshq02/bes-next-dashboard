# Quickstart Guide: 股東資料更新功能

**Date**: 2025-12-18  
**Feature**: 股東資料更新功能

## 概述

本指南提供快速開始使用和開發股東資料更新功能的步驟。

## 前置需求

1. Node.js 18+ 已安裝
2. MSSQL Server 資料庫已配置並可連接
3. 專案依賴已安裝 (`npm install`)

## 安裝步驟

### 1. 安裝額外套件

```bash
npm install qrcode
```

### 2. 建立資料庫資料表

執行以下 SQL 腳本建立測試資料表：

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
        ORIGINAL_HOME_PHONE NVARCHAR(20) NULL,          -- 原住家電話
        ORIGINAL_MOBILE_PHONE NVARCHAR(20) NULL,        -- 原手機電話（可選，約4成有）
        UPDATED_ADDRESS NVARCHAR(200) NULL,             -- 更新地址
        UPDATED_HOME_PHONE NVARCHAR(20) NULL,           -- 更新住家電話
        UPDATED_MOBILE_PHONE NVARCHAR(20) NULL,          -- 更新手機電話
        LOGIN_COUNT INT NOT NULL DEFAULT 0,              -- 登入次數
        UPDATE_COUNT INT NOT NULL DEFAULT 0,             -- 修改次數
        CREATED_AT DATETIME DEFAULT GETDATE(),
        UPDATED_AT DATETIME DEFAULT GETDATE()
    )

    -- 建立索引
    CREATE UNIQUE INDEX IX_testrachel_UUID ON testrachel(UUID)
    CREATE INDEX IX_testrachel_ID_NUMBER ON testrachel(ID_NUMBER)
END
GO

-- 插入測試資料
-- UUID 由系統自動產生（使用 NEWID() 函數）
-- 範例資料：所有資料都有原住家電話，約4成（4筆）有原手機電話
INSERT INTO testrachel (SHAREHOLDER_CODE, ID_NUMBER, BIRTH_DATE, NAME, UUID, ORIGINAL_ADDRESS, ORIGINAL_HOME_PHONE, ORIGINAL_MOBILE_PHONE, LOGIN_COUNT, UPDATE_COUNT) VALUES
('123456', 'A123456789', '1980-01-15', N'王小明', NEWID(), N'台北市信義區信義路五段7號', '02-23456789', '0912345678', 0, 0),
('234567', 'B234567890', '1975-03-22', N'陳美麗', NEWID(), N'新北市板橋區文化路一段188巷', '02-34567890', NULL, 0, 0),
('345678', 'C345678901', '1985-05-10', N'張志強', NEWID(), N'台中市西屯區台灣大道三段99號', '04-12345678', '0934567890', 0, 0),
('456789', 'D456789012', '1990-07-20', N'李雅婷', NEWID(), N'高雄市前金區中正四路211號', '07-23456789', NULL, 0, 0),
('567890', 'E567890123', '1982-09-05', N'林建宏', NEWID(), N'桃園市中壢區中正路100號', '03-34567890', '0956789012', 0, 0),
('678901', 'F678901234', '1978-11-15', N'黃淑芬', NEWID(), N'台南市東區中華東路三段332號', '06-45678901', NULL, 0, 0),
('789012', 'G789012345', '1987-02-28', N'吳文雄', NEWID(), N'新竹市東區光復路二段101號', '03-56789012', '0978901234', 0, 0),
('890123', 'H890123456', '1983-04-12', N'劉佳玲', NEWID(), N'基隆市仁愛區愛一路1號', '02-67890123', NULL, 0, 0),
('901234', 'I901234567', '1992-06-25', N'鄭國華', NEWID(), N'嘉義市西區垂楊路300號', '05-78901234', '0990123456', 0, 0),
('012345', 'J012345678', '1989-08-18', N'許雅雯', NEWID(), N'屏東縣屏東市自由路527號', '08-89012345', NULL, 0, 0)
GO
```

### 3. 設定環境變數

確認 `src/config-global.js` 中的資料庫連線設定正確：

```javascript
export const CONFIG = {
  MSSQL_SERVER: 'your-server',
  MSSQL_PORT: 1433,
  MSSQL_DATABASE: 'STAGE',
  MSSQL_USER: 'your-user',
  MSSQL_PASSWORD: 'your-password',
}
```

## 開發流程

### 1. 啟動開發伺服器

```bash
npm run dev
```

開發伺服器將在 `http://localhost:6230` 啟動。

### 2. 測試 QR Code 產生

QR Code API 支援兩種輸入格式：

- **6 位股東代號**：系統會自動查詢對應的 UUID
- **UUID**：直接使用 UUID 產生 QR Code

#### 使用 6 位股東代號產生 QR Code：

```
http://localhost:6230/api/shareholder/qrcode/123456
```

#### 使用 UUID 產生 QR Code：

```
http://localhost:6230/api/shareholder/qrcode/{uuid}
```

應該會返回包含 QR Code Data URL 的 JSON 回應，格式如下：

```json
{
  "success": true,
  "data": {
    "qrCodeDataUrl": "data:image/png;base64,...",
    "shareholderId": "550e8400-e29b-41d4-a716-446655440000",
    "qrCodeUrl": "http://localhost:6230/shareholder/update/550e8400-e29b-41d4-a716-446655440000",
    "relativeUrl": "/shareholder/update/550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**注意**：

- QR Code 內容為完整 URL（`qrCodeUrl`），確保從紙本掃描時可以正確開啟
- QR Code 識別碼使用標準 UUID 格式（36 字元，包含連字號）
- 如果伺服器 host 為 `0.0.0.0`，會自動替換為 `localhost` 以方便掃描

### 3. 測試 QR Code 有效性檢查

在身份驗證之前，先檢查 QR Code 是否存在且有效：

```bash
curl http://localhost:6230/api/shareholder/qr-check/{uuid}
```

例如：

```bash
curl http://localhost:6230/api/shareholder/qr-check/550e8400-e29b-41d4-a716-446655440000
```

### 4. 測試身份驗證

使用以下 API 測試身份驗證（使用身分證末四碼）：

```bash
curl -X POST http://localhost:6230/api/shareholder/verify \
  -H "Content-Type: application/json" \
  -d '{
    "qrCodeIdentifier": "550e8400-e29b-41d4-a716-446655440000",
    "idLastFour": "6789"
  }'
```

**注意**：

- `qrCodeIdentifier` 為 UUID 格式（標準 UUID，36 字元）
- `idLastFour` 為身分證字號的末四碼（4 位數字）
- 驗證成功後會自動增加 `LOGIN_COUNT`

### 5. 測試取得股東資料

使用 6 位股東代號取得完整資料：

```bash
curl http://localhost:6230/api/shareholder/data/123456
```

### 6. 測試資料更新

使用 6 位股東代號更新資料：

```bash
curl -X PUT http://localhost:6230/api/shareholder/data/123456 \
  -H "Content-Type: application/json" \
  -d '{
    "updatedAddress": "台北市信義區信義路五段8號",
    "updatedHomePhone": "02-23456790",
    "updatedMobilePhone": "0912345679"
  }'
```

**注意**：

- 使用 6 位股東代號作為路徑參數（例如：`123456`）
- 所有欄位都是可選的，至少需要提供一個要更新的欄位
- 更新成功後會自動增加 `UPDATE_COUNT`
- 系統會自動判斷是否有變更，只更新有變更的欄位

## 使用流程（用戶端）

### 1. 掃描 QR Code

股東使用行動裝置掃描個人專屬 QR Code，QR Code 內容為完整 URL：

```
http://localhost:6230/shareholder/update/550e8400-e29b-41d4-a716-446655440000
```

**注意**：

- QR Code 包含完整 URL，而非相對路徑，確保從紙本掃描時可以正確開啟網頁
- QR Code 識別碼格式：標準 UUID（36 字元，包含連字號）
- UUID 在資料建立時由系統自動產生（使用 SQL Server `NEWID()` 函數）
- 範例 UUID：`550e8400-e29b-41d4-a716-446655440000`

### 2. 進入網頁

掃描後自動導向：

```
http://localhost:6230/shareholder/update/550e8400-e29b-41d4-a716-446655440000
```

系統會先檢查 QR Code 的有效性，如果 QR Code 無效或已過期，會顯示錯誤訊息。

網頁標題顯示「中華工程股份有限公司股東資料回報」，並顯示 `logo.png` 作為公司 Logo。

### 3. 身份驗證

QR Code 檢查通過後，系統顯示身份驗證對話框（標題：「中華工程股份有限公司股東資料回報」），對話框內：

- 顯示公司 Logo (`logo.png`)
- 身分證末四碼輸入欄位（使用 Input OTP 元件，4 個輸入框）
- 輸入欄位上方顯示說明：「請輸入身分證末四碼」
- 股東輸入身分證末四碼（例如：`6789`），輸入滿 4 碼即自動驗證

**錯誤處理**（所有錯誤資訊都在原本輸入身分證末四碼的彈窗內顯示，不導向新頁面，以利重新輸入）：

- 格式錯誤或長度不足 → 顯示「認證失敗，請重新輸入身分證末四碼」訊息，允許重新輸入
- QR Code 與身分證不符 → 顯示「認證失敗，請重新輸入身分證末四碼」訊息，並提示「請確認已掃描信件上的 QR Code」，允許重新輸入
- 身分證不存在或打錯 → 顯示「認證失敗，請重新輸入身分證末四碼」訊息，並提示「若持續無法驗證，請聯絡我們」，允許重新輸入
- 錯誤時會觸發搖晃動畫，並自動清空輸入框，聚焦到第一個輸入框

### 4. 查看和修改資料

驗證成功後，顯示股東資料表單，包含：

- **地址**：可修改通訊地址
- **住家電話**：可修改住家電話（可包含連字號）
- **手機電話**：可修改手機電話（僅允許數字）

表單會自動載入現有資料：

- 如果已有 `UPDATED_*` 欄位的值，則顯示更新後的值
- 如果沒有 `UPDATED_*` 欄位的值，則顯示 `ORIGINAL_*` 欄位的值

### 5. 資料確認

點擊「資料確認」按鈕後：

1. 系統直接跳轉到感謝頁面：`/shareholder/update/{uuid}/thank-you`
2. 在背景異步呼叫 API 記錄修改次數（不等待回應，不影響跳轉）
3. 系統會自動判斷哪些欄位有變更，只更新有變更的欄位
4. 更新成功後會自動增加 `UPDATE_COUNT`

## 檔案結構

開發完成後的檔案結構應如下：

```
src/
├── app/
│   ├── shareholder/
│   │   ├── update/
│   │   │   ├── layout.jsx
│   │   │   └── [qrCode]/
│   │   │       ├── page.jsx
│   │   │       ├── loading.jsx
│   │   │       └── thank-you/
│   │   │           └── page.jsx
│   │   └── qrcode-batch/
│   │       ├── layout.jsx
│   │       └── page.jsx
│   └── api/
│       └── shareholder/
│           ├── verify/
│           │   └── route.js
│           ├── qr-check/
│           │   └── [id]/
│           │       └── route.js
│           ├── data/
│           │   └── [id]/
│           │       └── route.js
│           ├── list/
│           │   └── route.js
│           └── qrcode/
│               ├── [id]/
│               │   └── route.js
│               └── batch/
│                   └── route.js
├── components/
│   └── shareholder/
│       ├── AuthDialog.jsx
│       ├── DataForm.jsx
│       ├── ErrorMessage.jsx
│       └── ConfirmDialog.jsx
└── lib/
    └── qrcode.js
```

## 測試資料

測試資料表 `testrachel` 包含 10 筆測試資料，可用於開發和測試：

| 身分證字號 | 姓名   | 股東代號（6位） | 身分證末四碼 | UUID（QR Code 識別碼） |
| ---------- | ------ | --------------- | ------------ | ---------------------- |
| A123456789 | 王小明 | 123456          | 6789         | 自動產生（NEWID()）    |
| B234567890 | 陳美麗 | 234567          | 7890         | 自動產生（NEWID()）    |
| C345678901 | 張志強 | 345678          | 8901         | 自動產生（NEWID()）    |
| ...        | ...    | ...             | ...          | ...                    |

**QR Code 識別碼格式說明**：

- **股東代號**：6 位數字（例如：`123456`），是系統的唯一識別碼（主鍵）
- **UUID**：標準 UUID 格式（36 字元，包含連字號），用於 QR Code URL
- **UUID 產生規則**：系統自動產生標準 UUID（使用 SQL Server `NEWID()` 函數）
- **QR Code API 輸入**：
  - 可輸入 6 位股東代號，系統會自動查詢對應的 UUID
  - 或直接輸入 UUID
- **身份驗證**：使用身分證末四碼（4 位數字），而非完整身分證字號

## 常見問題

### Q: QR Code 無法產生？

A: 確認 `qrcode` 套件已正確安裝，檢查 API Route 的錯誤訊息。

### Q: 身份驗證失敗？

A: 確認：

1. QR Code UUID 對應的股東存在於資料庫
2. 輸入的身分證末四碼與資料庫中的資料相符（使用 `RIGHT(ID_NUMBER, 4)` 比對）
3. QR Code 與身分證末四碼對應到同一個股東（使用 `SHAREHOLDER_CODE` 比對）
4. 資料庫連線正常

### Q: 資料更新失敗？

A: 確認：

1. 至少提供一個要更新的欄位（`updatedAddress`、`updatedHomePhone` 或 `updatedMobilePhone`）
2. 股東代號格式正確（6 位數字）
3. 電話號碼格式正確：
   - 住家電話：可包含連字號（例如：`02-23456789`）
   - 手機電話：僅允許數字（例如：`0912345678`）
4. 資料庫更新權限正常

## 下一步

1. 實作 API Routes（參考 `contracts/api-shareholder.md`）
2. 實作 UI 組件（參考規格文件）
3. 整合測試
4. 部署到正式環境

## 相關文件

- [功能規格](./spec.md)
- [技術計畫](./plan.md)
- [資料模型](./data-model.md)
- [API 合約](./contracts/api-shareholder.md)
- [研究文件](./research.md)
