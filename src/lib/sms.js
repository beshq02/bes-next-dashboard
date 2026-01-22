/**
 * 簡訊發送模組
 * 使用 e8d.tw 簡訊服務商 API 發送簡訊
 */

const SMS_API_URL = 'https://new.e8d.tw/API21/HTTP/SendSMS.ashx'
const SMS_TIMEOUT_MS = 10000 // 簡訊服務最長等待時間 10 秒

// 帳號密碼（應該從環境變數讀取）
const UID = process.env.SMS_UID || 'besTE'
const PWD = process.env.SMS_PWD || 'besTE168'

/**
 * 發送簡訊
 * @param {string} message - 簡訊發送內容（必填）
 * @param {string} dest - 手機號碼（必填），多組號碼以半形逗點隔開
 *                       格式: "0912345678" 或 "+886912345678" 或 "+886912345678,+886923456789"
 * @param {Object} options - 選填參數
 * @param {string} [options.subject] - 簡訊主旨（選填）。主旨不會隨著簡訊內容發送出去，用以註記本次發送之用途。
 * @param {string} [options.st] - 預約時間（選填）。格式為 yyyyMMddHHmmss，立即發送請傳入空字串 ""
 * @param {string|number} [options.retryTime] - 有效期限（選填）。預設為1440，單位：分鐘。
 * @param {string} [options.eventId] - 活動代碼（選填）。活動代碼為[互動回覆簡訊]頻道代碼。
 * @returns {Promise<Object>} API 回應結果
 */
export async function sendSMS(message, dest, options = {}) {
  const { subject, st, retryTime, eventId } = options

  // 準備 form data（Content-Type: application/x-www-form-urlencoded）
  const formData = new URLSearchParams()
  formData.append('UID', UID)
  formData.append('PWD', PWD)
  formData.append('MSG', message)
  formData.append('DEST', dest)

  // 加入選填參數
  if (subject !== undefined) {
    formData.append('SB', subject)
  }

  if (st !== undefined) {
    formData.append('ST', st)
  }

  if (retryTime !== undefined) {
    formData.append('RETRYTIME', String(retryTime))
  }

  if (eventId !== undefined) {
    formData.append('EventID', String(eventId))
  }

  try {
    // 使用 AbortController 實作逾時機制，避免等待過久
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), SMS_TIMEOUT_MS)

    const response = await fetch(SMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // 多數簡訊業者會回傳純文字而非 JSON，因此一律先讀取文字
    const text = await response.text()

    if (!response.ok) {
      console.error('簡訊發送失敗 (HTTP 狀態碼非 2xx):', response.status, text)
      return {
        success: false,
        message: `簡訊服務回應錯誤 (HTTP ${response.status})`,
        statusCode: response.status,
        text,
      }
    }

    // 若 HTTP 200 視為發送成功，將原始文字回應記錄在 data 方便日後除錯
    return {
      success: true,
      message: text || '簡訊已送出',
      data: text,
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('簡訊發送逾時:', error)
      return {
        success: false,
        message: '簡訊服務回應逾時，請稍後再試',
        error,
      }
    }

    console.error('簡訊發送錯誤:', error)
    return {
      success: false,
      message: error.message || '發送簡訊時發生錯誤',
      error,
    }
  }
}
