/**
 * 驗證工具函數
 * 用於驗證表單輸入資料
 */

/**
 * 驗證台灣身分證字號格式
 * @param {string} idNumber - 身分證字號
 * @returns {object} { valid: boolean, error: string }
 */
export function validateIdNumber(idNumber) {
  if (!idNumber) {
    return { valid: false, error: '身分證字號為必填欄位' }
  }
  
  // 移除空白
  const trimmed = idNumber.trim()
  
  // 檢查長度
  if (trimmed.length !== 10) {
    return { valid: false, error: '身分證字號必須為 10 字元' }
  }
  
  // 檢查格式：1 個英文字母 + 9 個數字
  const idPattern = /^[A-Z][0-9]{9}$/
  if (!idPattern.test(trimmed)) {
    return { valid: false, error: '身分證字號格式錯誤，應為 1 個英文字母 + 9 個數字' }
  }
  
  return { valid: true, error: null }
}

/**
 * 驗證身分證末四碼（僅數字）
 * @param {string} lastFour - 身分證末四碼
 * @returns {object} { valid: boolean, error: string }
 */
export function validateIdLastFour(lastFour) {
  if (!lastFour) {
    return { valid: false, error: '身分證末四碼為必填欄位' }
  }

  const trimmed = lastFour.trim()

  if (trimmed.length !== 4) {
    return { valid: false, error: '身分證末四碼必須為 4 碼數字' }
  }

  if (!/^\d{4}$/.test(trimmed)) {
    return { valid: false, error: '格式錯誤' }
  }

  return { valid: true, error: null }
}

/**
 * 驗證電話號碼格式
 * @param {string} phone - 電話號碼
 * @returns {object} { valid: boolean, error: string }
 */
export function validatePhone(phone) {
  if (!phone) {
    return { valid: false, error: '電話號碼為必填欄位' }
  }
  
  // 移除空白和連字號
  const cleaned = phone.replace(/[\s-]/g, '')
  
  // 檢查是否全為數字
  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, error: '電話號碼只能包含數字和連字號' }
  }
  
  // 檢查長度（台灣電話號碼通常為 10 位數字）
  if (cleaned.length !== 10) {
    return { valid: false, error: '電話號碼必須為 10 位數字' }
  }
  
  // 檢查最大長度（包含連字號）
  if (phone.length > 20) {
    return { valid: false, error: '電話號碼長度不能超過 20 字元' }
  }
  
  return { valid: true, error: null }
}

/**
 * 驗證地址格式
 * @param {string} address - 地址
 * @returns {object} { valid: boolean, error: string }
 */
export function validateAddress(address) {
  if (!address) {
    return { valid: false, error: '地址為必填欄位' }
  }
  
  // 移除前後空白
  const trimmed = address.trim()
  
  // 檢查是否為空
  if (trimmed.length === 0) {
    return { valid: false, error: '地址不能為空' }
  }
  
  // 檢查最大長度
  if (trimmed.length > 200) {
    return { valid: false, error: '地址長度不能超過 200 字元' }
  }
  
  return { valid: true, error: null }
}

/**
 * 驗證 QR Code 識別碼格式
 * @param {string} identifier - QR Code 識別碼（應為7位數字：6位股東代號+1位隨機碼）
 * @returns {object} { valid: boolean, error: string }
 */
export function validateQRCodeIdentifier(identifier) {
  if (!identifier) {
    return { valid: false, error: 'QR Code 識別碼為必填欄位' }
  }
  
  // 檢查格式：應為7位數字
  const identifierPattern = /^\d{7}$/
  if (!identifierPattern.test(identifier)) {
    return { valid: false, error: 'QR Code 識別碼格式錯誤，應為7位數字' }
  }
  
  return { valid: true, error: null }
}

/**
 * 驗證手機驗證碼格式（4位數字）
 * @param {string} code - 手機驗證碼
 * @returns {object} { valid: boolean, error: string }
 */
export function validateVerificationCode(code) {
  if (!code) {
    return { valid: false, error: '驗證碼為必填欄位' }
  }

  const trimmed = code.trim()

  if (trimmed.length !== 4) {
    return { valid: false, error: '驗證碼必須為 4 碼數字' }
  }

  if (!/^\d{4}$/.test(trimmed)) {
    return { valid: false, error: '格式錯誤' }
  }

  return { valid: true, error: null }
}
