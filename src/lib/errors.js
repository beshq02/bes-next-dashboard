/**
 * 錯誤處理工具函數
 * 用於產生一致的 API 錯誤回應格式
 */

/**
 * 產生標準錯誤回應
 * @param {string} code - 錯誤代碼
 * @param {string} message - 錯誤訊息（繁體中文）
 * @param {number} statusCode - HTTP 狀態碼
 * @returns {object} 標準錯誤回應物件
 */
export function createErrorResponse(code, message, statusCode = 500) {
  return {
    success: false,
    error: {
      code,
      message,
    },
    statusCode,
  }
}

/**
 * 產生標準成功回應
 * @param {any} data - 回應資料
 * @param {string} message - 成功訊息（繁體中文，可選）
 * @returns {object} 標準成功回應物件
 */
export function createSuccessResponse(data, message = null) {
  const response = {
    success: true,
    data,
  }
  
  if (message) {
    response.message = message
  }
  
  return response
}

/**
 * 錯誤代碼常數
 */
export const ERROR_CODES = {
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  NO_CHANGES: 'NO_CHANGES',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  SHAREHOLDER_NOT_FOUND: 'SHAREHOLDER_NOT_FOUND',
  QR_CODE_INVALID: 'QR_CODE_INVALID',
  DATABASE_ERROR: 'DATABASE_ERROR',
  QR_CODE_GENERATION_FAILED: 'QR_CODE_GENERATION_FAILED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
}

/**
 * 預設錯誤訊息（繁體中文）
 */
export const ERROR_MESSAGES = {
  MISSING_REQUIRED_FIELD: '缺少必填欄位',
  INVALID_FORMAT: '資料格式錯誤',
  NO_CHANGES: '資料未變更',
  AUTHENTICATION_FAILED: '身份驗證失敗，如持續無法驗證，請聯繫管理員',
  SHAREHOLDER_NOT_FOUND: '股東不存在',
  QR_CODE_INVALID: 'QR Code 無效或已過期',
  DATABASE_ERROR: '資料庫錯誤',
  QR_CODE_GENERATION_FAILED: 'QR Code 產生失敗',
  INTERNAL_SERVER_ERROR: '伺服器內部錯誤',
}

/**
 * 根據錯誤代碼產生錯誤回應
 * @param {string} code - 錯誤代碼
 * @param {string} customMessage - 自訂錯誤訊息（可選）
 * @param {number} statusCode - HTTP 狀態碼（可選）
 * @returns {object} 標準錯誤回應物件
 */
export function createErrorByCode(code, customMessage = null, statusCode = null) {
  const message = customMessage || ERROR_MESSAGES[code] || ERROR_MESSAGES.INTERNAL_SERVER_ERROR
  
  // 根據錯誤代碼決定 HTTP 狀態碼
  let httpStatus = statusCode
  if (!httpStatus) {
    switch (code) {
      case ERROR_CODES.MISSING_REQUIRED_FIELD:
      case ERROR_CODES.INVALID_FORMAT:
      case ERROR_CODES.NO_CHANGES:
        httpStatus = 400
        break
      case ERROR_CODES.AUTHENTICATION_FAILED:
        httpStatus = 401
        break
      case ERROR_CODES.SHAREHOLDER_NOT_FOUND:
      case ERROR_CODES.QR_CODE_INVALID:
        httpStatus = 404
        break
      default:
        httpStatus = 500
    }
  }
  
  return createErrorResponse(code, message, httpStatus)
}

