# UI Design System & Style Guide

版本：v1  
適用範圍：整個專案（含股東資料修正功能與管理後台）  

> **原則**：各功能規格文件只需引用本設計系統，除非有「該功能特有」的 UI 行為或版面需求，才在各自的 `spec.md` 裡另外補充。

---

## 1. 設計系統總覽

- **主要 UI 元件庫**：Material UI (MUI)  
- **輔助 UI 元件庫**：shadcn/ui（主要用於 OTP / 特殊輸入元件）  
- **樣式系統**：Tailwind CSS + CSS variables（作為 design tokens 的實作）  
- **設計原則**：
  - 優先使用既有的 Design System 元件（按鈕、表單、Dialog、表格等），避免每個頁面自行客製。
  - 遵循 Material Design 3 風格，一致的間距、陰影、圓角與排版。
  - 以可讀性、可點擊性與無障礙（a11y）為優先，而非純視覺裝飾。

---

## 2. 顏色系統（Color System）

### 2.1 基礎色票

- **Primary**：`hsl(222.2, 47.4%, 11.2%)`  
  - 主要操作、主要按鈕、重要連結。
- **Primary Foreground**：`hsl(210, 40%, 98%)`  
  - Primary 元件上的文字 / icon。
- **Secondary**：`hsl(210, 40%, 96.1%)`  
  - 次要背景、次要按鈕。

### 2.2 語意色（Semantic Colors）

- **Success**：MUI 預設綠色（成功狀態、完成提示）。
- **Error / Destructive**：`hsl(0, 84.2%, 60.2%)`（錯誤訊息、危險操作）。
- **Warning**：MUI 預設橙色（警示類訊息）。
- **Info**：MUI 預設藍色（一般提示與資訊）。

### 2.3 中性色（Neutral Colors）

- **Background**：  
  - 淺色主題：`hsl(0, 0%, 100%)`  
  - 深色主題：`hsl(222.2, 84%, 4.9%)`
- **Foreground**：  
  - 淺色主題文字：`hsl(222.2, 84%, 4.9%)`  
  - 深色主題文字：`hsl(210, 40%, 98%)`
- **Border**：  
  - 淺色邊框：`hsl(214.3, 31.8%, 91.4%)`  
  - 深色邊框：`hsl(217.2, 32.6%, 17.5%)`
- **Muted / Disabled 背景**：`hsl(210, 40%, 96.1%)`

---

## 3. 字體與排版（Typography）

- **主要字體**：`Roboto`（透過 `@fontsource/roboto` 或 MUI 預設）。  
- **標題（Headings）**：  
  - `h1` ~ `h6`，對應約 40px ~ 16px，字重使用 Medium（500）或 Bold（700）。  
- **內文（Body）**：  
  - `body1`：16px，主要段落文字。  
  - `body2`：14px，次要說明、表格內容。  
- **說明文字（Caption）**：  
  - 12px，用於標籤、副標題、輕量提示。  
- **按鈕文字**：  
  - 14px，字重 Medium，全部使用句首大寫或全形中文，不使用全大寫英文縮寫。

---

## 4. 間距系統（Spacing System）

- **Base unit**：8px。  
- **常用刻度**：
  - `xs`：4px
  - `sm`：8px
  - `md`：16px
  - `lg`：24px
  - `xl`：32px
- **建議用法**：
  - 表單欄位上下間距：`md` (16px)  
  - Dialog 內容 padding：`lg` (24px)  
  - 頁面左右邊距：`lg` ~ `xl` (24–32px)

---

## 5. 共用元件規範（Components）

### 5.1 Buttons（按鈕）

- **Variant**：
  - Contained：主要行為（確認、送出）。  
  - Outlined：次要行為（取消、返回）。  
  - Text：純文字操作（例如次要連結）。  
- **尺寸**：
  - Large：高度約 42px（主要 CTA）。  
  - Medium：高度約 36px。  
  - Small：高度約 30px（工具列、小按鈕）。  
- **互動狀態**：
  - Hover：顏色較正常狀態加深約 10%。  
  - Disabled：整體透明度約 0.38，游標為預設箭頭，不可點。  
  - Loading：可搭配 `CircularProgress` 或 icon 表示處理中。

### 5.2 Text Fields（文字輸入）

- **樣式**：優先使用 MUI `TextField` 的 `outlined` variant。  
- **高度**：單行欄位高度約 56px（含 label）。  
- **Label / Helper Text**：
  - Label 置於輸入框上方，字體用 `body2`。  
  - Helper text 置於輸入框下方，字體用 `caption`，顏色為 muted 前景。  
- **狀態**：
  - Focus：邊框為 Primary 色，寬度約 2px。  
  - Error：邊框與 label 皆使用 Error 色，同時顯示錯誤文字。

### 5.3 Input OTP（一次性密碼 / 多格輸入）

- **主要元件**：`@/components/ui/input-otp`（shadcn/ui 風格）。  
- **通用設定**：
  - 每個 slot 寬度一致，整體高度與 `TextField` 接近（約 56px）。  
  - Focus：Primary 邊框 2px。  
  - Error：Error/Destructive 顏色邊框。  
  - 支援自動焦點移動、退格回上一格、一次貼上完整內容。

> 各功能若有特別的 OTP 行為（例如自動送出條件、允許的長度），在各自的 `spec.md` 中額外說明。

### 5.4 Dialogs（對話框）

- **元件**：MUI `Dialog` / `Modal` 或等價實作。  
- **共用規則**：
  - 最大寬度約 600px；在行動裝置上改為接近全寬（左右各留約 16px）。  
  - 圓角約 4px，背景為卡片顏色，上層疊加半透明遮罩 `rgba(0, 0, 0, 0.5)`。  
  - 標題與內容皆使用 `lg` padding，操作區用 `md` padding，按鈕右對齊。  
  - 一般對話框內容可以捲動；若某功能需要「不可滾動」，在該功能的規格裡特別註明。

### 5.5 Tables（表格 / DataGrid）

- **元件**：MUI X Data Grid（`@mui/x-data-grid`）或 MUI `Table`。  
- **共用外觀**：
  - 外層使用 `Paper` 容器，`elevation=1`。  
  - 表頭背景為 muted 色，字體 `body2` + Medium 字重，列高約 56px。  
  - 資料列最小高度約 52px，滑過時背景改為 muted。  
  - 儲存格 padding：水平 16px、垂直 8px。  
  - 內建分頁，每頁筆數可在 [5, 10, 25, 50] 之間選擇。  

### 5.6 Alerts（訊息提示）

- **變體**：Error / Success / Warning / Info 四種。  
- **樣式**：
  - 對應語意顏色背景與 icon。  
  - 上下間距約 16px，圓角 4px。  
  - 文字使用 `body2`。

---

## 6. 響應式與無障礙（Responsive & Accessibility）

### 6.1 Breakpoints（建議）

- 行動裝置：寬度 < 600px。  
- 平板：600px ~ 1200px。  
- 桌面：> 1200px。  

各頁面應遵循：

- 行動裝置上，Dialog 幾乎全寬、按鈕可改為直向排列。  
- 複雜表格允許水平捲動，而非縮到看不清楚。  

### 6.2 無障礙（A11y）

- 文本與背景對比度至少 4.5:1（WCAG AA）。  
- 所有互動元件（按鈕、連結、輸入框）都能用鍵盤操作，Tab 順序有邏輯。  
- 焦點狀態需有明顯 2px Primary 邊框或清楚的高亮。  
- 表單欄位必須有對應 `label`，錯誤訊息需與對應欄位建立關聯（例如 `aria-describedby`）。  

---

## 7. 品牌元素（Branding）

- **Logo 檔案**：`public/logo.png`。  
- **基本使用**：
  - 在主要導覽列、身份驗證相關畫面與感謝頁面顯示公司 Logo 與標題。  
  - 建議高度約 40–48px，與標題文字並排，保持 16px 以上間距。  

---

## 8. 在功能規格中如何引用本設計系統

在各功能的 `spec.md` 中，請遵循以下寫法：

- 在 UI/UX 或 Design 小節開頭，加上類似說明：  
  - 「本功能採用專案共用 UI Design System（見 `specs/ui-design-system.md`）。除本節特別註明者外，所有按鈕、表單欄位、對話框與表格皆依該設計系統的預設樣式實作。」  
- 僅在有「本功能獨有」的情境時，才在該 `spec.md` 裡補充：  
  - 特殊對話框行為（例如：禁止滾動、保留錯誤訊息空間）。  
  - 特定頁面文案與佈局（例如：感謝頁的內容、管理表格的欄位順序）。  

如此一來，未來若 Design System 有版本更新，只需更新本文件與共用元件實作，各功能規格大多可維持不變。

