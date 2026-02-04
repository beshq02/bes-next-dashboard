/**
 * URL 工具函數
 * 統一處理 baseUrl 的取得邏輯，確保 QR Code 和超連結使用相同的 URL
 */

/**
 * 取得 base URL（伺服器端使用）
 * @param {Request} request - Next.js Request 物件
 * @returns {string} base URL（例如：http://localhost:6230）
 */
export function getBaseUrlFromRequest(request) {
  const headers = request.headers

  // 從 headers 取得 host（支援反向代理）
  const host = headers.get('x-forwarded-host') || headers.get('host') || ''

  // 從 headers 取得 protocol（支援反向代理）
  const protocol = headers.get('x-forwarded-proto') || 'http'

  // 將 0.0.0.0 替換為 localhost
  const normalizedHost = host.replace('0.0.0.0', 'localhost')
  return `${protocol}://${normalizedHost}`
}

/**
 * 取得 base URL（客戶端使用）
 * @param {string} apiBaseUrl - 從 API 回傳的 baseUrl（優先使用）
 * @returns {string} base URL
 */
export function getBaseUrlFromClient(apiBaseUrl = null) {
  // 1. 優先使用 API 回傳的 baseUrl（確保與 QR Code 一致）
  if (apiBaseUrl) {
    return apiBaseUrl
  }
  
  // 2. 如果沒有 API baseUrl，使用當前頁面的 origin
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // 3. 伺服器端渲染時，回傳空字串（使用相對路徑）
  return ''
}

/**
 * 建立股東更新頁面的完整 URL
 * @param {string} shareholderIdentifier - 股東識別碼（UUID）
 * @param {string} baseUrl - 基礎 URL（可選）
 * @returns {string} 完整 URL
 */
export function buildShareholderUpdateUrl(shareholderIdentifier, baseUrl = null) {
  const relativePath = `/shareholder/update/${shareholderIdentifier}`
  
  if (baseUrl) {
    return `${baseUrl}${relativePath}`
  }
  
  // 如果沒有 baseUrl，返回相對路徑
  return relativePath
}
