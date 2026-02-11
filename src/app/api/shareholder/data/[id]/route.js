/**
 * 股東資料查詢與更新 API
 * GET /api/shareholder/data/[id] - 查詢股東資料
 * PUT /api/shareholder/data/[id] - 更新股東資料
 *
 * 注意：路徑參數 [id] 為股東代號（1-6位數字），而非數字 ID
 */

import { NextResponse } from 'next/server'
import { createErrorByCode, createSuccessResponse, ERROR_CODES } from '@/lib/errors'
import db from '@/lib/db'

/**
 * GET 請求處理器 - 查詢股東資料
 * @param {Request} request - Next.js Request 物件
 * @param {object} params - 路由參數（id 為股東代號，1-6位數字）
 * @returns {Promise<NextResponse>} API 回應
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.MISSING_REQUIRED_FIELD, '股東代號為必填'),
        { status: 400 }
      )
    }
    
    // 驗證股東代號格式（1-6位數字）
    if (!/^\d{1,6}$/.test(id)) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.INVALID_FORMAT, '股東代號格式錯誤，應為1-6位數字'),
        { status: 400 }
      )
    }

    // 查詢股東資料（使用 SORT 作為主鍵）
    const query = `
      SELECT [SORT], NAME, UUID,
             CITY1, DISTRICT1, POSTAL_CODE, ORIGINAL_ADDRESS,
             HOME_PHONE_1, HOME_PHONE_2, MOBILE_PHONE_1, MOBILE_PHONE_2,
             UPDATED_CITY, UPDATED_DISTRICT, UPDATED_ADDRESS,
             UPDATED_POSTAL_CODE,
             UPDATED_HOME_PHONE_1, UPDATED_HOME_PHONE_2,
             UPDATED_MOBILE_PHONE_1, UPDATED_MOBILE_PHONE_2,
             UPDATED_EMAIL,
             LOGIN_COUNT, UPDATE_COUNT,
             CREATED_AT, UPDATED_AT
      FROM [STAGE].[dbo].[SHAREHOLDER]
      WHERE [SORT] = @shareholderCode
    `

    const shareholders = await db.query(query, { shareholderCode: id })
    
    if (!shareholders || shareholders.length === 0) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.SHAREHOLDER_NOT_FOUND),
        { status: 404 }
      )
    }
    
    const shareholder = shareholders[0]
    
    // 輔助函數：清理字串值（trim 後若為空則回傳 null）
    const clean = (val) => {
      if (val === null || val === undefined) return null
      const trimmed = String(val).trim()
      return trimmed === '' ? null : trimmed
    }
    // 輔助函數：移除所有空白字元（用於姓名等不應含空白的欄位）
    const stripAll = (val) => {
      if (val === null || val === undefined) return null
      const stripped = String(val).replace(/\s+/g, '')
      return stripped === '' ? null : stripped
    }

    const responseData = {
      shareholderCode: clean(shareholder.SORT),
      name: stripAll(shareholder.NAME),
      uuid: clean(shareholder.UUID),
      // 地址欄位
      originalCity: clean(shareholder.CITY1),
      originalDistrict: clean(shareholder.DISTRICT1),
      originalPostalCode: clean(shareholder.POSTAL_CODE),
      originalAddress: clean(shareholder.ORIGINAL_ADDRESS),
      updatedCity: clean(shareholder.UPDATED_CITY),
      updatedDistrict: clean(shareholder.UPDATED_DISTRICT),
      updatedPostalCode: clean(shareholder.UPDATED_POSTAL_CODE),
      updatedAddress: clean(shareholder.UPDATED_ADDRESS),
      // 電話欄位
      originalHomePhone1: clean(shareholder.HOME_PHONE_1),
      originalHomePhone2: clean(shareholder.HOME_PHONE_2),
      originalMobilePhone1: clean(shareholder.MOBILE_PHONE_1),
      originalMobilePhone2: clean(shareholder.MOBILE_PHONE_2),
      updatedHomePhone1: clean(shareholder.UPDATED_HOME_PHONE_1),
      updatedHomePhone2: clean(shareholder.UPDATED_HOME_PHONE_2),
      updatedMobilePhone1: clean(shareholder.UPDATED_MOBILE_PHONE_1),
      updatedMobilePhone2: clean(shareholder.UPDATED_MOBILE_PHONE_2),
      // Email 欄位
      updatedEmail: clean(shareholder.UPDATED_EMAIL),
      // 其他欄位
      loginCount: shareholder.LOGIN_COUNT || 0,
      updateCount: shareholder.UPDATE_COUNT || 0,
      createdAt: shareholder.CREATED_AT,
      updatedAt: shareholder.UPDATED_AT,
    }
    
    return NextResponse.json(createSuccessResponse(responseData))
  } catch (error) {
    console.error('查詢股東資料錯誤:', error)
    
    if (error.message.includes('資料庫')) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.DATABASE_ERROR),
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      createErrorByCode(ERROR_CODES.INTERNAL_SERVER_ERROR),
      { status: 500 }
    )
  }
}

/**
 * PUT 請求處理器 - 更新股東資料
 * @param {Request} request - Next.js Request 物件
 * @param {object} params - 路由參數（id 為股東代號，1-6位數字）
 * @returns {Promise<NextResponse>} API 回應
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      updatedCity, updatedDistrict, updatedAddress,
      updatedPostalCode,
      updatedHomePhone1, updatedHomePhone2,
      updatedMobilePhone1, updatedMobilePhone2,
      updatedEmail,
      logId
    } = body
    
    if (!id) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.MISSING_REQUIRED_FIELD, '股東代號為必填'),
        { status: 400 }
      )
    }
    
    // 驗證股東代號格式（1-6位數字）
    if (!/^\d{1,6}$/.test(id)) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.INVALID_FORMAT, '股東代號格式錯誤，應為1-6位數字'),
        { status: 400 }
      )
    }

    // 檢查是否有提供任何要更新的欄位
    const hasAnyField = [
      updatedCity, updatedDistrict, updatedAddress,
      updatedPostalCode,
      updatedHomePhone1, updatedHomePhone2,
      updatedMobilePhone1, updatedMobilePhone2,
      updatedEmail
    ].some(field => field !== undefined)

    if (!hasAnyField) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.MISSING_REQUIRED_FIELD, '至少需要提供一個要更新的欄位'),
        { status: 400 }
      )
    }

    // 先查詢現有資料（使用 SORT 作為主鍵）
    // 需要同時取得 ORIGINAL_* 和 UPDATED_* 欄位以計算預設值
    const selectQuery = `
      SELECT
        CITY1, DISTRICT1, POSTAL_CODE, ORIGINAL_ADDRESS,
        HOME_PHONE_1, HOME_PHONE_2, MOBILE_PHONE_1, MOBILE_PHONE_2,
        UPDATED_CITY, UPDATED_DISTRICT, UPDATED_ADDRESS,
        UPDATED_POSTAL_CODE,
        UPDATED_HOME_PHONE_1, UPDATED_HOME_PHONE_2,
        UPDATED_MOBILE_PHONE_1, UPDATED_MOBILE_PHONE_2,
        UPDATED_EMAIL
      FROM [STAGE].[dbo].[SHAREHOLDER]
      WHERE [SORT] = @shareholderCode
    `

    const existingData = await db.query(selectQuery, { shareholderCode: id })
    
    if (!existingData || existingData.length === 0) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.SHAREHOLDER_NOT_FOUND),
        { status: 404 }
      )
    }
    
    const existing = existingData[0]
    
    // 計算預設值（對每個欄位）：UPDATED_* 有值就用 UPDATED_*，沒有就用 ORIGINAL_*
    const getDefaultValue = (updatedValue, originalValue) => {
      // 如果 UPDATED_* 有值（不為 NULL 且不為空字串），則使用 UPDATED_*
      if (updatedValue !== null && updatedValue !== undefined && updatedValue.trim() !== '') {
        return updatedValue.trim()
      }
      // 否則使用 ORIGINAL_*
      return originalValue || ''
    }
    
    // 計算各欄位的預設值
    const defaultCity = getDefaultValue(existing.UPDATED_CITY, existing.CITY1)
    const defaultDistrict = getDefaultValue(existing.UPDATED_DISTRICT, existing.DISTRICT1)
    const defaultPostalCode = getDefaultValue(existing.UPDATED_POSTAL_CODE, existing.POSTAL_CODE)
    const defaultAddress = getDefaultValue(existing.UPDATED_ADDRESS, existing.ORIGINAL_ADDRESS)
    const defaultHomePhone1 = getDefaultValue(existing.UPDATED_HOME_PHONE_1, existing.HOME_PHONE_1) || null
    const defaultHomePhone2 = getDefaultValue(existing.UPDATED_HOME_PHONE_2, existing.HOME_PHONE_2) || null
    const defaultMobilePhone1 = getDefaultValue(existing.UPDATED_MOBILE_PHONE_1, existing.MOBILE_PHONE_1) || null
    const defaultMobilePhone2 = getDefaultValue(existing.UPDATED_MOBILE_PHONE_2, existing.MOBILE_PHONE_2) || null
    const defaultEmail = getDefaultValue(existing.UPDATED_EMAIL, '') || null

    // 處理有提供的欄位，比較前端值與預設值
    const updateFields = []
    const updateParams = { shareholderCode: id }
    const updatedParams = {} // 用於記錄實際更新的值（供日誌使用）

    // 處理城市欄位
    if (updatedCity !== undefined) {
      const trimmedCity = (updatedCity || '').trim()
      if (trimmedCity !== defaultCity) {
        updateFields.push('UPDATED_CITY = @updatedCity')
        updateParams.updatedCity = trimmedCity
        updatedParams.updatedCity = trimmedCity
      }
    }

    // 處理區域欄位
    if (updatedDistrict !== undefined) {
      const trimmedDistrict = (updatedDistrict || '').trim()
      if (trimmedDistrict !== defaultDistrict) {
        updateFields.push('UPDATED_DISTRICT = @updatedDistrict')
        updateParams.updatedDistrict = trimmedDistrict
        updatedParams.updatedDistrict = trimmedDistrict
      }
    }

    // 處理郵遞區號欄位
    if (updatedPostalCode !== undefined) {
      const trimmedPostalCode = (updatedPostalCode || '').trim()
      if (trimmedPostalCode !== defaultPostalCode) {
        updateFields.push('UPDATED_POSTAL_CODE = @updatedPostalCode')
        updateParams.updatedPostalCode = trimmedPostalCode
        updatedParams.updatedPostalCode = trimmedPostalCode
      }
    }

    // 處理地址欄位（前端已驗證，直接處理）
    if (updatedAddress !== undefined) {
      const trimmedAddress = (updatedAddress || '').trim()
      if (trimmedAddress !== defaultAddress) {
        updateFields.push('UPDATED_ADDRESS = @updatedAddress')
        updateParams.updatedAddress = trimmedAddress
        updatedParams.updatedAddress = trimmedAddress
      }
    }

    // 處理住家電話1欄位（前端已驗證，直接處理）
    if (updatedHomePhone1 !== undefined) {
      const trimmedPhone = (updatedHomePhone1 || '').trim() || null
      if (trimmedPhone !== defaultHomePhone1) {
        updateFields.push('UPDATED_HOME_PHONE_1 = @updatedHomePhone1')
        updateParams.updatedHomePhone1 = trimmedPhone
        updatedParams.updatedHomePhone1 = trimmedPhone
      }
    }

    // 處理住家電話2欄位（選填，前端已驗證，直接處理）
    if (updatedHomePhone2 !== undefined) {
      const trimmedPhone = (updatedHomePhone2 || '').trim() || null
      if (trimmedPhone !== defaultHomePhone2) {
        updateFields.push('UPDATED_HOME_PHONE_2 = @updatedHomePhone2')
        updateParams.updatedHomePhone2 = trimmedPhone
        updatedParams.updatedHomePhone2 = trimmedPhone
      }
    }

    // 處理手機電話1欄位（前端已驗證，直接處理）
    if (updatedMobilePhone1 !== undefined) {
      const trimmedPhone = (updatedMobilePhone1 || '').trim() || null
      if (trimmedPhone !== defaultMobilePhone1) {
        updateFields.push('UPDATED_MOBILE_PHONE_1 = @updatedMobilePhone1')
        updateParams.updatedMobilePhone1 = trimmedPhone
        updatedParams.updatedMobilePhone1 = trimmedPhone
      }
    }

    // 處理手機電話2欄位（選填，前端已驗證，直接處理）
    if (updatedMobilePhone2 !== undefined) {
      const trimmedPhone = (updatedMobilePhone2 || '').trim() || null
      if (trimmedPhone !== defaultMobilePhone2) {
        updateFields.push('UPDATED_MOBILE_PHONE_2 = @updatedMobilePhone2')
        updateParams.updatedMobilePhone2 = trimmedPhone
        updatedParams.updatedMobilePhone2 = trimmedPhone
      }
    }

    // 處理 Email 欄位（選填，前端已驗證，直接處理）
    if (updatedEmail !== undefined) {
      const trimmedEmail = (updatedEmail || '').trim() || null
      if (trimmedEmail !== defaultEmail) {
        updateFields.push('UPDATED_EMAIL = @updatedEmail')
        updateParams.updatedEmail = trimmedEmail
        updatedParams.updatedEmail = trimmedEmail
      }
    }

    // 檢查是否有任何欄位變更
    const hasDataChange = updateFields.length > 0

    // 更新資料：只更新有變更的 UPDATED_* 欄位，但總是記錄修改次數
    const updateQuery = `
      UPDATE [STAGE].[dbo].[SHAREHOLDER]
      SET ${updateFields.length > 0 ? updateFields.join(', ') + ',' : ''}
          UPDATE_COUNT = UPDATE_COUNT + 1,
          UPDATED_AT = GETDATE()
      WHERE [SORT] = @shareholderCode
    `

    await db.query(updateQuery, updateParams)

    // 更新 SHAREHOLDER_LOG 記錄（如果提供了 logId）
    if (logId) {
      try {
        const updateLogQuery = `
          UPDATE [STAGE].[dbo].[SHAREHOLDER_LOG]
          SET HAS_UPDATED_DATA = @hasUpdatedData,
              UPDATED_CITY = @updatedCity,
              UPDATED_DISTRICT = @updatedDistrict,
              UPDATED_POSTAL_CODE = @updatedPostalCode,
              UPDATED_ADDRESS = @updatedAddress,
              UPDATED_HOME_PHONE_1 = @updatedHomePhone1,
              UPDATED_HOME_PHONE_2 = @updatedHomePhone2,
              UPDATED_MOBILE_PHONE_1 = @updatedMobilePhone1,
              UPDATED_MOBILE_PHONE_2 = @updatedMobilePhone2,
              UPDATED_EMAIL = @updatedEmail
          WHERE LOG_ID = @logId AND SHAREHOLDER_CODE = @shareholderCode
        `

        // 準備日誌更新參數（NOT NULL 欄位使用空字串代替 null）
        const logUpdateParams = {
          logId,
          shareholderCode: id,
          hasUpdatedData: hasDataChange ? 1 : 0,
          updatedCity: updatedParams.updatedCity !== undefined ? updatedParams.updatedCity : '',
          updatedDistrict: updatedParams.updatedDistrict !== undefined ? updatedParams.updatedDistrict : '',
          updatedPostalCode: updatedParams.updatedPostalCode !== undefined ? updatedParams.updatedPostalCode : '',
          updatedAddress: updatedParams.updatedAddress !== undefined ? updatedParams.updatedAddress : '',
          updatedHomePhone1: updatedParams.updatedHomePhone1 !== undefined ? updatedParams.updatedHomePhone1 : '',
          updatedHomePhone2: updatedParams.updatedHomePhone2 !== undefined ? updatedParams.updatedHomePhone2 : '',
          updatedMobilePhone1: updatedParams.updatedMobilePhone1 !== undefined ? updatedParams.updatedMobilePhone1 : '',
          updatedMobilePhone2: updatedParams.updatedMobilePhone2 !== undefined ? updatedParams.updatedMobilePhone2 : '',
          updatedEmail: updatedParams.updatedEmail !== undefined ? updatedParams.updatedEmail : '',
        }

        await db.query(updateLogQuery, logUpdateParams)
      } catch (logError) {
        // LOG 寫入失敗不影響主流程，僅記錄錯誤
        console.error('更新 SHAREHOLDER_LOG 記錄失敗:', logError)
      }
    }

    return NextResponse.json(
      createSuccessResponse({ shareholderCode: id }, '資料更新成功'),
      { status: 200 }
    )
  } catch (error) {
    console.error('更新股東資料錯誤:', error)
    
    if (error.message.includes('資料庫')) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.DATABASE_ERROR),
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      createErrorByCode(ERROR_CODES.INTERNAL_SERVER_ERROR),
      { status: 500 }
    )
  }
}
