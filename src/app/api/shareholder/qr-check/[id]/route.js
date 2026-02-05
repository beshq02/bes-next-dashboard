/**
 * QR Code 有效性檢查 API
 * GET /api/shareholder/qr-check/[id]
 *
 * 用於在顯示身份驗證彈窗之前，先檢查 URL 中的 QR Code 驗證碼是否存在且有效。
 */

import { NextResponse } from 'next/server'
import { validateQRCodeIdentifier } from '@/lib/validation'
import { createErrorByCode, createSuccessResponse, ERROR_CODES } from '@/lib/errors'
import db from '@/lib/db'
import crypto from 'crypto'

/**
 * GET 請求處理器
 * @param {Request} _request - Next.js Request 物件（此 API 不需要解析 body）
 * @param {{ params: { id: string } }} context - 路徑參數（id 為 QR Code 驗證碼，7 位數字）
 * @returns {Promise<NextResponse>} API 回應
 */
export async function GET(_request, { params }) {
  try {
    const { id: qrCodeIdentifier } = await params

    // 驗證必填欄位
    if (!qrCodeIdentifier) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.MISSING_REQUIRED_FIELD, 'QR Code 識別碼為必填欄位'),
        { status: 400 }
      )
    }

    // 驗證 UUID 格式（標準 UUID 格式：36 字元，包含連字號）
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidPattern.test(qrCodeIdentifier)) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.INVALID_FORMAT, 'QR Code UUID 格式錯誤'),
        { status: 400 }
      )
    }

    // QR Code 識別碼為 UUID，直接根據 UUID 查詢對應的股東
    const qrCodeQuery = `
      SELECT SHAREHOLDER_CODE, NAME, ORIGINAL_ADDRESS, HOME_PHONE_1, MOBILE_PHONE_1,
             UPDATED_MOBILE_PHONE_1, UUID, LOGIN_COUNT, UPDATE_COUNT
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

    // 檢查通過，回傳股東基本資料（供前端後續顯示與驗證流程使用）
    const qrCodeShareholder = qrCodeShareholders[0]

    // 決定要使用的手機號碼（優先順序：UPDATED_MOBILE_PHONE_1 → MOBILE_PHONE_1）
    const phoneNumber = qrCodeShareholder.UPDATED_MOBILE_PHONE_1 || qrCodeShareholder.MOBILE_PHONE_1 || null
    const hasPhoneNumber = !!phoneNumber

    // 在掃描進入頁面時，建立一筆「訪問」行為的 log 記錄
    // ACTION_TYPE = 'visit'，ACTION_TIME 由資料庫 DEFAULT GETDATE() 自動填入
    let scanLogId = null
    try {
      scanLogId = crypto.randomUUID()
      const defaultVerificationType = hasPhoneNumber ? 'phone' : 'id'
      const insertScanLogQuery = `
        INSERT INTO [STAGE].[dbo].[SHAREHOLDER_LOG]
        (LOG_ID, SHAREHOLDER_UUID, SHAREHOLDER_CODE, ACTION_TYPE, VERIFICATION_TYPE, HAS_UPDATED_DATA)
        VALUES
        (@logId, @shareholderUuid, @shareholderCode, @actionType, @verificationType, 0)
      `
      await db.query(insertScanLogQuery, {
        logId: scanLogId,
        shareholderUuid: qrCodeShareholder.UUID,
        shareholderCode: qrCodeShareholder.SHAREHOLDER_CODE,
        actionType: 'visit',
        verificationType: defaultVerificationType,
      })
    } catch (logError) {
      // 如果記錄 log 失敗，不影響主流程，只記錄錯誤
      console.error('記錄訪問行為失敗:', logError)
    }

    const responseData = {
      shareholderCode: qrCodeShareholder.SHAREHOLDER_CODE,
      name: qrCodeShareholder.NAME,
      originalAddress: qrCodeShareholder.ORIGINAL_ADDRESS,
      originalHomePhone: qrCodeShareholder.HOME_PHONE_1 || null,
      originalMobilePhone: qrCodeShareholder.MOBILE_PHONE_1 || null,
      updatedMobilePhone: qrCodeShareholder.UPDATED_MOBILE_PHONE_1 || null,
      phoneNumber, // 要使用的手機號碼
      hasPhoneNumber, // 是否有手機號碼（用於決定驗證方式）
      uuid: qrCodeShareholder.UUID,
      loginCount: qrCodeShareholder.LOGIN_COUNT || 0,
      updateCount: qrCodeShareholder.UPDATE_COUNT || 0,
      scanLogId, // 掃描時建立的 log ID，供後續 verify API 更新使用
    }

    return NextResponse.json(createSuccessResponse(responseData))
  } catch (error) {
    console.error('QR Code 有效性檢查錯誤:', error)
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
      createErrorByCode(
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        `伺服器錯誤: ${error.message || '未知錯誤'}`
      ),
      { status: 500 }
    )
  }
}
