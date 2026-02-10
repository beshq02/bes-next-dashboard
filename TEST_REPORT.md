# 單元測試報告

**專案名稱：** bes-next-dashboard
**測試框架：** Jest
**測試日期：** 2026-02-10
**測試環境：** Node.js / Next.js

---

## 總覽

| 項目 | 結果 |
|------|------|
| 測試套件 (Test Suites) | **6 passed** / 6 total |
| 測試案例 (Tests) | **69 passed** / 69 total |
| 失敗數 | 0 |
| 執行時間 | 3.778 秒 |
| 通過率 | **100%** |

---

## 各測試套件詳細結果

### 1. 股東列表 API — `list.test.js`

**路徑：** `src/__tests__/api/shareholder/list.test.js`
**API 端點：** `GET /api/shareholder/list`
**狀態：** PASS

| # | 測試案例 | 耗時 | 結果 |
|---|---------|------|------|
| 1 | 成功回傳股東列表 | 116ms | PASS |
| 2 | 回應格式含 city1, district1 欄位 | 8ms | PASS |
| 3 | 空資料庫回傳空陣列 | 3ms | PASS |
| 4 | db.query 回傳 null 時回傳空陣列 | 4ms | PASS |
| 5 | 資料庫查詢失敗回傳 500（資料庫錯誤） | 29ms | PASS |
| 6 | 非資料庫錯誤回傳 500（伺服器錯誤） | 11ms | PASS |
| 7 | loginCount / updateCount 為 null 時回傳 0 | 15ms | PASS |
| 8 | 多筆資料正確轉換 | 7ms | PASS |

**小計：8 / 8 通過**

---

### 2. 股東資料取得 API — `data-get.test.js`

**路徑：** `src/__tests__/api/shareholder/data-get.test.js`
**API 端點：** `GET /api/shareholder/data/[id]`
**狀態：** PASS

| # | 測試案例 | 耗時 | 結果 |
|---|---------|------|------|
| 1 | 成功查詢股東資料 | 18ms | PASS |
| 2 | clean 函數正確清理空白字串 | 2ms | PASS |
| 3 | stripAll 函數移除所有空白 | 2ms | PASS |
| 4 | 股東不存在回傳 404 | 3ms | PASS |
| 5 | db.query 回傳 null 時回傳 404 | 2ms | PASS |
| 6 | 缺少股東代號回傳 400 | 2ms | PASS |
| 7 | 股東代號非數字回傳 400 | 1ms | PASS |
| 8 | 股東代號超過6位回傳 400 | 1ms | PASS |
| 9 | 資料庫錯誤回傳 500 | 129ms | PASS |
| 10 | 非資料庫錯誤回傳 500（INTERNAL_SERVER_ERROR） | 14ms | PASS |

**小計：10 / 10 通過**

---

### 3. 股東資料更新 API — `data-put.test.js`

**路徑：** `src/__tests__/api/shareholder/data-put.test.js`
**API 端點：** `PUT /api/shareholder/data/[id]`
**狀態：** PASS

| # | 測試案例 | 耗時 | 結果 |
|---|---------|------|------|
| 1 | 成功更新股東資料（有變更欄位） | 17ms | PASS |
| 2 | 無變更欄位回傳 400 | 2ms | PASS |
| 3 | 股東不存在回傳 404 | 1ms | PASS |
| 4 | 股東代號格式錯誤回傳 400 | 2ms | PASS |
| 5 | 缺少股東代號回傳 400 | 1ms | PASS |
| 6 | 差異比對：與預設值相同不產生 UPDATE 欄位 | 1ms | PASS |
| 7 | 差異比對：UPDATED 有值時以 UPDATED 為預設 | 2ms | PASS |
| 8 | LOG 寫入成功（有 logId） | 3ms | PASS |
| 9 | LOG 寫入失敗不影響主流程 | 137ms | PASS |
| 10 | 無 logId 時不寫 LOG | 1ms | PASS |
| 11 | HAS_UPDATED_DATA 有變更時為 1 | 2ms | PASS |
| 12 | HAS_UPDATED_DATA 無變更時為 0 | 1ms | PASS |
| 13 | 多欄位同時更新 | 1ms | PASS |
| 14 | 資料庫錯誤回傳 500 | 17ms | PASS |
| 15 | 非資料庫錯誤回傳 INTERNAL_SERVER_ERROR | 6ms | PASS |

**小計：15 / 15 通過**

---

### 4. 發送驗證碼 API — `send-verification-code.test.js`

**路徑：** `src/__tests__/api/shareholder/send-verification-code.test.js`
**API 端點：** `POST /api/shareholder/send-verification-code`
**狀態：** PASS

| # | 測試案例 | 耗時 | 結果 |
|---|---------|------|------|
| 1 | 成功發送驗證碼（測試模式） | 96ms | PASS |
| 2 | 缺少 qrCodeIdentifier 回傳 400 | 1ms | PASS |
| 3 | 缺少 phoneNumber 回傳 400 | 3ms | PASS |
| 4 | UUID 格式錯誤回傳 400 | 2ms | PASS |
| 5 | 股東不存在回傳 404 | 1ms | PASS |
| 6 | 手機號碼不符回傳 401 | 1ms | PASS |
| 7 | 手機號碼使用 UPDATED_MOBILE_PHONE_1 優先 | 1ms | PASS |
| 8 | 無 UPDATED 時使用 MOBILE_PHONE_1 | 7ms | PASS |
| 9 | 有 scanLogId 時更新現有 LOG | 15ms | PASS |
| 10 | 無 scanLogId 時建立新 LOG | 7ms | PASS |
| 11 | LOG 寫入失敗不影響主流程 | 36ms | PASS |
| 12 | 資料庫錯誤回傳 500 | 13ms | PASS |

**小計：12 / 12 通過**

---

### 5. 驗證碼驗證 API — `verify.test.js`

**路徑：** `src/__tests__/api/shareholder/verify.test.js`
**API 端點：** `POST /api/shareholder/verify`
**狀態：** PASS

| # | 測試案例 | 耗時 | 結果 |
|---|---------|------|------|
| 1 | 手機驗證成功 | 113ms | PASS |
| 2 | 驗證碼錯誤回傳 401 | 16ms | PASS |
| 3 | 驗證碼過期回傳 401 | 6ms | PASS |
| 4 | 驗證碼不存在回傳 401 | 10ms | PASS |
| 5 | 身分證驗證成功 | 1ms | PASS |
| 6 | 身分證末四碼不符回傳 401（代碼不匹配） | 1ms | PASS |
| 7 | 身分證查無對應股東回傳 401 | 2ms | PASS |
| 8 | 缺少 qrCodeIdentifier 回傳 400 | 2ms | PASS |
| 9 | 缺少 verificationType 回傳 400 | 2ms | PASS |
| 10 | verificationType 無效值回傳 400 | 1ms | PASS |
| 11 | 手機驗證缺少 verificationCode 回傳 400 | 1ms | PASS |
| 12 | 手機驗證缺少 phoneNumber 回傳 400 | 1ms | PASS |
| 13 | 身分證驗證缺少 idLastFour 回傳 400 | <1ms | PASS |
| 14 | QR Code 無效（UUID 查無股東）回傳 404 | <1ms | PASS |
| 15 | QR Code 識別碼格式非 UUID 回傳 400 | <1ms | PASS |

**小計：15 / 15 通過**

---

### 6. QR Code 檢查 API — `qr-check.test.js`

**路徑：** `src/__tests__/api/shareholder/qr-check.test.js`
**API 端點：** `GET /api/shareholder/qr-check/[id]`
**狀態：** PASS

| # | 測試案例 | 耗時 | 結果 |
|---|---------|------|------|
| 1 | QR Code 有效，回傳股東資料 | 17ms | PASS |
| 2 | 無 UPDATED_MOBILE 時使用 MOBILE_PHONE_1 | 2ms | PASS |
| 3 | 無手機號碼時 hasPhoneNumber=false | 4ms | PASS |
| 4 | QR Code 不存在回傳 404 | 6ms | PASS |
| 5 | UUID 格式錯誤回傳 400 | 3ms | PASS |
| 6 | 缺少 id 回傳 400 | 1ms | PASS |
| 7 | LOG 記錄建立（INSERT visit） | 3ms | PASS |
| 8 | LOG 寫入失敗不影響主流程 | 100ms | PASS |
| 9 | 資料庫錯誤回傳 500 | 25ms | PASS |

**小計：9 / 9 通過**

---

## 測試覆蓋面分析

### 按測試類別統計

| 測試類別 | 測試數量 | 說明 |
|---------|---------|------|
| 正常流程 (Happy Path) | 15 | 各 API 的成功回應場景 |
| 參數驗證 (Validation) | 17 | 缺少必填欄位、格式錯誤等 |
| 錯誤處理 (Error Handling) | 16 | 資料庫錯誤、非資料庫錯誤、LOG 失敗 |
| 邊界條件 (Edge Cases) | 12 | null 值處理、空資料、優先順序邏輯 |
| 業務邏輯 (Business Logic) | 9 | 差異比對、驗證碼過期、手機號碼優先順序 |

### 按 HTTP 狀態碼統計

| 狀態碼 | 涵蓋測試數 | 說明 |
|--------|-----------|------|
| 200 | 15 | 成功回應 |
| 400 | 18 | 參數錯誤 / 格式錯誤 |
| 401 | 7 | 驗證失敗 / 未授權 |
| 404 | 7 | 資源不存在 |
| 500 | 10 | 伺服器內部錯誤 |

---

## 測試方式

- **Mock 策略：** 所有資料庫操作（`src/lib/db.js`）均以 Jest mock 模擬，不連接實際資料庫
- **API 呼叫：** 直接匯入 route handler 函數，建構 `Request` 物件進行測試
- **環境隔離：** 每個測試案例前後重置 mock 狀態，確保測試獨立性

---

## 結論

所有 **69 項單元測試全數通過**，涵蓋了股東系統 6 支 API 的：

- 正常業務流程
- 輸入參數驗證
- 資料庫錯誤處理
- 邊界條件與空值處理
- LOG 記錄寫入（成功與失敗）
- 驗證碼的發送、比對、過期機制

系統在各種正常與異常情境下均能正確回應對應的 HTTP 狀態碼與錯誤訊息。
