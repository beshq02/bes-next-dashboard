# Railway FastAPI - Convert API

## Overview

將 Supabase Storage 中的 PDF/DOC 投標須知檔案透過 Gemini AI 轉換為 Markdown 格式。

| 項目 | 值 |
|------|-----|
| Base URL | `https://web-production-6c7cc.up.railway.app` |
| Railway 專案 | alluring-laughter (`c9be935d-7053-4ac8-8bb4-e9bd215259ae`) |
| 服務名稱 | web (`d524b522-33f3-45fc-905f-84c3ed17a93b`) |
| 執行環境 | Python + FastAPI + Uvicorn |
| AI 模型 | Google Gemini (預設 `gemini-2.5-flash`) |
| 依賴服務 | Supabase (Storage + Database) |

---

## Endpoints

### `GET /health`

健康檢查端點。

**Response** `200 OK`

```json
{ "status": "ok" }
```

---

### `POST /convert`

將檔案轉換為 Markdown。

#### Request

**Content-Type:** `application/json`

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `file_url` | `string` | Yes | Supabase Storage 完整 URL 或相對路徑 |
| `detail_id` | `string \| null` | No | `gcc_tender_detail` ID，若提供會將轉換結果更新至資料庫 |
| `model` | `string \| null` | No | Gemini 模型名稱，預設 `gemini-2.5-flash` |

**Request Body 範例：**

```json
{
  "file_url": "tender-files/abc123/投標須知.pdf",
  "detail_id": "550e8400-e29b-41d4-a716-446655440000",
  "model": null
}
```

#### Response `200 OK`

| 欄位 | 型別 | 說明 |
|------|------|------|
| `success` | `boolean` | 轉換是否成功 |
| `markdown_storage_path` | `string \| null` | 轉換後 Markdown 檔案在 Supabase Storage 的路徑 |
| `markdown_length` | `integer` | Markdown 內容長度（字元數），預設 `0` |
| `message` | `string` | 結果訊息，預設 `""` |

**成功範例：**

```json
{
  "success": true,
  "markdown_storage_path": "tender-markdown/abc123/投標須知.md",
  "markdown_length": 15420,
  "message": "轉換完成"
}
```

**失敗範例：**

```json
{
  "success": false,
  "markdown_storage_path": null,
  "markdown_length": 0,
  "message": "檔案下載失敗：404 Not Found"
}
```

#### Response `422 Validation Error`

請求參數驗證失敗時回傳。

```json
{
  "detail": [
    {
      "loc": ["body", "file_url"],
      "msg": "Field required",
      "type": "missing",
      "input": {}
    }
  ]
}
```

---

## 使用範例

### cURL

```bash
curl -X POST https://web-production-6c7cc.up.railway.app/convert \
  -H "Content-Type: application/json" \
  -d '{
    "file_url": "tender-files/abc123/投標須知.pdf",
    "detail_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### JavaScript (fetch)

```javascript
const response = await fetch('https://web-production-6c7cc.up.railway.app/convert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    file_url: 'tender-files/abc123/投標須知.pdf',
    detail_id: '550e8400-e29b-41d4-a716-446655440000',
  }),
})

const result = await response.json()
// { success: true, markdown_storage_path: "...", markdown_length: 15420, message: "轉換完成" }
```

### Next.js Server Action

```javascript
'use server'

const CONVERT_API = 'https://web-production-6c7cc.up.railway.app/convert'

export async function convertTenderFile(fileUrl, detailId) {
  const res = await fetch(CONVERT_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file_url: fileUrl,
      detail_id: detailId || null,
    }),
  })

  if (!res.ok) throw new Error(`Convert API error: ${res.status}`)
  return res.json()
}
```

---

## 處理流程

```
file_url (PDF/DOC)
  │
  ▼
Supabase Storage 下載檔案
  │
  ▼
Gemini AI 轉換為 Markdown
  │
  ├─ 上傳 Markdown 至 Supabase Storage
  │
  └─ (若有 detail_id) 更新 gcc_tender_detail 資料庫
  │
  ▼
回傳 ConvertResponse
```

---

## Railway 服務配置

| 配置 | 值 |
|------|-----|
| Start Command | `cd src && uvicorn api:app --host 0.0.0.0 --port $PORT` |
| Health Check | `/health` |
| Region | 自動 |
| Replicas | 1 |
| Sleep Mode | Disabled |

## Swagger UI

服務運行時可直接瀏覽互動式 API 文檔：

```
https://web-production-6c7cc.up.railway.app/docs
```
