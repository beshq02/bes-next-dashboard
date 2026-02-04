# API Contracts: 股東資料更新功能

**Date**: 2025-12-18  
**Feature**: 股東資料更新功能  
**Base URL**: `/api/shareholder`

## Overview

本文件定義股東資料更新功能的所有 API 端點，遵循 RESTful 設計原則，使用 JSON 格式進行資料交換。

## Common Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "錯誤訊息（繁體中文）"
  }
}
```

## API Endpoints

### 1. 產生 QR Code

**Endpoint**: `GET /api/shareholder/qrcode/[id]`

**Description**: 為指定股東產生 QR Code 圖片

**Path Parameters**:

- `id` (string, required): 股東識別碼（格式：6位股東代號或7位驗證碼）
  - 如果輸入6位數字（股東代號），系統會根據股東代號查詢資料庫中已儲存的 `verification_code`（7位數字：6位股東代號+1位檢查碼）作為 QR Code URL
  - 如果輸入7位數字（完整驗證碼），系統直接使用該驗證碼查詢對應的股東資料

**Query Parameters**: 無

**Request Body**: 無

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "qrCodeDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "shareholderCode": "123456",
    "qrCodeUrl": "http://localhost:6230/shareholder/update/1234567",
    "relativeUrl": "/shareholder/update/1234567"
  }
}
```

**Response Fields**:

- `qrCodeDataUrl` (string): QR Code 圖片的 Data URL（Base64 編碼的 PNG 圖片）
- `shareholderCode` (string): 股東代號（6位數字）
- `qrCodeUrl` (string): QR Code 中包含的完整 URL，可直接用於掃描和訪問
- `relativeUrl` (string): 相對路徑，供參考使用

**Notes**:

- QR Code 內容為完整 URL（`qrCodeUrl`），而非相對路徑，確保從紙本掃描時可以正確開啟
- 如果伺服器 host 為 `0.0.0.0`，會自動替換為 `localhost` 以方便掃描
- QR Code URL 格式：`{protocol}://{host}/shareholder/update/{shareholder_identifier}`

**Error Responses**:

- `404 Not Found`: 股東不存在
- `500 Internal Server Error`: QR Code 產生失敗

**Example**:

```bash
GET /api/shareholder/qrcode/1234567
```

**QR Code 識別碼格式說明**：

- 格式：6 位股東代號 + 1 位檢查碼（共 7 位數字）
- 檢查碼計算規則：將股東代號的各位數字相加，取模10得到檢查碼
- 範例：股東代號 `123456` → (1+2+3+4+5+6) % 10 = 1 → 驗證碼：`1234561`
- 驗證碼在股東資料建立時就計算並儲存於資料庫的 `verification_code` 欄位中

---

### 2. QR Code 有效性檢查（新流程：先檢查 QR Code，再進行身份驗證）

**Endpoint**: `GET /api/shareholder/qr-check/[id]`

**Description**: 檢查 QR Code 驗證碼是否存在且有效。此 API 用於股東掃描 QR Code 進入頁面時的**第一階段檢查**，在顯示身份驗證彈窗之前先過濾掉無效或已過期的 QR Code。

**Path Parameters**:

- `id` (string, required): QR Code 驗證碼（7 位數字：6 位股東代號+1 位檢查碼）

**Query Parameters**: 無

**Request Body**: 無

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "shareholderCode": "123456",
    "name": "王小明",
    "address": "台北市信義區信義路五段7號",
    "phone": "0912345678",
    "verificationCode": "1234561"
  }
}
```

**Error Responses**:

- `404 Not Found`: QR Code 驗證碼對應的股東不存在，或驗證碼不一致（無效或已過期）
- `400 Bad Request`: 請求參數錯誤（例如格式非 7 位數字）
- `500 Internal Server Error`: 伺服器錯誤

**Notes**:

- 此 API **僅負責檢查 QR Code 是否存在且有效**，不負責身分證末四碼驗證
- 前端在呼叫此 API 並確認成功後，才會顯示「身分證末四碼」身份驗證彈窗並再呼叫身份驗證 API

---

### 3. 發送手機驗證碼

**Endpoint**: `POST /api/shareholder/send-verification-code`

**Description**: 發送手機驗證碼至股東的手機號碼。此 API 在 QR Code 有效性檢查通過後，如果股東資料中有手機號碼，則呼叫此 API 發送驗證碼。

**Path Parameters**: 無

**Query Parameters**: 無

**Request Body**:

```json
{
  "qrCodeIdentifier": "550e8400-e29b-41d4-a716-446655440000",
  "phoneNumber": "0912345678"
}
```

**Request Body Schema**:

- `qrCodeIdentifier` (string, required): QR Code 識別碼（UUID 格式或 7 位數字驗證碼）
- `phoneNumber` (string, required): 手機號碼（10 位數字，例如：`0912345678`）
- `scanLogId` (string, optional): 掃描時建立的 log ID（UUID 格式），如果提供則更新現有記錄，否則建立新記錄

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "verificationCode": "123456",
    "expiresAt": "2024-12-25T14:10:00Z",
    "message": "驗證碼已發送至您的手機"
  }
}
```

**Response Fields**:

- `verificationCode` (string): 4 位數字驗證碼（僅在開發環境返回，生產環境不返回）
- `expiresAt` (string): 驗證碼過期時間（ISO 8601 格式）
- `message` (string): 成功訊息

**Error Responses**:

- `400 Bad Request`: 請求參數錯誤（缺少必填欄位、格式錯誤）
- `404 Not Found`: QR Code 識別碼對應的股東不存在
- `429 Too Many Requests`: 重新發送間隔未達 1 分鐘，需等待後再次發送（錯誤訊息顯示剩餘秒數）
- `500 Internal Server Error`: 簡訊發送失敗或伺服器錯誤

**Notes**:

- 驗證碼有效期為 1 分鐘
- 驗證碼重新發送間隔為 1 分鐘（同一手機號碼在發送驗證碼後，必須等待 1 分鐘才能再次發送）
- 前端必須在輸入驗證碼介面顯示倒數計時器（顯示剩餘秒數），當驗證碼過期（倒數至 0）時，自動跳回原介面（顯示手機號碼與操作按鈕），允許用戶重新發送驗證碼
- 驗證碼為 4 位隨機數字
- 簡訊發送功能實作於 Node.js 模組（例如 `src/lib/sms.js`），由 `/api/shareholder/send-verification-code` 路由呼叫並直接連線至簡訊服務商 HTTP API（e8d.tw），不再依賴外部 Python 腳本
- 驗證碼應儲存在伺服器端（建議使用 Redis 或資料庫暫存），並在驗證時檢查是否過期
- 手機號碼選擇邏輯：優先使用最新修改的手機號碼（`UPDATED_MOBILE_PHONE`），如果為空則使用原始手機號碼（`ORIGINAL_MOBILE_PHONE`）
- **資料庫記錄**：系統必須在發送驗證碼時，在 `testrachel_log` 中建立或更新記錄，設定 `ACTION_TYPE = 'verify'`，並同步更新以下欄位：`PHONE_NUMBER_USED`（使用的手機號碼）、`RANDOM_CODE`（系統產生的原始驗證碼）、`VERIFICATION_TYPE = 'phone'`、`ACTION_TIME`（行為時間）。如果提供了 `scanLogId`，則更新現有記錄；否則建立新記錄

**Example**:

```bash
POST /api/shareholder/send-verification-code
Content-Type: application/json

{
  "qrCodeIdentifier": "550e8400-e29b-41d4-a716-446655440000",
  "phoneNumber": "0912345678"
}
```

---

### 4. 身份驗證

**Endpoint**: `POST /api/shareholder/verify`

**Description**: 驗證股東身份。此 API 支援兩種驗證方式：
- **手機驗證碼驗證**：當股東資料中有手機號碼時使用
- **身分證末四碼驗證**：當股東資料中沒有手機號碼時使用

此 API 假設前端已透過 `GET /api/shareholder/qr-check/[id]` 檢查過 QR Code 有效性，並用來進行第二階段的身份核對。

**Path Parameters**: 無

**Query Parameters**: 無

**Request Body**:

**手機驗證碼模式**:
```json
{
  "qrCodeIdentifier": "550e8400-e29b-41d4-a716-446655440000",
  "verificationType": "phone",
  "verificationCode": "1234"
}
```

**身分證末四碼模式**:
```json
{
  "qrCodeIdentifier": "550e8400-e29b-41d4-a716-446655440000",
  "verificationType": "id",
  "idLastFour": "6789"
}
```

**Request Body Schema**:

- `qrCodeIdentifier` (string, required): QR Code 識別碼（UUID 格式或 7 位數字驗證碼）
- `verificationType` (string, required): 驗證類型，必須為 `"phone"` 或 `"id"`
- `verificationCode` (string, conditional): 手機驗證碼（4 位數字），當 `verificationType` 為 `"phone"` 時必填
- `idLastFour` (string, conditional): 身分證末四碼（4 位數字），當 `verificationType` 為 `"id"` 時必填

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "shareholderCode": "123456",
    "idNumber": "A123456789",
    "name": "王小明",
    "address": "台北市信義區信義路五段7號",
    "phone": "0912345678",
    "verified": true,
    "logId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Response Fields**:
- `logId` (string, UUID format): 此次登入記錄的 ID（UUID 格式），供後續更新日誌時使用

**Error Responses**:

- `400 Bad Request`: 請求參數錯誤（缺少必填欄位、格式錯誤、驗證類型不支援）
- `401 Unauthorized`: 身份驗證失敗（驗證碼錯誤、驗證碼過期、身分證末四碼不符）
- `404 Not Found`: QR Code 識別碼對應的股東不存在
- `500 Internal Server Error`: 伺服器錯誤

**Example**:

**手機驗證碼模式**:
```bash
POST /api/shareholder/verify
Content-Type: application/json

{
  "qrCodeIdentifier": "550e8400-e29b-41d4-a716-446655440000",
  "verificationType": "phone",
  "verificationCode": "1234"
}
```

**身分證末四碼模式**:
```bash
POST /api/shareholder/verify
Content-Type: application/json

{
  "qrCodeIdentifier": "550e8400-e29b-41d4-a716-446655440000",
  "verificationType": "id",
  "idLastFour": "6789"
}
```

**錯誤回應說明**：

- 格式錯誤：驗證碼格式不符合規範（手機驗證碼非 4 位數字，或身分證末四碼非 4 位數字）
- QR Code 不符：顯示「請掃描信件上的 QR Code」錯誤資訊
- 驗證碼錯誤或過期：顯示「請確認驗證碼」或「驗證碼已過期，請重新發送驗證碼」錯誤資訊
- 身分證末四碼不存在或打錯：重點顯示「請確認身分證末四碼」錯誤資訊，並用提示方式簡單顯示「請聯絡我們」的資訊
- 所有錯誤資訊都在原本輸入驗證碼的彈窗內顯示，不導向新頁面，以利重新輸入

---

### 5. 查詢股東資料

**Endpoint**: `GET /api/shareholder/data/[id]`

**Description**: 查詢指定股東的資料（需先通過身份驗證）

**Path Parameters**:

- `id` (string, required): 股東代號（6位數字）或股東識別碼

**Query Parameters**: 無

**Request Body**: 無

**Headers**:

- `Authorization` (optional): 身份驗證 token（未來擴展）

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "shareholderCode": "123456",
    "idNumber": "A123456789",
    "name": "王小明",
    "address": "台北市信義區信義路五段7號",
    "phone": "0912345678",
    "verificationCode": "1234561",
    "createdAt": "2025-12-18T10:00:00Z",
    "updatedAt": "2025-12-18T10:00:00Z"
  }
}
```

**Error Responses**:

- `401 Unauthorized`: 未通過身份驗證
- `404 Not Found`: 股東不存在
- `500 Internal Server Error`: 伺服器錯誤

**Example**:

```bash
GET /api/shareholder/data/123456
```

---

### 6. 更新股東資料

**Endpoint**: `PUT /api/shareholder/data/[id]`

**Description**: 更新股東的地址和電話號碼

**Path Parameters**:

- `id` (string, required): 股東代號（6位數字）

**Query Parameters**: 無

**Request Body**:

```json
{
  "address": "台北市信義區信義路五段8號",
  "phone": "0912345679"
}
```

**注意**：API 支援部分更新，可以只提供要更新的欄位：

- 只更新地址：`{ "address": "新地址" }`
- 只更新電話：`{ "phone": "0912345679" }`
- 同時更新：`{ "address": "新地址", "phone": "0912345679" }`

**Request Body Schema**:

- `address` (string, optional): 新地址（最大 200 字元）。如果提供，則更新地址欄位
- `phone` (string, optional): 新電話號碼（最大 20 字元，10 位數字）。如果提供，則更新電話號碼欄位
- 至少需要提供一個欄位（`address` 或 `phone`）

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "shareholderCode": "123456",
    "idNumber": "A123456789",
    "name": "王小明",
    "address": "台北市信義區信義路五段8號",
    "phone": "0912345679",
    "updatedAt": "2025-12-18T11:00:00Z"
  },
  "message": "資料更新成功"
}
```

**Error Responses**:

- `400 Bad Request`: 請求參數錯誤（缺少必填欄位、格式錯誤）
- `401 Unauthorized`: 未通過身份驗證
- `404 Not Found`: 股東不存在
- `500 Internal Server Error`: 伺服器錯誤或資料庫更新失敗

**Example**:

```bash
PUT /api/shareholder/data/123456
Content-Type: application/json

{
  "address": "台北市信義區信義路五段8號",
  "phone": "0912345679"
}
```

---

### 7. 查詢股東列表

**Endpoint**: `GET /api/shareholder/list`

**Description**: 查詢所有股東資料列表（用於管理頁面顯示）

**Path Parameters**: 無

**Query Parameters**: 無

**Request Body**: 無

**Response** (200 OK):

```json
{
  "success": true,
  "data": [
    {
      "shareholderCode": "123456",
      "idNumber": "A123456789",
      "name": "王小明",
      "verificationCode": "1234561"
    },
    {
      "shareholderCode": "234567",
      "idNumber": "B234567890",
      "name": "陳美麗",
      "verificationCode": "2345678"
    }
  ]
}
```

**Response Fields**:

- `data` (array): 股東資料陣列
  - `shareholderCode` (string): 股東代號（6位數字，主鍵）
  - `idNumber` (string): 身分證字號
  - `name` (string): 姓名
  - `verificationCode` (string): QR Code 驗證碼（7位數字：6位股東代號+1位檢查碼）

**Error Responses**:

- `500 Internal Server Error`: 伺服器錯誤或資料庫查詢失敗

**Example**:

```bash
GET /api/shareholder/list
```

**Notes**:

- 此 API 用於管理頁面載入股東列表
- 返回所有股東的基本資料（不包含地址、電話等敏感資訊）
- 資料從資料庫 `[STAGE].[dbo].[testrachel]` 資料表查詢
- 管理頁面目前暫定為完全公開存取，無需身份驗證（未來可能會調整為需要基本身份驗證）

---

## Error Codes

| Code                        | HTTP Status | Description          |
| --------------------------- | ----------- | -------------------- |
| `MISSING_REQUIRED_FIELD`    | 400         | 缺少必填欄位         |
| `INVALID_FORMAT`            | 400         | 資料格式錯誤         |
| `AUTHENTICATION_FAILED`     | 401         | 身份驗證失敗         |
| `SHAREHOLDER_NOT_FOUND`     | 404         | 股東不存在           |
| `QR_CODE_INVALID`           | 404         | QR Code 無效或已過期 |
| `DATABASE_ERROR`            | 500         | 資料庫錯誤           |
| `QR_CODE_GENERATION_FAILED` | 500         | QR Code 產生失敗     |
| `INTERNAL_SERVER_ERROR`     | 500         | 伺服器內部錯誤       |

## Validation Rules

### 身分證字號 (idNumber)

- 必填
- 長度：10 字元
- 格式：1 個英文字母 + 9 個數字
- 範例：`A123456789`

### 地址 (address)

- 必填
- 最大長度：200 字元
- 支援繁體中文、數字、標點符號
- 範例：`台北市信義區信義路五段7號`

### 電話號碼 (phone)

- 必填
- 最大長度：20 字元
- 格式：10 位數字（可包含連字號分隔）
- 範例：`0912345678` 或 `09-1234-5678`

## Security Considerations

1. **身份驗證**: 所有資料查詢和更新操作都需要先通過身份驗證
2. **參數驗證**: 所有輸入參數都需要在伺服器端驗證
3. **SQL 注入防護**: 使用參數化查詢
4. **錯誤訊息**: 不洩露系統內部資訊（如資料庫結構、SQL 錯誤詳情）

## Rate Limiting

目前無速率限制，但建議未來實作：

- 身份驗證 API: 每 IP 每分鐘最多 10 次請求
- 資料更新 API: 每用戶每分鐘最多 5 次請求

## Future Extensions

1. **修改歷史查詢**: `GET /api/shareholder/data/[shareholderCode]/history`
2. **QR Code 過期檢查**: 在驗證 API 中加入過期檢查邏輯
3. **分頁查詢**: `GET /api/shareholder/list?page=1&limit=10` - 為股東列表 API 添加分頁功能
