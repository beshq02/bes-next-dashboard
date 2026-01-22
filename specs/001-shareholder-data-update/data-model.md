# Data Model: 股東資料更新功能

**Date**: 2025-12-18  
**Feature**: 股東資料更新功能

## Entities

### 1. 股東 (Shareholder)

代表系統中的股東個體，包含基本資料和聯絡資訊。

**Table Name**: `testrachel` (測試環境) / `[待定]` (正式環境)

**Attributes**:

| 欄位名稱                | 資料型別         | 約束                  | 說明                      |
| ----------------------- | ---------------- | --------------------- | ------------------------- |
| `SHAREHOLDER_CODE`      | NVARCHAR(6)      | PRIMARY KEY, NOT NULL | 股東代號（6位數字，主鍵） |
| `ID_NUMBER`             | NVARCHAR(10)     | NOT NULL              | 身分證字號                |
| `BIRTH_DATE`            | DATE             | NOT NULL              | 出生年月日                |
| `NAME`                  | NVARCHAR(50)     | NOT NULL              | 姓名                      |
| `UUID`                  | UNIQUEIDENTIFIER | NOT NULL, UNIQUE      | UUID（用於 QR Code URL）  |
| `ORIGINAL_ADDRESS`      | NVARCHAR(200)    | NOT NULL              | 原地址                    |
| `ORIGINAL_HOME_PHONE`   | NVARCHAR(20)     | NULL                  | 原住家電話                |
| `ORIGINAL_MOBILE_PHONE` | NVARCHAR(20)     | NULL                  | 原手機電話                |
| `UPDATED_ADDRESS`       | NVARCHAR(200)    | NULL                  | 更新地址                  |
| `UPDATED_HOME_PHONE`    | NVARCHAR(20)     | NULL                  | 更新住家電話              |
| `UPDATED_MOBILE_PHONE`  | NVARCHAR(20)     | NULL                  | 更新手機電話              |
| `LOGIN_COUNT`           | INT              | NOT NULL, DEFAULT 0   | 登入次數                  |
| `UPDATE_COUNT`          | INT              | NOT NULL, DEFAULT 0   | 修改次數                  |
| `CREATED_AT`            | DATETIME         | DEFAULT GETDATE()     | 建立時間                  |
| `UPDATED_AT`            | DATETIME         | DEFAULT GETDATE()     | 更新時間                  |

**Indexes**:

- PRIMARY KEY: `SHAREHOLDER_CODE` (股東代號，主鍵)
- UNIQUE INDEX: `UUID` (用於 QR Code URL 解析查詢)
- INDEX: `ID_NUMBER` (用於身份驗證查詢)

**Validation Rules**:

- `SHAREHOLDER_CODE`: 必須為 6 位數字，必填，唯一
- `ID_NUMBER`: 必須為 10 字元，符合台灣身分證字號格式，必填
- `BIRTH_DATE`: 必填，格式為 DATE（YYYY-MM-DD）
- `NAME`: 必填，最大長度 50 字元
- `UUID`: 必填，唯一，系統自動產生
- `ORIGINAL_ADDRESS`: 必填，最大長度 200 字元，支援繁體中文
- `ORIGINAL_HOME_PHONE`: 必填，最大長度 20 字元，符合台灣電話號碼格式（10 位數字）
- `ORIGINAL_MOBILE_PHONE`: 可選（約4成資料有），最大長度 20 字元，符合台灣手機號碼格式（10 位數字）
- `UPDATED_ADDRESS`: 可選，最大長度 200 字元，支援繁體中文
- `UPDATED_HOME_PHONE`: 可選，最大長度 20 字元，符合台灣電話號碼格式（10 位數字）
- `UPDATED_MOBILE_PHONE`: 可選，最大長度 20 字元，符合台灣手機號碼格式（10 位數字）
- `LOGIN_COUNT`: 必填，預設值為 0，記錄股東登入次數
- `UPDATE_COUNT`: 必填，預設值為 0，記錄股東資料修改次數

**State Transitions**:

- 建立：股東資料初次建立，系統自動產生 UUID
- 更新：更新地址或電話號碼（寫入 UPDATED\_\* 欄位）
- 查詢：透過股東代號、UUID 或身分證字號查詢

### 2. QR Code

代表股東個人專屬的 QR Code，用於快速進入資料更新頁面。

**Storage**: 不作為獨立實體儲存，QR Code 使用股東的 `UUID` 欄位作為 URL 識別碼。UUID 在股東資料建立時由系統自動產生並儲存於資料庫，確保唯一性和資料一致性。

**Attributes** (邏輯概念):

- `shareholder_code`: 對應的股東代號（6位數字）
- `uuid`: QR Code UUID（UNIQUEIDENTIFIER 格式）
- `qr_code_data`: QR Code 內容（通常為包含 UUID 的完整 URL）
- `qr_code_image`: QR Code 圖片（PNG Data URL 或檔案路徑）

**Generation**:

- QR Code UUID 產生規則：
  - 輸入：股東資料建立時
  - 產生：系統自動產生 UUID（使用 SQL Server NEWID() 函數或應用程式層 UUID 產生器）
  - 格式：標準 UUID 格式（例如：`550e8400-e29b-41d4-a716-446655440000`）
- QR Code 內容格式：完整 URL `{protocol}://{host}/shareholder/update/{uuid}`
- `uuid` 格式：標準 UUID（36 字元，包含連字號）
- 完整 URL 範例：`http://localhost:6230/shareholder/update/550e8400-e29b-41d4-a716-446655440000`
- 管理頁面輸入：只需輸入 6 位股東代號（例如：`123456`），系統會根據股東代號查詢資料庫中已儲存的 `UUID`
- 透過 `/api/shareholder/qrcode/[id]` API 產生 QR Code，當輸入 6 位股東代號時，API 會查詢資料庫取得對應的 `UUID`
- API 會自動從請求中取得 base URL（protocol + host）
- 如果 host 為 `0.0.0.0`，會自動替換為 `localhost` 以方便掃描

### 3. 股東操作記錄 (Shareholder Log)

記錄股東每次登入行為和資料修改操作的完整歷程。

**Table Name**: `testrachel_log` (測試環境) / `[待定]_log` (正式環境)

**Attributes**:

| 欄位名稱                   | 資料型別         | 約束                  | 說明                              |
| -------------------------- | ---------------- | --------------------- | --------------------------------- |
| `LOG_ID`                   | UNIQUEIDENTIFIER | PRIMARY KEY, DEFAULT NEWID() | 記錄 ID（UUID格式主鍵）           |
| `SHAREHOLDER_CODE`         | NVARCHAR(6)      | NOT NULL              | 股東代號（6位數字）               |
| `ID_NUMBER`                | NVARCHAR(10)     | NOT NULL              | 身分證字號（從testrachel表帶入）  |
| `SCAN_TIME`                | DATETIME         | NOT NULL, DEFAULT GETDATE() | 掃描進入頁面時間（股東掃描 QR Code 進入頁面的時間） |
| `LOGIN_TIME`               | DATETIME         | NOT NULL, DEFAULT GETDATE() | 驗證請求時間（驗證 API 被呼叫的時間） |
| `VERIFICATION_TYPE`        | NVARCHAR(10)     | NOT NULL              | 驗證類型：'phone' 或 'id'         |
| `PHONE_NUMBER_USED`        | NVARCHAR(20)     | NULL                  | 使用的手機號碼（僅手機驗證時）    |
| `PHONE_VERIFICATION_TIME`  | DATETIME         | NULL                  | 手機驗證完成時間（僅手機驗證成功時） |
| `RANDOM_CODE`              | NVARCHAR(4)      | NULL                  | 系統產生的原始驗證碼（4位數字，僅手機驗證時） |
| `HAS_UPDATED_DATA`         | BIT              | NOT NULL, DEFAULT 0   | 是否更新資料（0=否，1=是）        |
| `UPDATED_ADDRESS`          | NVARCHAR(200)    | NULL                  | 更新的地址（如有變更）            |
| `UPDATED_HOME_PHONE`       | NVARCHAR(20)     | NULL                  | 更新的住家電話（如有變更）       |
| `UPDATED_MOBILE_PHONE`     | NVARCHAR(20)     | NULL                  | 更新的手機電話（如有變更）        |

**Indexes**:

- PRIMARY KEY: `LOG_ID` (記錄 ID，UUID格式主鍵)
- INDEX: `IX_testrachel_log_SHAREHOLDER_CODE_ID_NUMBER` (股東代號和身分證字號複合索引)
- INDEX: `IX_testrachel_log_SHAREHOLDER_CODE` (股東代號，用於查詢特定股東的歷程)
- INDEX: `IX_testrachel_log_ID_NUMBER` (身分證字號，用於查詢特定股東的歷程)
- INDEX: `IX_testrachel_log_LOGIN_TIME` (驗證請求時間，用於時間範圍查詢)
- INDEX: `IX_testrachel_log_SCAN_TIME` (掃描進入頁面時間，用於時間範圍查詢)

**Validation Rules**:

- `LOG_ID`: 系統自動產生 UUID，必填，作為主鍵
- `SHAREHOLDER_CODE`: 必須為 6 位數字，必填，與 `ID_NUMBER` 組成複合索引
- `ID_NUMBER`: 必須為 10 字元，符合台灣身分證字號格式，必填，從 `testrachel` 表帶入，與 `SHAREHOLDER_CODE` 組成複合索引
- `SCAN_TIME`: 必填，記錄股東掃描 QR Code 進入頁面的時間（由系統自動填入，DEFAULT GETDATE()）
- `LOGIN_TIME`: 必填，記錄驗證 API 被呼叫的時間（由系統自動填入，DEFAULT GETDATE()）
- `VERIFICATION_TYPE`: 必填，必須為 'phone'（手機驗證）或 'id'（身分證末四碼）
- `PHONE_NUMBER_USED`: 當 `VERIFICATION_TYPE` 為 'phone' 時，記錄使用的手機號碼；否則為 NULL
- `PHONE_VERIFICATION_TIME`: 當 `VERIFICATION_TYPE` 為 'phone' 且驗證成功時，記錄手機驗證完成的時間；否則為 NULL
- `RANDOM_CODE`: 當 `VERIFICATION_TYPE` 為 'phone' 時，記錄系統產生的原始驗證碼（4位數字）；否則為 NULL
- `HAS_UPDATED_DATA`: 必填，記錄本次登入是否有更新資料（0=否，1=是）
- `UPDATED_ADDRESS`: 可選，僅當有更新地址時記錄新值
- `UPDATED_HOME_PHONE`: 可選，僅當有更新住家電話時記錄新值
- `UPDATED_MOBILE_PHONE`: 可選，僅當有更新手機電話時記錄新值

**State Transitions**:

- 掃描記錄建立：每次股東掃描 QR Code 進入頁面並進行驗證時（不論成功或失敗），自動建立一筆記錄，記錄 `SCAN_TIME`（掃描進入頁面時間）
- 驗證記錄建立：當驗證 API 被呼叫時，記錄 `LOGIN_TIME`（驗證請求時間）。驗證成功或失敗都會建立 log 記錄
- 資料更新記錄：當股東點擊「資料確認」且有變更資料時，更新該筆登入記錄的 `HAS_UPDATED_DATA` 和相關更新欄位

**Relationship**:

- 多對一關係：`testrachel_log.SHAREHOLDER_CODE` → `testrachel.SHAREHOLDER_CODE`
- 一個股東可以有多筆操作記錄（歷程記錄）

## Relationships

### Shareholder ↔ QR Code

- **Type**: One-to-One
- **Description**: 每個股東對應一個 QR Code
- **Implementation**: 透過 `Shareholder.UUID` 欄位關聯

## Data Flow

### 1. QR Code 掃描流程

```
QR Code (包含 UUID)
    ↓
解析 UUID
    ↓
查詢 Shareholder 資料表 (WHERE UUID = uuid)
    ↓
返回股東基本資訊（不含敏感資料）
```

### 2. 身份驗證流程

```
QR Code 解析出 UUID
    ↓
查詢 Shareholder 資料表 (WHERE UUID = uuid)
    ↓
用戶輸入驗證碼（手機驗證碼或身分證末四碼）
    ↓
比對 QR Code 對應的股東資料與輸入的驗證碼
    ↓
驗證成功 → 
  1. 更新 testrachel.LOGIN_COUNT = LOGIN_COUNT + 1
  2. 在 testrachel_log 建立登入記錄：
     - 記錄ID（UUID，系統自動產生）
     - 記錄股東代號（SHAREHOLDER_CODE）
     - 記錄身分證字號（ID_NUMBER，從testrachel表帶入）
     - 記錄掃描進入頁面時間（SCAN_TIME，由系統自動填入）
     - 記錄驗證請求時間（LOGIN_TIME，由系統自動填入）
     - 記錄驗證類型（手機驗證或身分證驗證）
     - 記錄使用的手機號碼（僅手機驗證時）
     - 記錄手機驗證完成時間（僅手機驗證成功時）
     - 記錄系統產生的原始驗證碼（RANDOM_CODE，僅手機驗證時）
     - HAS_UPDATED_DATA = 0（初始值）
  → 返回完整股東資料
驗證失敗 → 
  1. 在 testrachel_log 建立登入記錄（記錄失敗的驗證嘗試）：
     - 記錄ID（UUID，系統自動產生）
     - 記錄股東代號（SHAREHOLDER_CODE）
     - 記錄身分證字號（ID_NUMBER，從testrachel表帶入）
     - 記錄掃描進入頁面時間（SCAN_TIME，由系統自動填入）
     - 記錄驗證請求時間（LOGIN_TIME，由系統自動填入）
     - 記錄驗證類型（手機驗證或身分證驗證）
     - 記錄使用的手機號碼（僅手機驗證時，可能為 NULL）
     - PHONE_VERIFICATION_TIME = NULL（驗證失敗時不記錄完成時間）
     - 記錄系統產生的原始驗證碼（RANDOM_CODE，僅手機驗證時，可能為 NULL）
     - HAS_UPDATED_DATA = 0（驗證失敗時不更新資料）
  2. 返回錯誤訊息
```

### 3. 資料更新流程

```
用戶點擊「資料確認」按鈕
    ↓
計算預設值（對每個欄位）：
  - 如果 UPDATED_* 有值 → 預設值 = UPDATED_*
  - 如果 UPDATED_* 沒有值 → 預設值 = ORIGINAL_*
    ↓
比較前端傳送值與預設值（對每個欄位）：
  - 如果 前端值 ≠ 預設值 → 覆蓋 UPDATED_* = 前端值
  - 如果 前端值 = 預設值 → UPDATED_* 保持不變
    ↓
立即跳轉到感謝頁面
    ↓
背景異步處理：
  1. 更新 testrachel 資料表：
     - 更新有變更的 UPDATED_* 欄位（如果有）
     - UPDATE_COUNT = UPDATE_COUNT + 1（總是執行）
     - UPDATED_AT = GETDATE()
     - ORIGINAL_* 欄位永遠不變
  2. 更新 testrachel_log 資料表（更新該次登入的記錄）：
     - HAS_UPDATED_DATA = 1（如果有任何欄位變更）
     - 記錄各欄位的新值（僅記錄有變更的欄位）：
       * UPDATED_ADDRESS（如果地址有變更）
       * UPDATED_HOME_PHONE（如果住家電話有變更）
       * UPDATED_MOBILE_PHONE（如果手機電話有變更）
```

## Database Schema (SQL)

```sql
-- 測試環境資料表
CREATE TABLE testrachel (
    SHAREHOLDER_CODE NVARCHAR(6) PRIMARY KEY,       -- 股東代號（6位數字，主鍵）
    ID_NUMBER NVARCHAR(10) NOT NULL,                -- 身分證字號
    BIRTH_DATE DATE NOT NULL,                       -- 出生年月日
    NAME NVARCHAR(50) NOT NULL,                      -- 姓名
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

-- 建立索引
CREATE UNIQUE INDEX IX_testrachel_UUID ON testrachel(UUID)
CREATE INDEX IX_testrachel_ID_NUMBER ON testrachel(ID_NUMBER)

-- 股東操作記錄表（測試環境）
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

-- 正式環境資料表（結構相同，表名待定）
-- CREATE TABLE [正式表名] (...)
-- CREATE TABLE [正式表名]_log (...)

## Data Validation Rules

### 前端驗證

1. **股東代號**:

   - 必填
   - 長度：6 位數字
   - 格式：純數字

2. **身分證字號**:

   - 必填
   - 長度：10 字元
   - 格式：1 個英文字母 + 9 個數字

3. **出生年月日**:

   - 必填
   - 格式：YYYY-MM-DD

4. **原地址**:

   - 必填
   - 最大長度：200 字元
   - 支援繁體中文、數字、標點符號

5. **原住家電話**:

   - 必填
   - 格式：10 位數字（可包含區碼分隔符號）
   - 僅允許數字和連字號（-）

6. **原手機電話**:

   - 可選
   - 格式：10 位數字
   - 僅允許數字

7. **更新地址**:

   - 可選
   - 最大長度：200 字元
   - 支援繁體中文、數字、標點符號

8. **更新住家電話**:

   - 可選
   - 格式：10 位數字（可包含區碼分隔符號）
   - 僅允許數字和連字號（-）

9. **更新手機電話**:
   - 可選
   - 格式：10 位數字
   - 僅允許數字

### 後端驗證

- 所有前端驗證規則在後端重複驗證
- 額外檢查：股東代號唯一性、UUID 唯一性
- SQL 注入防護：使用參數化查詢

## Sample Data

```sql
-- 測試資料（10 筆）
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
```

## Migration Considerations

### 測試環境 → 正式環境

1. 資料表結構相同，僅表名不同
2. 透過環境變數切換資料表名稱
3. 正式環境資料需要從現有系統遷移或手動匯入

### 未來擴展

1. **修改歷史記錄**: 可新增 `shareholder_update_history` 資料表
2. **QR Code 過期機制**: 可在 `Shareholder` 表新增 `qr_code_expires_at` 欄位
3. **身份驗證記錄**: 可新增 `authentication_log` 資料表記錄驗證嘗試
