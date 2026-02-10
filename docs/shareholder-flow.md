# 股東資料更新系統 — 專案流程文件

> 中華工程股份有限公司 114 年 ESG 利害關係人問卷
> 技術框架：Next.js (App Router) + MUI + MSSQL (STAGE 資料庫)

---

## 目錄

1. [系統概述](#1-系統概述)
2. [完整使用者流程](#2-完整使用者流程)
3. [API 端點一覽](#3-api-端點一覽)
4. [前端元件說明](#4-前端元件說明)
5. [資料庫結構](#5-資料庫結構)
6. [驗證與安全機制](#6-驗證與安全機制)
7. [簡訊服務](#7-簡訊服務)
8. [環境變數與測試模式](#8-環境變數與測試模式)
9. [後台管理頁面](#9-後台管理頁面)

---

## 1. 系統概述

本系統讓股東透過掃描紙本信件上的 QR Code，完成身份驗證後更新通訊地址與電話資料，並引導填寫 ESG 問卷。

**核心流程**：掃描 QR Code → 身份驗證 → 修改資料 → 提交 → 感謝頁面 → ESG 問卷

---

## 2. 完整使用者流程

### 流程圖

```
┌─────────────────────────────────────────────────────────────────┐
│  股東掃描信件上的 QR Code                                         │
│  URL: /shareholder/update/{UUID}                                │
└──────────────────────┬──────────────────────────────────────────┘
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│  階段一：QR Code 有效性檢查                                        │
│  API: GET /api/shareholder/qr-check/{UUID}                      │
│  ├─ 驗證 UUID 格式                                                │
│  ├─ 查詢 SHAREHOLDER 表確認股東是否存在                              │
│  ├─ 建立 SHAREHOLDER_LOG 記錄（ACTION_TYPE = 'visit'）             │
│  └─ 回傳：股東基本資訊、是否有手機號碼、scanLogId                      │
└──────────────────────┬──────────────────────────────────────────┘
                       ▼
              ┌────────┴────────┐
              │  有手機號碼？     │
              └───┬─────────┬───┘
              有  │         │ 無
                  ▼         ▼
    ┌──────────────┐  ┌──────────────┐
    │ 手機驗證碼模式  │  │ 身分證末四碼   │
    │ (預設)        │  │ 驗證模式      │
    └──────┬───────┘  └──────┬───────┘
           │                 │
           ▼                 │
┌─────────────────────┐      │
│ 顯示兩個按鈕：         │      │
│ [獲取驗證碼]           │      │
│ [改用身分證驗證] ──────────────┤
└──────┬──────────────┘      │
       │ 點擊「獲取驗證碼」      │
       ▼                     │
┌──────────────────────────┐ │
│ 階段二-A：發送手機驗證碼     │ │
│ API: POST /api/shareholder│ │
│      /send-verification-  │ │
│      code                 │ │
│ ├─ 驗證手機號碼與股東資料    │ │
│ ├─ 檢查 60 秒冷卻時間      │ │
│ ├─ 產生 4 位數字驗證碼      │ │
│ ├─ 發送簡訊（正式模式）     │ │
│ ├─ 寫入 SHAREHOLDER_LOG   │ │
│ └─ 驗證碼有效期：1 分鐘     │ │
└──────┬───────────────────┘ │
       ▼                     │
┌──────────────────────────┐ │
│ 使用者輸入 4 碼驗證碼       │ │
│ （輸入滿 4 碼自動送出）     │ │
│ 畫面顯示倒數計時            │ │
└──────┬───────────────────┘ │
       ▼                     ▼
┌──────────────────────────────────────┐
│ 階段二-B：身份驗證                      │
│ API: POST /api/shareholder/verify    │
│ ├─ 手機模式：比對 SHAREHOLDER_LOG      │
│ │   中的 RANDOM_CODE，檢查是否過期     │
│ ├─ 身分證模式：比對 SHAREHOLDER        │
│ │   中的 ID_LAST_FOUR                │
│ ├─ 驗證成功：LOGIN_COUNT + 1          │
│ └─ 回傳：shareholderCode、logId       │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│ 播放成功動畫（Lottie）                  │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│ 階段三：載入股東完整資料                  │
│ API: GET /api/shareholder/data/{code}│
│ └─ 回傳所有 ORIGINAL_* 與 UPDATED_*  │
│    欄位供表單初始化                     │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│ 階段四：顯示資料修改表單（DataForm）       │
│ ├─ 歡迎訊息（姓名 + 身分證遮罩）         │
│ ├─ 可編輯欄位：                         │
│ │   ├─ 縣市 / 鄉鎮區 / 郵遞區號（連動） │
│ │   ├─ 地址（必填）                     │
│ │   ├─ 住家電話 1（必填）               │
│ │   ├─ 手機號碼 1（必填，09 開頭 10 碼）│
│ │   ├─ 住家電話 2（選填）               │
│ │   └─ 手機號碼 2（選填）               │
│ └─ 初始值邏輯：                         │
│     UPDATED_* 有值 → 用 UPDATED_*     │
│     否則 → 用 ORIGINAL_*              │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│ 使用者點擊「確認資料」                    │
│ ├─ 前端立即跳轉至感謝頁面               │
│ └─ 背景非同步呼叫更新 API               │
└──────────────────┬───────────────────┘
                   ▼
┌──────────────────────────────────────┐
│ 階段五：資料更新（背景執行）              │
│ API: PUT /api/shareholder/data/{code}│
│ ├─ 逐欄比對：使用者輸入 vs 預設值       │
│ ├─ 有變更 → 更新 UPDATED_* 欄位       │
│ ├─ UPDATE_COUNT + 1                  │
│ └─ 更新 SHAREHOLDER_LOG 快照          │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 感謝頁面                               │
│ /shareholder/update/{UUID}/thank-you │
│ ├─ 「資料更新成功」提示                  │
│ ├─ ESG 問卷邀請（Google 表單連結）      │
│ └─ 7-ELEVEN 100 元商品券說明            │
└──────────────────────────────────────┘
```

---

## 3. API 端點一覽

### 3.1 QR Code 有效性檢查

| 項目 | 說明 |
|------|------|
| **端點** | `GET /api/shareholder/qr-check/[id]` |
| **檔案** | `src/app/api/shareholder/qr-check/[id]/route.js` |
| **參數** | `id` — 股東 UUID |
| **功能** | 1. 驗證 UUID 格式<br>2. 查詢 SHAREHOLDER 表<br>3. 決定驗證方式（手機 / 身分證）<br>4. 建立 SHAREHOLDER_LOG 訪問記錄 |
| **回應** | `{ shareholderCode, name, phoneNumber, hasPhoneNumber, uuid, scanLogId }` |
| **錯誤** | `400` 格式錯誤、`404` 股東不存在 |

### 3.2 發送手機驗證碼

| 項目 | 說明 |
|------|------|
| **端點** | `POST /api/shareholder/send-verification-code` |
| **檔案** | `src/app/api/shareholder/send-verification-code/route.js` |
| **參數** | `{ qrCodeIdentifier, phoneNumber, scanLogId }` |
| **功能** | 1. 驗證手機號碼與股東資料一致<br>2. 檢查 60 秒重送冷卻時間<br>3. 產生 4 位隨機數字驗證碼<br>4. 發送簡訊（正式模式）或記錄 log（測試模式）<br>5. 寫入 SHAREHOLDER_LOG（RANDOM_CODE） |
| **回應** | `{ expiresAt, message }` ；測試模式額外回傳 `verificationCode` |
| **錯誤** | `401` 手機號碼不符、`429` 冷卻時間內重送、`404` 股東不存在 |

### 3.3 身份驗證

| 項目 | 說明 |
|------|------|
| **端點** | `POST /api/shareholder/verify` |
| **檔案** | `src/app/api/shareholder/verify/route.js` |
| **參數（手機模式）** | `{ qrCodeIdentifier, verificationType: 'phone', verificationCode, phoneNumber, scanLogId }` |
| **參數（身分證模式）** | `{ qrCodeIdentifier, verificationType: 'id', idLastFour, scanLogId }` |
| **功能** | 1. 查詢股東資料<br>2. 手機模式：從 SHAREHOLDER_LOG 取出 RANDOM_CODE 比對，檢查 1 分鐘有效期<br>3. 身分證模式：比對 SHAREHOLDER.ID_LAST_FOUR<br>4. 成功：LOGIN_COUNT + 1，記錄 PHONE_VERIFICATION_TIME |
| **回應** | `{ shareholderCode, uuid, name, address, phone, verified: true, logId }` |
| **錯誤** | `401` 驗證碼錯誤 / 已過期 / 不存在、`404` 股東不存在 |

### 3.4 查詢股東資料

| 項目 | 說明 |
|------|------|
| **端點** | `GET /api/shareholder/data/[id]` |
| **檔案** | `src/app/api/shareholder/data/[id]/route.js` |
| **參數** | `id` — 股東代號（1-6 位數字，即 SORT 欄位） |
| **功能** | 查詢股東完整資料，包含 ORIGINAL_* 與 UPDATED_* 所有欄位 |
| **回應** | 完整股東資料物件（地址、電話、登入次數、更新次數等） |
| **錯誤** | `400` 格式錯誤、`404` 股東不存在 |

### 3.5 更新股東資料

| 項目 | 說明 |
|------|------|
| **端點** | `PUT /api/shareholder/data/[id]` |
| **檔案** | `src/app/api/shareholder/data/[id]/route.js` |
| **參數** | `{ updatedCity, updatedDistrict, updatedAddress, updatedPostalCode, updatedHomePhone1, updatedHomePhone2, updatedMobilePhone1, updatedMobilePhone2, logId }` |
| **功能** | 1. 查詢現有資料，計算每個欄位的預設值<br>2. 逐欄比對：前端提交值 vs 預設值<br>3. 有變更 → 更新 UPDATED_* 欄位<br>4. UPDATE_COUNT + 1（無論是否有變更）<br>5. 更新 SHAREHOLDER_LOG（HAS_UPDATED_DATA、各欄位快照） |
| **回應** | `{ shareholderCode, message: '資料更新成功' }` |
| **錯誤** | `400` 無欄位、`404` 股東不存在 |

### 3.6 QR Code 產生

| 項目 | 說明 |
|------|------|
| **端點** | `GET /api/shareholder/qrcode/[id]` |
| **功能** | 根據股東代號或 UUID 產生 QR Code 圖片（base64 DataURL） |

### 3.7 批次產生 QR Code

| 項目 | 說明 |
|------|------|
| **端點** | `POST /api/shareholder/qrcode/batch` |
| **參數** | `{ shareholderCodes: string[] }` |
| **功能** | 批次查詢股東資料並產生 QR Code，供後台管理頁面與匯出使用 |

### 3.8 股東清單

| 項目 | 說明 |
|------|------|
| **端點** | `GET /api/shareholder/list` |
| **功能** | 查詢所有股東基本資料，供後台管理頁面顯示 |

---

## 4. 前端元件說明

### 4.1 頁面結構

| 路徑 | 檔案 | 說明 |
|------|------|------|
| `/shareholder/update/[qrCode]` | `src/app/shareholder/update/[qrCode]/page.jsx` | 主頁面：負責 QR Code 檢查、顯示驗證對話框、驗證後顯示資料表單 |
| `/shareholder/update/[qrCode]/thank-you` | `src/app/shareholder/update/[qrCode]/thank-you/page.jsx` | 感謝頁面：顯示成功訊息與 ESG 問卷連結 |
| `/shareholder/qrcode-batch` | — | 後台管理：股東列表、QR Code 批次產生 |

### 4.2 元件說明

#### AuthDialog（身份驗證對話框）

- **檔案**：`src/components/shareholder/AuthDialog.jsx`
- **類型**：全螢幕 MUI Dialog
- **Props**：

| Prop | 類型 | 說明 |
|------|------|------|
| `open` | boolean | 是否顯示對話框 |
| `qrCodeIdentifier` | string | 股東 UUID |
| `hasPhoneNumber` | boolean | 決定預設驗證模式 |
| `phoneNumber` | string | 遮罩顯示用手機號碼 |
| `scanLogId` | string | qr-check 建立的 log ID |
| `onSuccess` | function | 驗證成功回呼 |
| `onError` | function | 驗證失敗回呼 |

- **功能**：
  - 手機號碼遮罩顯示（如 `0912***678`）
  - 驗證碼 4 碼 OTP 輸入，滿 4 碼自動送出
  - 60 秒倒數計時，到期自動回到發送畫面
  - 錯誤時搖晃動畫 + 自動清空輸入
  - 驗證成功後播放 Lottie 動畫
  - 測試模式下畫面上直接顯示驗證碼
  - 可切換至身分證驗證模式

#### DataForm（資料修改表單）

- **檔案**：`src/components/shareholder/DataForm.jsx`
- **Props**：`shareholderData`、`qrCode`、`logId`
- **功能**：
  - 縣市 / 鄉鎮區 / 郵遞區號三級連動下拉選單（台灣行政區資料）
  - 地址、電話欄位即時驗證（blur 時觸發）
  - 初始值邏輯：UPDATED_* 有值用 UPDATED_*，否則用 ORIGINAL_*
  - 提交後立即跳轉感謝頁面，API 呼叫在背景非同步執行

#### ErrorMessage（錯誤訊息）

- **檔案**：`src/components/shareholder/ErrorMessage.jsx`
- **Props**：`code`、`message`、`contactInfo`
- **功能**：顯示 QR Code 無效等頁面級錯誤

---

## 5. 資料庫結構

### 5.1 SHAREHOLDER 表（股東主資料）

資料庫：`[STAGE].[dbo].[SHAREHOLDER]`

| 欄位 | 說明 |
|------|------|
| `SORT` | 股東代號（6 位數字，主鍵） |
| `UUID` | 股東 UUID（用於 QR Code URL） |
| `NAME` | 股東姓名 |
| `ID_LAST_FOUR` | 身分證末四碼（供身分證驗證模式） |
| `CITY1` | 原始縣市 |
| `DISTRICT1` | 原始鄉鎮區 |
| `POSTAL_CODE` | 原始郵遞區號 |
| `ORIGINAL_ADDRESS` | 原始地址 |
| `HOME_PHONE_1` / `HOME_PHONE_2` | 原始住家電話 |
| `MOBILE_PHONE_1` / `MOBILE_PHONE_2` | 原始手機號碼 |
| `UPDATED_CITY` | 更新後縣市 |
| `UPDATED_DISTRICT` | 更新後鄉鎮區 |
| `UPDATED_POSTAL_CODE` | 更新後郵遞區號 |
| `UPDATED_ADDRESS` | 更新後地址 |
| `UPDATED_HOME_PHONE_1` / `UPDATED_HOME_PHONE_2` | 更新後住家電話 |
| `UPDATED_MOBILE_PHONE_1` / `UPDATED_MOBILE_PHONE_2` | 更新後手機號碼 |
| `LOGIN_COUNT` | 登入次數（每次驗證成功 + 1） |
| `UPDATE_COUNT` | 更新次數（每次確認資料 + 1） |
| `CREATED_AT` | 建立時間 |
| `UPDATED_AT` | 最後更新時間 |

**欄位優先順序邏輯**：

```
顯示 / 使用的值 = UPDATED_* 有值 ? UPDATED_* : ORIGINAL_*
```

### 5.2 SHAREHOLDER_LOG 表（操作日誌）

資料庫：`[STAGE].[dbo].[SHAREHOLDER_LOG]`

| 欄位 | 說明 |
|------|------|
| `LOG_ID` | 日誌 UUID（主鍵） |
| `SHAREHOLDER_UUID` | 股東 UUID |
| `SHAREHOLDER_CODE` | 股東代號 |
| `ACTION_TYPE` | 操作類型：`visit`（掃描）/ `verify`（驗證） |
| `ACTION_TIME` | 操作時間（GETDATE()） |
| `VERIFICATION_TYPE` | 驗證方式：`phone` / `id` |
| `PHONE_NUMBER_USED` | 驗證使用的手機號碼 |
| `RANDOM_CODE` | 系統產生的 4 位驗證碼 |
| `PHONE_VERIFICATION_TIME` | 手機驗證成功時間 |
| `HAS_UPDATED_DATA` | 是否有修改資料（0 / 1） |
| `UPDATED_CITY` | 提交的縣市（快照） |
| `UPDATED_DISTRICT` | 提交的鄉鎮區（快照） |
| `UPDATED_POSTAL_CODE` | 提交的郵遞區號（快照） |
| `UPDATED_ADDRESS` | 提交的地址（快照） |
| `UPDATED_HOME_PHONE_1` / `UPDATED_HOME_PHONE_2` | 提交的住家電話（快照） |
| `UPDATED_MOBILE_PHONE_1` / `UPDATED_MOBILE_PHONE_2` | 提交的手機號碼（快照） |

**日誌生命週期**：

```
1. qr-check API  → INSERT (ACTION_TYPE = 'visit')
2. send-code API → UPDATE (ACTION_TYPE = 'verify', 寫入 RANDOM_CODE)
3. verify API    → UPDATE (寫入 PHONE_VERIFICATION_TIME)
4. data PUT API  → UPDATE (HAS_UPDATED_DATA = 1, 各欄位快照)
```

---

## 6. 驗證與安全機制

### 6.1 驗證流程

| 關卡 | 說明 |
|------|------|
| 第一關 | QR Code UUID 必須存在於 SHAREHOLDER 表 |
| 第二關 | 手機驗證碼（4 碼，1 分鐘有效）或身分證末四碼 |

### 6.2 冷卻與有效期

| 機制 | 時間 | 說明 |
|------|------|------|
| 驗證碼有效期 | 60 秒 | 從產生到驗證的時限，超過須重新發送 |
| 重送冷卻時間 | 60 秒 | 同一手機號碼兩次發送之間的間隔 |
| 前端倒數計時 | 60 秒 | 畫面上顯示倒數，到期自動跳回發送畫面 |

### 6.3 手機號碼優先順序

```
使用的手機號碼 = UPDATED_MOBILE_PHONE_1 || MOBILE_PHONE_1
若兩者皆為空 → 改用身分證末四碼驗證
```

### 6.4 輸入驗證規則

| 欄位 | 格式 | 規則 |
|------|------|------|
| 手機驗證碼 | 4 位數字 | 僅數字，必須恰好 4 碼 |
| 身分證末四碼 | 4 位數字 | 僅數字，必須恰好 4 碼 |
| 手機號碼 | 09xxxxxxxx | 09 開頭、10 碼數字 |
| 地址 | 文字 | 必填，最多 200 字元 |
| 郵遞區號 | 5 位數字 | 僅數字 |

### 6.5 錯誤代碼

| 代碼 | HTTP | 訊息 |
|------|------|------|
| `MISSING_REQUIRED_FIELD` | 400 | 缺少必填欄位 |
| `INVALID_FORMAT` | 400 | 資料格式錯誤 |
| `AUTHENTICATION_FAILED` | 401 | 身份驗證失敗 |
| `QR_CODE_INVALID` | 404 | QR Code 無效或已過期 |
| `SHAREHOLDER_NOT_FOUND` | 404 | 股東不存在 |
| `DATABASE_ERROR` | 500 | 資料庫錯誤 |
| `INTERNAL_SERVER_ERROR` | 500 | 伺服器內部錯誤 |

---

## 7. 簡訊服務

- **檔案**：`src/lib/sms.js`
- **服務商**：e8d.tw（ `https://new.e8d.tw/API21/HTTP/SendSMS.ashx` ）
- **認證**：環境變數 `SMS_UID` / `SMS_PWD`
- **逾時**：10 秒
- **簡訊內容範例**：

```
【中華工程系統簡訊】親愛的股東您好，您的驗證碼是：1234，請於1分鐘內驗證。
```

---

## 8. 環境變數與測試模式

### 8.1 關鍵環境變數

| 變數 | 說明 |
|------|------|
| `TESTMODE` | 後端測試模式（`true` / `1` = 開啟，`false` / `0` = 關閉） |
| `NEXT_PUBLIC_TESTMODE` | 前端測試模式（同上，需 `NEXT_PUBLIC_` 前綴） |
| `SMS_UID` / `SMS_PWD` | 簡訊服務帳號密碼 |
| `MSSQL_SERVER` / `MSSQL_USER` / `MSSQL_PASSWORD` / `MSSQL_DATABASE` / `MSSQL_PORT` | 資料庫連線設定 |

### 8.2 測試模式差異

| 行為 | 測試模式 | 正式模式 |
|------|----------|----------|
| 簡訊發送 | 不發送，僅記錄 log | 真正發送簡訊 |
| 驗證碼回傳 | API 回應中包含驗證碼 | 不回傳 |
| 前端顯示驗證碼 | 畫面上顯示「測試模式：驗證碼為 XXXX」 | 不顯示 |
| 重送冷卻時間 | 60 秒 | 60 秒 |

### 8.3 資料庫時區設定

`src/lib/db.js` 中設定 `useUTC: false`，確保 mssql 驅動以本地時間（UTC+8）解讀 SQL Server 的 `GETDATE()` 值，避免時區偏移造成冷卻時間計算錯誤。

---

## 9. 後台管理頁面

**路徑**：`/shareholder/qrcode-batch`

### 功能

1. **股東列表**（MUI X Data Grid）
   - 欄位：代號、姓名、身分證末四碼、地址（目前值）、電話（目前值）、登入次數、更新次數
   - 分頁：10 / 25 / 50 筆
   - 即時搜尋：支援代號、姓名、地址、電話
2. **QR Code 產生**
   - 當前頁面股東自動產生 QR Code
   - 批次產生供匯出使用
3. **匯出功能**
   - Excel 匯出：含股東資料與 QR Code 圖片
   - PDF 匯出：產生每位股東的信件 PDF

---

## API 回應格式

所有 API 統一使用以下格式：

**成功**：
```json
{
  "success": true,
  "data": { ... }
}
```

**失敗**：
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "繁體中文錯誤訊息"
  }
}
```
