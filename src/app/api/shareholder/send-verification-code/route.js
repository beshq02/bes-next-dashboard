/**
 * 發送手機驗證碼 API
 * POST /api/shareholder/send-verification-code
 *
 * 發送手機驗證碼至股東的手機號碼
 */

import { NextResponse } from 'next/server'
import { createErrorByCode, createSuccessResponse, ERROR_CODES } from '@/lib/errors'
import db from '@/lib/db'
import { sendSMS } from '@/lib/sms'
import crypto from 'crypto'

// 用於暫存驗證碼的 Map（生產環境應使用 Redis）
// 注意：此 Map 在模組層級，與 verify route 中的不同，需要共用時應使用 Redis
export const verificationCodeStore = new Map()

// 驗證碼有效期（1分鐘）
const VERIFICATION_CODE_EXPIRY = 1 * 60 * 1000 // 1分鐘（毫秒）

// 測試模式：從環境變數讀取，預設為 true（測試模式）
// 設定方式：在 .env 檔案中設定 TESTMODE=true 或 TESTMODE=false
// 或設定 TESTMODE=1（測試模式）或 TESTMODE=0（正式模式）
const isTestMode = process.env.TESTMODE === 'true' || process.env.TESTMODE === '1' || process.env.TESTMODE === undefined

// 重新發送間隔
// 測試模式：0 秒（允許立即重新發送）
// 正式模式：1 分鐘
const RESEND_COOLDOWN = isTestMode ? 0 : 1 * 60 * 1000

/**
 * 產生 4 位數字驗證碼
 * @returns {string} 4 位數字驗證碼
 */
function generateVerificationCode() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

/**
 * POST 請求處理器
 * @param {Request} request - Next.js Request 物件
 * @returns {Promise<NextResponse>} API 回應
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { qrCodeIdentifier, phoneNumber, scanLogId } = body

    // 驗證必填欄位
    if (!qrCodeIdentifier) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.MISSING_REQUIRED_FIELD, 'QR Code 識別碼為必填欄位'),
        { status: 400 }
      )
    }

    if (!phoneNumber) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.MISSING_REQUIRED_FIELD, '手機號碼為必填欄位'),
        { status: 400 }
      )
    }

    // 驗證 UUID 格式
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidPattern.test(qrCodeIdentifier)) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.INVALID_FORMAT, 'QR Code 識別碼格式錯誤'),
        { status: 400 }
      )
    }

    // 查詢股東資料
    const query = `
      SELECT SHAREHOLDER_CODE, ID_NUMBER, UPDATED_MOBILE_PHONE, ORIGINAL_MOBILE_PHONE
      FROM [STAGE].[dbo].[testrachel]
      WHERE UUID = @uuid
    `

    const shareholders = await db.query(query, { uuid: qrCodeIdentifier })

    if (!shareholders || shareholders.length === 0) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.QR_CODE_INVALID, 'QR Code 識別碼對應的股東不存在'),
        { status: 404 }
      )
    }

    const shareholder = shareholders[0]
    const expectedPhone = shareholder.UPDATED_MOBILE_PHONE || shareholder.ORIGINAL_MOBILE_PHONE

    // 驗證手機號碼是否與股東資料一致
    if (phoneNumber !== expectedPhone) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.AUTHENTICATION_FAILED, '手機號碼與股東資料不符'),
        { status: 401 }
      )
    }

    // 檢查重新發送間隔（10分鐘冷卻時間）
    const storeKey = `${qrCodeIdentifier}_${phoneNumber}`
    const existingRecord = verificationCodeStore.get(storeKey)
    
    if (existingRecord && existingRecord.sentAt) {
      const timeSinceLastSend = Date.now() - existingRecord.sentAt.getTime()
      if (timeSinceLastSend < RESEND_COOLDOWN) {
        const remainingSeconds = Math.ceil((RESEND_COOLDOWN - timeSinceLastSend) / 1000)
        const remainingMinutes = Math.floor(remainingSeconds / 60)
        const remainingSecs = remainingSeconds % 60
        const timeMessage = remainingMinutes > 0 
          ? `${remainingMinutes} 分 ${remainingSecs} 秒`
          : `${remainingSecs} 秒`
        return NextResponse.json(
          createErrorByCode(ERROR_CODES.INTERNAL_SERVER_ERROR, `請於 ${timeMessage} 後再次發送驗證碼`),
          { status: 429 }
        )
      }
    }

    // 產生 4 位數字驗證碼
    const verificationCode = generateVerificationCode()
    
    // 儲存驗證碼（key: qrCodeIdentifier_phoneNumber, value: { code, expiresAt, sentAt, shareholderCode }）
    const expiresAt = new Date(Date.now() + VERIFICATION_CODE_EXPIRY)
    const sentAt = new Date()
    
    verificationCodeStore.set(storeKey, {
      code: verificationCode,
      expiresAt,
      sentAt, // 記錄發送時間，用於檢查冷卻時間
      shareholderCode: shareholder.SHAREHOLDER_CODE,
    })
    console.log(`[儲存驗證碼] storeKey: "${storeKey}", verificationCode: "${verificationCode}", type: ${typeof verificationCode}`)

    // 根據測試模式決定是否發送簡訊
    const message = `【中華工程系統簡訊】親愛的股東您好，您的驗證碼是：${verificationCode}，請於1分鐘內驗證。`
    let smsResult

    if (isTestMode) {
      // 測試模式：不發送簡訊，僅記錄 log
      console.log(`[測試模式] 驗證碼已產生：${verificationCode}，應發送至：${phoneNumber}`)
      console.log(`[測試模式] 簡訊內容：${message}`)
      smsResult = { success: true, message: '測試模式：簡訊發送已跳過' }
    } else {
      // 正式模式：真正發送簡訊
      console.log(`[正式模式] 發送驗證碼簡訊至：${phoneNumber}`)
      smsResult = await sendSMS(message, phoneNumber, {
        subject: '股東資料驗證碼',
      })
      
      if (!smsResult.success) {
        console.error('簡訊發送失敗:', smsResult.message)
        return NextResponse.json(
          createErrorByCode(ERROR_CODES.INTERNAL_SERVER_ERROR, '簡訊發送失敗，請稍後再試'),
          { status: 500 }
        )
      }
      console.log(`[正式模式] 簡訊發送成功`)
    }

    // 記錄 verify 行為到 testrachel_log
    // 如果有 scanLogId，更新現有記錄；否則建立新記錄
    try {
      if (scanLogId) {
        // 更新現有記錄（從 visit 更新為 verify）
        const updateLogQuery = `
          UPDATE [STAGE].[dbo].[testrachel_log]
          SET ACTION_TYPE = 'verify',
              ACTION_TIME = GETDATE(),
              VERIFICATION_TYPE = 'phone',
              PHONE_NUMBER_USED = @phoneNumber,
              RANDOM_CODE = @randomCode
          WHERE LOG_ID = @scanLogId AND SHAREHOLDER_CODE = @shareholderCode
        `
        await db.query(updateLogQuery, {
          scanLogId,
          shareholderCode: shareholder.SHAREHOLDER_CODE,
          phoneNumber,
          randomCode: verificationCode,
        })
      } else {
        // 建立新記錄（相容舊流程）
        const logId = crypto.randomUUID()
        const insertLogQuery = `
          INSERT INTO [STAGE].[dbo].[testrachel_log]
          (LOG_ID, SHAREHOLDER_CODE, ID_NUMBER, ACTION_TYPE, ACTION_TIME, VERIFICATION_TYPE, PHONE_NUMBER_USED, RANDOM_CODE, HAS_UPDATED_DATA)
          VALUES
          (@logId, @shareholderCode, @idNumber, 'verify', GETDATE(), 'phone', @phoneNumber, @randomCode, 0)
        `
        await db.query(insertLogQuery, {
          logId,
          shareholderCode: shareholder.SHAREHOLDER_CODE,
          idNumber: shareholder.ID_NUMBER,
          phoneNumber,
          randomCode: verificationCode,
        })
      }
    } catch (logError) {
      // 如果記錄 log 失敗，不影響主流程，只記錄錯誤
      console.error('記錄驗證行為失敗:', logError)
    }

    // 計算過期時間（ISO 8601 格式）
    const expiresAtISO = expiresAt.toISOString()

    // 根據測試模式決定是否返回驗證碼
    // 測試模式：返回驗證碼（方便測試）
    // 正式模式：不回傳驗證碼（安全考量）
    const responseData = {
      expiresAt: expiresAtISO,
      message: '驗證碼已發送至您的手機',
      ...(isTestMode && { verificationCode }),
    }

    return NextResponse.json(createSuccessResponse(responseData))
  } catch (error) {
    console.error('發送驗證碼錯誤:', error)
    console.error('錯誤堆疊:', error.stack)

    if (error.message && error.message.includes('資料庫')) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.DATABASE_ERROR, `資料庫錯誤: ${error.message}`),
        { status: 500 }
      )
    }

    return NextResponse.json(
      createErrorByCode(ERROR_CODES.INTERNAL_SERVER_ERROR, `伺服器錯誤: ${error.message || '未知錯誤'}`),
      { status: 500 }
    )
  }
}

/**
 * 驗證驗證碼是否正確（供其他模組使用）
 * @param {string} qrCodeIdentifier - QR Code 識別碼
 * @param {string} phoneNumber - 手機號碼
 * @param {string} code - 驗證碼
 * @returns {object} { valid: boolean, shareholderCode: string | null, error: string }
 */
export function verifyCode(qrCodeIdentifier, phoneNumber, code) {
  const storeKey = `${qrCodeIdentifier}_${phoneNumber}`
  const stored = verificationCodeStore.get(storeKey)

  if (!stored) {
    return { valid: false, shareholderCode: null, error: '驗證碼不存在' }
  }

  // 檢查是否過期
  if (new Date() > stored.expiresAt) {
    verificationCodeStore.delete(storeKey)
    return { valid: false, shareholderCode: null, error: '驗證碼已過期' }
  }

  // 檢查驗證碼是否正確
  if (stored.code !== code) {
    return { valid: false, shareholderCode: null, error: '驗證碼錯誤' }
  }

  // 驗證成功，刪除驗證碼（一次性使用）
  verificationCodeStore.delete(storeKey)

  return { valid: true, shareholderCode: stored.shareholderCode, error: null }
}
