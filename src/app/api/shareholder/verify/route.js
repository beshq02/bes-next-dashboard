/**
 * 身份驗證 API（第二階段）
 * POST /api/shareholder/verify
 *
 * 支援兩種驗證方式：
 * 1. 手機驗證碼驗證（當股東資料中有手機號碼時）
 * 2. 身分證末四碼驗證（當股東資料中沒有手機號碼時）
 */

import { NextResponse } from 'next/server'
import { validateIdLastFour, validateVerificationCode, validateQRCodeIdentifier } from '@/lib/validation'
import { createErrorByCode, createSuccessResponse, ERROR_CODES } from '@/lib/errors'
import db from '@/lib/db'
import crypto from 'crypto'

/**
 * 從資料庫日誌（SHAREHOLDER_LOG）中查找並比對手機驗證碼
 * 流程：
 * 1. 先用 qrCodeIdentifier 取得股東資料（上層已完成），取得 shareholderUuid
 * 2. 再用 shareholderUuid + phoneNumber 到 SHAREHOLDER_LOG 查詢最近一次的 RANDOM_CODE
 * 3. 檢查是否存在、是否在有效時間內，再與使用者輸入的 4 碼做比對
 *
 * 注意：這裡不再依賴記憶體中的 verificationCodeStore，而是完全以資料庫為準
 * @param {object} params
 * @param {string} params.qrCodeIdentifier - QR Code 識別碼（用於除錯列印）
 * @param {string} params.phoneNumber - 手機號碼
 * @param {string} params.code - 使用者輸入的驗證碼
 * @param {string} params.shareholderUuid - 股東 UUID（從 SHAREHOLDER 取得）
 * @returns {Promise<object>} { valid: boolean, shareholderCode: string | null, error: string }
 */
async function verifyCodeByLog({ qrCodeIdentifier, phoneNumber, code, shareholderUuid }) {
  const inputCodeStr = String(code || '').trim()

  if (process.env.NODE_ENV !== 'production') {
    console.log('====================== 驗證碼比對（DB）開始 ======================')
    console.log('[步驟 1] 取得輸入與查詢條件', {
      qrCodeIdentifier,
      phoneNumber,
      shareholderUuid,
      inputCodeRaw: code,
      inputCodeStr,
    })
  }

  // 直接從日誌表中，根據 SHAREHOLDER_UUID + PHONE_NUMBER_USED 找出最近一次的驗證記錄
  const query = `
    SELECT TOP 1
      SHAREHOLDER_CODE,
      SHAREHOLDER_UUID,
      PHONE_NUMBER_USED,
      RANDOM_CODE,
      ACTION_TIME,
      VERIFICATION_TYPE,
      ACTION_TYPE
    FROM [STAGE].[dbo].[SHAREHOLDER_LOG]
    WHERE SHAREHOLDER_UUID = @shareholderUuid
      AND PHONE_NUMBER_USED = @phoneNumber
      AND VERIFICATION_TYPE = 'phone'
      AND ACTION_TYPE = 'verify'
    ORDER BY ACTION_TIME DESC
  `

  const rows = await db.query(query, { shareholderUuid, phoneNumber })

  if (!rows || rows.length === 0 || !rows[0].RANDOM_CODE) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[步驟 2] 找不到對應的驗證碼紀錄（RANDOM_CODE）', {
        shareholderUuid,
        phoneNumber,
        rowCount: rows ? rows.length : 0,
      })
      console.log('====================== 驗證碼比對（DB）結束（失敗：不存在） ======================')
    }
    return { valid: false, shareholderCode: null, error: '驗證碼不存在' }
  }

  const record = rows[0]
  const storedCodeStr = String(record.RANDOM_CODE || '').trim()
  const actionTime = record.ACTION_TIME ? new Date(record.ACTION_TIME) : null
  const now = new Date()

  if (process.env.NODE_ENV !== 'production') {
    console.log('[步驟 2] 取得最近一次驗證碼紀錄', {
      shareholderCode: record.SHAREHOLDER_CODE,
      shareholderUuid: record.SHAREHOLDER_UUID,
      phoneNumberUsed: record.PHONE_NUMBER_USED,
      storedCodeRaw: record.RANDOM_CODE,
      storedCodeStr,
      actionTime,
      now,
    })
  }

  // 檢查是否超過有效時間（與發送驗證碼 API 一致：1 分鐘）
  if (actionTime && now.getTime() - actionTime.getTime() > 1 * 60 * 1000) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[步驟 3] 驗證碼已超過 1 分鐘有效時間', {
        diffMs: now.getTime() - actionTime.getTime(),
      })
      console.log('====================== 驗證碼比對（DB）結束（失敗：已過期） ======================')
    }
    return { valid: false, shareholderCode: null, error: '驗證碼已過期' }
  }

  // 比對使用者輸入與資料庫中的 RANDOM_CODE
  const isEqual = storedCodeStr === inputCodeStr

  if (process.env.NODE_ENV !== 'production') {
    console.log('[步驟 3] 開始比對驗證碼', {
      storedCodeStr,
      inputCodeStr,
      isEqual,
    })
  }

  if (!isEqual) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[步驟 4] 驗證碼不一致，比對失敗')
      console.log('====================== 驗證碼比對（DB）結束（失敗：內容不符） ======================')
    }
    return { valid: false, shareholderCode: null, error: '驗證碼錯誤' }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[步驟 4] 驗證碼一致，比對成功', {
      shareholderCode: record.SHAREHOLDER_CODE,
    })
    console.log('====================== 驗證碼比對（DB）結束（成功） ======================')
  }

  return { valid: true, shareholderCode: record.SHAREHOLDER_CODE, error: null }
}

/**
 * POST 請求處理器
 * @param {Request} request - Next.js Request 物件
 * @returns {Promise<NextResponse>} API 回應
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { qrCodeIdentifier, verificationType, verificationCode, idLastFour, phoneNumber, scanLogId } = body

    // 驗證必填欄位
    if (!qrCodeIdentifier) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.MISSING_REQUIRED_FIELD, 'QR Code 識別碼為必填欄位'),
        { status: 400 }
      )
    }

    if (!verificationType || (verificationType !== 'phone' && verificationType !== 'id')) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.MISSING_REQUIRED_FIELD, '驗證類型為必填欄位，必須為 "phone" 或 "id"'),
        { status: 400 }
      )
    }

    // 根據驗證類型驗證必填欄位
    if (verificationType === 'phone') {
      if (!verificationCode) {
        return NextResponse.json(
          createErrorByCode(ERROR_CODES.MISSING_REQUIRED_FIELD, '手機驗證碼為必填欄位'),
          { status: 400 }
        )
      }
      if (!phoneNumber) {
        return NextResponse.json(
          createErrorByCode(ERROR_CODES.MISSING_REQUIRED_FIELD, '手機號碼為必填欄位'),
          { status: 400 }
        )
      }

      // 驗證格式
      const codeValidation = validateVerificationCode(verificationCode)
      if (!codeValidation.valid) {
        return NextResponse.json(
          createErrorByCode(ERROR_CODES.INVALID_FORMAT, codeValidation.error || '格式錯誤'),
          { status: 400 }
        )
      }
    } else if (verificationType === 'id') {
      if (!idLastFour) {
        return NextResponse.json(
          createErrorByCode(ERROR_CODES.MISSING_REQUIRED_FIELD, '身分證末四碼為必填欄位'),
          { status: 400 }
        )
      }

      // 驗證格式
      const idLastFourValidation = validateIdLastFour(idLastFour)
      if (!idLastFourValidation.valid) {
        return NextResponse.json(
          createErrorByCode(ERROR_CODES.INVALID_FORMAT, idLastFourValidation.error || '格式錯誤'),
          { status: 400 }
        )
      }
    }

    // QR Code 識別碼支援兩種格式：UUID 或 7位數字驗證碼
    let qrCodeShareholder = null

    // 檢查是否為 UUID 格式
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidPattern.test(qrCodeIdentifier)) {
      // UUID 格式：直接根據 UUID 查詢
      const qrCodeQuery = `
        SELECT [SORT], UUID, NAME, ORIGINAL_ADDRESS,
               COALESCE(UPDATED_MOBILE_PHONE_1, MOBILE_PHONE_1, '') AS PHONE,
               UPDATED_MOBILE_PHONE_1, MOBILE_PHONE_1
        FROM [STAGE].[dbo].[SHAREHOLDER]
        WHERE UUID = @uuid
      `

      const qrCodeShareholders = await db.query(qrCodeQuery, { uuid: qrCodeIdentifier })

      if (!qrCodeShareholders || qrCodeShareholders.length === 0) {
        return NextResponse.json(
          createErrorByCode(ERROR_CODES.QR_CODE_INVALID, 'QR Code 無效或已過期，請聯繫管理員'),
          { status: 404 }
        )
      }

      qrCodeShareholder = {
        shareholder_code: qrCodeShareholders[0].SORT,
        uuid: qrCodeShareholders[0].UUID,
        name: qrCodeShareholders[0].NAME,
        address: qrCodeShareholders[0].ORIGINAL_ADDRESS,
        phone: qrCodeShareholders[0].PHONE,
        updated_mobile_phone: qrCodeShareholders[0].UPDATED_MOBILE_PHONE_1,
        original_mobile_phone: qrCodeShareholders[0].MOBILE_PHONE_1,
      }
    } else {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.INVALID_FORMAT, 'QR Code 識別碼格式錯誤'),
        { status: 400 }
      )
    }

    // 根據驗證類型進行驗證
    let isVerified = false
    let verificationInfo = {
      verificationType: verificationType,
      phoneNumberUsed: verificationType === 'phone' ? phoneNumber : null,
      phoneVerificationTime: null, // 手機驗證完成時間（僅成功時）
      randomCode: null, // 系統產生的原始驗證碼（僅手機驗證時）
    }

    // 準備記錄 log 所需的資訊
    const shareholderCode = qrCodeShareholder.shareholder_code
    const shareholderUuid = qrCodeShareholder.uuid

    // 輔助函數：更新或插入驗證記錄（成功或失敗都使用）
    // 注意：log 記錄已經在 send-verification-code 時建立（ACTION_TYPE = 'verify'），
    // 這裡只需要更新 PHONE_VERIFICATION_TIME（驗證成功時）
    async function updateOrInsertVerificationLog(isSuccess) {
      // 如果有 scanLogId，更新現有記錄（主要是更新 PHONE_VERIFICATION_TIME）
      if (scanLogId) {
        if (verificationType === 'phone' && isSuccess) {
          // 手機驗證成功時，更新 PHONE_VERIFICATION_TIME
          const updateLogQuery = `
            UPDATE [STAGE].[dbo].[SHAREHOLDER_LOG]
            SET PHONE_VERIFICATION_TIME = @phoneVerificationTime
            WHERE LOG_ID = @scanLogId AND SHAREHOLDER_CODE = @shareholderCode
          `
          await db.query(updateLogQuery, {
            scanLogId,
            shareholderCode,
            phoneVerificationTime: verificationInfo.phoneVerificationTime,
          })
        }
        return scanLogId
      } else {
        // 如果沒有 scanLogId，建立新記錄（相容舊流程，但這種情況理論上不應該發生）
        const logId = crypto.randomUUID()
        const insertLogQuery = `
          INSERT INTO [STAGE].[dbo].[SHAREHOLDER_LOG]
          (LOG_ID, SHAREHOLDER_UUID, SHAREHOLDER_CODE, ACTION_TYPE, ACTION_TIME, VERIFICATION_TYPE, PHONE_NUMBER_USED, PHONE_VERIFICATION_TIME, RANDOM_CODE, HAS_UPDATED_DATA)
          VALUES
          (@logId, @shareholderUuid, @shareholderCode, 'verify', GETDATE(), @verificationType, @phoneNumberUsed, @phoneVerificationTime, @randomCode, 0)
        `
        await db.query(insertLogQuery, {
          logId,
          shareholderUuid,
          shareholderCode,
          verificationType: verificationType,
          phoneNumberUsed: verificationInfo.phoneNumberUsed || null,
          phoneVerificationTime: isSuccess ? verificationInfo.phoneVerificationTime : null,
          randomCode: verificationInfo.randomCode || null,
        })
        return logId
      }
    }

    if (verificationType === 'phone') {
      // 手機驗證碼驗證
      const phoneUsed = qrCodeShareholder.updated_mobile_phone || qrCodeShareholder.original_mobile_phone

      if (!phoneUsed || phoneNumber !== phoneUsed) {
        // 驗證失敗（手機號碼不符），不需要更新 log（因為沒有發送驗證碼，所以沒有 log）
        return NextResponse.json(
          createErrorByCode(ERROR_CODES.AUTHENTICATION_FAILED, '請掃描信件上的 QR Code'),
          { status: 401 }
        )
      }

      // 驗證驗證碼（確保類型一致，轉為字符串）
      const codeToVerify = String(verificationCode).trim()
      if (process.env.NODE_ENV !== 'production') {
        console.log('[前端送入的驗證碼資訊]', {
          rawVerificationCode: verificationCode,
          afterTrim: codeToVerify,
          qrCodeIdentifier,
          phoneNumber,
        })
      }

      // 使用 SHAREHOLDER_LOG 中的 RANDOM_CODE 進行驗證：
      // 1. 先用 qrCodeIdentifier 從 SHAREHOLDER 取得 uuid（上方已完成）
      // 2. 再用 uuid + phoneNumber 到 SHAREHOLDER_LOG 找出最近一次的 RANDOM_CODE
      const codeResult = await verifyCodeByLog({
        qrCodeIdentifier,
        phoneNumber,
        code: codeToVerify,
        shareholderUuid,
      })

      if (!codeResult.valid) {
        // 驗證失敗，不需要更新 log（log 已經在 send-verification-code 時建立）
        if (codeResult.error === '驗證碼已過期') {
          return NextResponse.json(
            createErrorByCode(ERROR_CODES.AUTHENTICATION_FAILED, '驗證碼已過期，請重新發送驗證碼'),
            { status: 401 }
          )
        }
        if (codeResult.error === '驗證碼不存在') {
          return NextResponse.json(
            createErrorByCode(ERROR_CODES.AUTHENTICATION_FAILED, '驗證碼不存在，請重新發送驗證碼'),
            { status: 401 }
          )
        }
        return NextResponse.json(
          createErrorByCode(ERROR_CODES.AUTHENTICATION_FAILED, '請確認驗證碼'),
          { status: 401 }
        )
      }

      // 驗證成功，記錄手機驗證完成時間
      verificationInfo.phoneVerificationTime = new Date()

      // 驗證成功
      isVerified = true
    } else if (verificationType === 'id') {
      // 身分證末四碼驗證
      // 查詢身分證末四碼對應的股東（可能重複，需再與 QR Code 檢查碼比對）
      const idLastFourQuery = `
        SELECT [SORT], UUID, NAME, ORIGINAL_ADDRESS,
               COALESCE(UPDATED_MOBILE_PHONE_1, MOBILE_PHONE_1, '') AS PHONE
        FROM [STAGE].[dbo].[SHAREHOLDER]
        WHERE ID_LAST_FOUR = @idLastFour
      `

      const idLastFourShareholders = await db.query(idLastFourQuery, { idLastFour })

      if (!idLastFourShareholders || idLastFourShareholders.length === 0) {
        // 驗證失敗，如果沒有 scanLogId 才建立 log（相容舊流程）
        if (!scanLogId) {
          await updateOrInsertVerificationLog(false)
        }
        return NextResponse.json(
          createErrorByCode(ERROR_CODES.AUTHENTICATION_FAILED, '請確認身分證末四碼'),
          { status: 401 }
        )
      }

      const idLastFourShareholder = {
        shareholder_code: idLastFourShareholders[0].SORT,
        uuid: idLastFourShareholders[0].UUID,
        name: idLastFourShareholders[0].NAME,
        address: idLastFourShareholders[0].ORIGINAL_ADDRESS,
        phone: idLastFourShareholders[0].PHONE,
      }

      // 比對兩個查詢結果是否為同一股東（使用 shareholder_code 比對）
      if (qrCodeShareholder.shareholder_code !== idLastFourShareholder.shareholder_code) {
        // 驗證失敗，如果沒有 scanLogId 才建立 log（相容舊流程）
        if (!scanLogId) {
          await updateOrInsertVerificationLog(false)
        }
        return NextResponse.json(
          createErrorByCode(ERROR_CODES.AUTHENTICATION_FAILED, '請掃描信件上的 QR Code'),
          { status: 401 }
        )
      }

      // 驗證成功，更新 log（將 visit 更新為 verify）
      if (scanLogId) {
        const updateLogQuery = `
          UPDATE [STAGE].[dbo].[SHAREHOLDER_LOG]
          SET ACTION_TYPE = 'verify',
              ACTION_TIME = GETDATE(),
              VERIFICATION_TYPE = 'id'
          WHERE LOG_ID = @scanLogId AND SHAREHOLDER_CODE = @shareholderCode
        `
        await db.query(updateLogQuery, {
          scanLogId,
          shareholderCode: qrCodeShareholder.shareholder_code,
        })
      } else {
        // 如果沒有 scanLogId，建立新記錄（相容舊流程）
        await updateOrInsertVerificationLog(true)
      }

      // 驗證成功
      isVerified = true
    }

    if (!isVerified) {
      // 理論上不會到這裡，因為所有失敗情況都已經處理了
      // 如果沒有 scanLogId 才建立 log（相容舊流程）
      if (!scanLogId) {
        await updateOrInsertVerificationLog(false)
      }
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.AUTHENTICATION_FAILED, '驗證失敗'),
        { status: 401 }
      )
    }

    // 驗證成功，更新登入次數
    const updateLoginCountQuery = `
      UPDATE [STAGE].[dbo].[SHAREHOLDER]
      SET LOGIN_COUNT = LOGIN_COUNT + 1,
          UPDATED_AT = GETDATE()
      WHERE [SORT] = @shareholderCode
    `

    await db.query(updateLoginCountQuery, { shareholderCode })

    // 在 testrachel_log 中更新或建立登入記錄（驗證成功）
    const logId = await updateOrInsertVerificationLog(true)

    // 驗證成功，返回股東資料（包含 logId 供後續更新日誌使用）
    const responseData = {
      shareholderCode: qrCodeShareholder.shareholder_code,
      uuid: qrCodeShareholder.uuid,
      name: qrCodeShareholder.name,
      address: qrCodeShareholder.address,
      phone: qrCodeShareholder.phone,
      verified: true,
      logId, // UUID 格式，供後續更新日誌使用
    }

    return NextResponse.json(createSuccessResponse(responseData))
  } catch (error) {
    console.error('身份驗證錯誤:', error)
    console.error('錯誤堆疊:', error.stack)

    // 資料庫錯誤
    if (error.message && error.message.includes('資料庫')) {
      console.error('資料庫錯誤詳情:', error.message)
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.DATABASE_ERROR, `資料庫錯誤: ${error.message}`),
        { status: 500 }
      )
    }

    // 其他錯誤
    return NextResponse.json(
      createErrorByCode(ERROR_CODES.INTERNAL_SERVER_ERROR, `伺服器錯誤: ${error.message || '未知錯誤'}`),
      { status: 500 }
    )
  }
}
