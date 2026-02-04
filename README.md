# 工令週報

## 主機:10.21.1.121

## 環境變數設定

### 測試模式控制

在 `.env` 檔案中設定以下環境變數來控制測試模式：

#### 後端環境變數（API Routes）
- `TESTMODE`: 控制後端是否為測試模式
  - `TESTMODE=true` 或 `TESTMODE=1`: 測試模式（預設）
    - 不發送真實簡訊
    - API 回應中包含驗證碼（方便測試）
    - 重新發送間隔為 0 秒（可立即重新發送）
  - `TESTMODE=false` 或 `TESTMODE=0`: 正式模式
    - 發送真實簡訊驗證碼
    - API 回應中不包含驗證碼
    - 重新發送間隔為 1 分鐘

#### 前端環境變數（Client-side）
- `NEXT_PUBLIC_TESTMODE`: 控制前端是否顯示驗證碼
  - `NEXT_PUBLIC_TESTMODE=true` 或 `NEXT_PUBLIC_TESTMODE=1`: 測試模式（預設）
    - 在畫面上顯示驗證碼（方便測試）
  - `NEXT_PUBLIC_TESTMODE=false` 或 `NEXT_PUBLIC_TESTMODE=0`: 正式模式
    - 不在畫面上顯示驗證碼

### 範例設定

#### 測試模式（開發環境）
```env
TESTMODE=true
NEXT_PUBLIC_TESTMODE=true
```

#### 正式模式（生產環境）
```env
TESTMODE=false
NEXT_PUBLIC_TESTMODE=false
```

### 簡訊服務設定

如需發送真實簡訊，請在 `.env` 檔案中設定：
```env
SMS_UID=your_sms_username
SMS_PWD=your_sms_password
```

# 股東資料
http://localhost:6230/shareholder/qrcode-batch
