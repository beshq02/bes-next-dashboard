<!--
  Sync Impact Report:
  Version change: N/A → 1.0.0 (Initial creation)
  Modified principles: N/A (all new)
  Added sections:
    - Core Principles (3 principles)
    - Technology Stack
    - Documentation Standards
    - Code Quality Standards
  Removed sections: N/A
  Templates requiring updates:
    - ✅ plan-template.md (Constitution Check section updated)
    - ✅ spec-template.md (no changes needed - language agnostic)
    - ✅ tasks-template.md (no changes needed - language agnostic)
  Follow-up TODOs: None
-->

# BES Next.js Dashboard Constitution

## Core Principles

### I. 代碼品質與可讀性 (Code Quality & Readability)

所有代碼必須保持乾淨、易讀、易於維護。遵循以下規則：

- **命名規範**：使用有意義的變數、函數和組件名稱，避免縮寫和單字母變數
- **代碼組織**：遵循單一職責原則，每個函數/組件只做一件事
- **註釋原則**：複雜邏輯必須有註釋說明，但代碼本身應該自解釋
- **格式一致性**：使用 Prettier 和 ESLint 確保代碼格式一致
- **重構優先**：發現重複代碼或複雜邏輯時，優先重構而非添加註釋

**理由**：乾淨的代碼降低維護成本，提高團隊協作效率，減少錯誤發生機率。

### II. 繁體中文文檔標準 (Traditional Chinese Documentation)

所有文檔、註釋和用戶介面文字必須使用繁體中文：

- **技術文檔**：README、API 文檔、架構說明等必須使用繁體中文
- **代碼註釋**：複雜邏輯的註釋使用繁體中文，簡單自解釋的代碼可省略註釋
- **用戶介面**：所有 UI 文字、錯誤訊息、提示文字使用繁體中文
- **提交訊息**：Git commit 訊息可以使用英文或繁體中文，但必須清晰描述變更內容
- **變數命名**：代碼中的變數、函數名稱使用英文（遵循 JavaScript/TypeScript 慣例），但相關文檔說明使用繁體中文

**理由**：確保團隊成員和用戶能夠理解所有文檔和介面，提高溝通效率和用戶體驗。

### III. Next.js 框架規範 (Next.js Framework Standards)

專案基於 Next.js 框架開發，必須遵循 Next.js 最佳實踐：

- **App Router**：使用 Next.js App Router 進行路由管理
- **Server Components**：優先使用 Server Components，僅在需要互動時使用 Client Components
- **API Routes**：API 路由放在 `src/app/api/` 目錄下，遵循 RESTful 設計原則
- **檔案結構**：遵循 Next.js 約定，組件放在 `src/components/`，頁面放在 `src/app/`
- **效能優化**：使用 Next.js 內建的圖片優化、代碼分割、靜態生成等功能
- **型別安全**：使用 TypeScript 或 JSDoc 確保型別安全（如專案採用）

**理由**：遵循框架最佳實踐可確保專案的可維護性、效能和擴展性。

## Technology Stack

**框架**：Next.js 15.x  
**語言**：JavaScript/TypeScript  
**樣式**：Tailwind CSS  
**UI 組件庫**：shadcn/ui, Radix UI  
**狀態管理**：React Hooks, Context API  
**資料庫**：Supabase, MSSQL（根據需求）  
**表單處理**：React Hook Form  
**圖表**：ECharts, Recharts

## Documentation Standards

- **README.md**：必須包含專案說明、安裝步驟、開發指南（繁體中文）
- **組件文檔**：複雜組件應有對應的 README 說明其用途和使用方式
- **API 文檔**：API 路由必須有清晰的註釋說明參數、回傳值和錯誤處理
- **架構決策**：重大技術決策應記錄在文檔中，說明決策原因和替代方案

## Code Quality Standards

- **Linting**：使用 ESLint 進行代碼檢查，所有代碼必須通過 lint 檢查
- **Formatting**：使用 Prettier 進行代碼格式化，提交前自動格式化
- **型別檢查**：如使用 TypeScript，必須通過型別檢查，避免使用 `any`
- **組件設計**：組件應該小而專注，避免過度複雜的組件
- **錯誤處理**：所有 API 調用和異步操作必須有適當的錯誤處理
- **可訪問性**：遵循 WCAG 標準，確保應用程式可訪問

## Development Workflow

- **分支策略**：使用功能分支進行開發，主分支保持穩定
- **代碼審查**：所有變更必須經過代碼審查才能合併
- **測試**：關鍵功能應有對應的測試（單元測試、整合測試）
- **提交規範**：提交訊息應清晰描述變更內容和原因

## Governance

本憲法優先於所有其他開發實踐和指南。所有開發工作必須遵循本憲法規定的原則和標準。

**修訂程序**：
- 修訂憲法需要明確的理由和團隊討論
- 重大修訂（影響核心原則）需要團隊共識
- 修訂後必須更新版本號並記錄變更內容
- 修訂後必須檢查並更新相關模板文件

**合規檢查**：
- 所有 Pull Request 必須驗證是否符合憲法要求
- 代碼審查時應檢查代碼品質、文檔完整性和框架規範遵循情況
- 定期回顧憲法執行情況，確保原則得到落實

**版本控制**：
- 使用語義化版本控制（Semantic Versioning）
- MAJOR：向後不相容的原則變更或移除
- MINOR：新增原則或重大擴展
- PATCH：澄清、措辭調整、非語義性改進

**Version**: 1.0.0 | **Ratified**: 2025-12-18 | **Last Amended**: 2025-12-18
