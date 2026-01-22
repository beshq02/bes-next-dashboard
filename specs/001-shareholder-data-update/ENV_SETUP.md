# 環境變數設定說明

## QR Code 生產環境 URL 設定

為了確保紙本印刷的 QR Code 長期有效，建議設定生產環境的基礎 URL。

### 設定方式

在專案根目錄建立 `.env.local` 檔案（此檔案不會被提交到版本控制），並加入以下內容：

```bash
# QR Code 生產環境基礎 URL
# 設定此變數後，QR Code 將使用固定的生產環境 URL，確保印刷後的 QR Code 長期有效
# 如果未設定，系統將自動從請求中取得 base URL
NEXT_PUBLIC_QRCODE_BASE_URL=https://shareholder.yourcompany.com
```

### 使用說明

- **開發環境**：可以不設定此變數，系統會自動從請求中取得 base URL
- **生產環境**：建議設定此變數，確保所有 QR Code 使用固定的生產環境 URL
- **格式**：完整的 URL，包含協議（http:// 或 https://）和域名，不包含路徑

### 範例

```bash
# 開發環境（可選）
NEXT_PUBLIC_QRCODE_BASE_URL=http://localhost:6230

# 生產環境（建議）
NEXT_PUBLIC_QRCODE_BASE_URL=https://shareholder.yourcompany.com
```

