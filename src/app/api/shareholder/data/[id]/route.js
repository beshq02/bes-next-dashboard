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

    // 查詢股東資料（使用 SHAREHOLDER_CODE 作為主鍵）
    const query = `
      SELECT SHAREHOLDER_CODE, NAME, UUID,
             CITY1, DISTRICT, ORIGINAL_ADDRESS,
             HOME_PHONE_1, HOME_PHONE_2, MOBILE_PHONE_1, MOBILE_PHONE_2,
             UPDATED_CITY, UPDATED_DISTRICT, UPDATED_ADDRESS,
             UPDATED_HOME_PHONE_1, UPDATED_HOME_PHONE_2,
             UPDATED_MOBILE_PHONE_1, UPDATED_MOBILE_PHONE_2,
             LOGIN_COUNT, UPDATE_COUNT,
             CREATED_AT, UPDATED_AT
      FROM [STAGE].[dbo].[SHAREHOLDER]
      WHERE SHAREHOLDER_CODE = @shareholderCode
    `
    
    const shareholders = await db.query(query, { shareholderCode: id })
    
    if (!shareholders || shareholders.length === 0) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.SHAREHOLDER_NOT_FOUND),
        { status: 404 }
      )
    }
    
    const shareholder = shareholders[0]
    
    const responseData = {
      shareholderCode: shareholder.SHAREHOLDER_CODE,
      name: shareholder.NAME,
      uuid: shareholder.UUID,
      // 地址欄位
      originalCity: shareholder.CITY1 || null,
      originalDistrict: shareholder.DISTRICT || null,
      originalAddress: shareholder.ORIGINAL_ADDRESS || null,
      updatedCity: shareholder.UPDATED_CITY || null,
      updatedDistrict: shareholder.UPDATED_DISTRICT || null,
      updatedAddress: shareholder.UPDATED_ADDRESS || null,
      // 電話欄位
      originalHomePhone1: shareholder.HOME_PHONE_1 || null,
      originalHomePhone2: shareholder.HOME_PHONE_2 || null,
      originalMobilePhone1: shareholder.MOBILE_PHONE_1 || null,
      originalMobilePhone2: shareholder.MOBILE_PHONE_2 || null,
      updatedHomePhone1: shareholder.UPDATED_HOME_PHONE_1 || null,
      updatedHomePhone2: shareholder.UPDATED_HOME_PHONE_2 || null,
      updatedMobilePhone1: shareholder.UPDATED_MOBILE_PHONE_1 || null,
      updatedMobilePhone2: shareholder.UPDATED_MOBILE_PHONE_2 || null,
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
      updatedHomePhone1, updatedHomePhone2,
      updatedMobilePhone1, updatedMobilePhone2,
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
      updatedHomePhone1, updatedHomePhone2,
      updatedMobilePhone1, updatedMobilePhone2
    ].some(field => field !== undefined)

    if (!hasAnyField) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.MISSING_REQUIRED_FIELD, '至少需要提供一個要更新的欄位'),
        { status: 400 }
      )
    }

    // 先查詢現有資料（使用 SHAREHOLDER_CODE 作為主鍵）
    // 需要同時取得 ORIGINAL_* 和 UPDATED_* 欄位以計算預設值
    const selectQuery = `
      SELECT
        CITY1, DISTRICT, ORIGINAL_ADDRESS,
        HOME_PHONE_1, HOME_PHONE_2, MOBILE_PHONE_1, MOBILE_PHONE_2,
        UPDATED_CITY, UPDATED_DISTRICT, UPDATED_ADDRESS,
        UPDATED_HOME_PHONE_1, UPDATED_HOME_PHONE_2,
        UPDATED_MOBILE_PHONE_1, UPDATED_MOBILE_PHONE_2
      FROM [STAGE].[dbo].[SHAREHOLDER]
      WHERE SHAREHOLDER_CODE = @shareholderCode
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
    const defaultDistrict = getDefaultValue(existing.UPDATED_DISTRICT, existing.DISTRICT)
    const defaultAddress = getDefaultValue(existing.UPDATED_ADDRESS, existing.ORIGINAL_ADDRESS)
    const defaultHomePhone1 = getDefaultValue(existing.UPDATED_HOME_PHONE_1, existing.HOME_PHONE_1) || null
    const defaultHomePhone2 = getDefaultValue(existing.UPDATED_HOME_PHONE_2, existing.HOME_PHONE_2) || null
    const defaultMobilePhone1 = getDefaultValue(existing.UPDATED_MOBILE_PHONE_1, existing.MOBILE_PHONE_1) || null
    const defaultMobilePhone2 = getDefaultValue(existing.UPDATED_MOBILE_PHONE_2, existing.MOBILE_PHONE_2) || null

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
    
    // 檢查是否有任何欄位變更
    const hasDataChange = updateFields.length > 0

    // 更新資料：只更新有變更的 UPDATED_* 欄位，但總是記錄修改次數
    const updateQuery = `
      UPDATE [STAGE].[dbo].[SHAREHOLDER]
      SET ${updateFields.length > 0 ? updateFields.join(', ') + ',' : ''}
          UPDATE_COUNT = UPDATE_COUNT + 1,
          UPDATED_AT = GETDATE()
      WHERE SHAREHOLDER_CODE = @shareholderCode
    `

    await db.query(updateQuery, updateParams)

    // 更新 SHAREHOLDER_LOG 記錄（如果提供了 logId）
    if (logId) {
      const updateLogQuery = `
        UPDATE [STAGE].[dbo].[SHAREHOLDER_LOG]
        SET HAS_UPDATED_DATA = @hasUpdatedData,
            UPDATED_ADDRESS = @updatedAddress,
            UPDATED_HOME_PHONE_1 = @updatedHomePhone1,
            UPDATED_MOBILE_PHONE_1 = @updatedMobilePhone1
        WHERE LOG_ID = @logId AND SHAREHOLDER_CODE = @shareholderCode
      `

      // 準備日誌更新參數
      const logUpdateParams = {
        logId,
        shareholderCode: id,
        hasUpdatedData: hasDataChange ? 1 : 0,
        updatedAddress: hasDataChange && updatedParams.updatedAddress !== undefined ? updatedParams.updatedAddress : null,
        updatedHomePhone1: hasDataChange && updatedParams.updatedHomePhone1 !== undefined ? updatedParams.updatedHomePhone1 : null,
        updatedMobilePhone1: hasDataChange && updatedParams.updatedMobilePhone1 !== undefined ? updatedParams.updatedMobilePhone1 : null,
      }

      await db.query(updateLogQuery, logUpdateParams)
    }

    // 查詢更新後的資料
    const updatedQuery = `
      SELECT SHAREHOLDER_CODE, NAME,
             UPDATED_CITY, UPDATED_DISTRICT, UPDATED_ADDRESS,
             UPDATED_HOME_PHONE_1, UPDATED_HOME_PHONE_2,
             UPDATED_MOBILE_PHONE_1, UPDATED_MOBILE_PHONE_2,
             LOGIN_COUNT, UPDATE_COUNT, UPDATED_AT
      FROM [STAGE].[dbo].[SHAREHOLDER]
      WHERE SHAREHOLDER_CODE = @shareholderCode
    `

    const updatedData = await db.query(updatedQuery, { shareholderCode: id })
    const updated = updatedData[0]

    const responseData = {
      shareholderCode: updated.SHAREHOLDER_CODE,
      name: updated.NAME,
      updatedCity: updated.UPDATED_CITY || null,
      updatedDistrict: updated.UPDATED_DISTRICT || null,
      updatedAddress: updated.UPDATED_ADDRESS || null,
      updatedHomePhone1: updated.UPDATED_HOME_PHONE_1 || null,
      updatedHomePhone2: updated.UPDATED_HOME_PHONE_2 || null,
      updatedMobilePhone1: updated.UPDATED_MOBILE_PHONE_1 || null,
      updatedMobilePhone2: updated.UPDATED_MOBILE_PHONE_2 || null,
      loginCount: updated.LOGIN_COUNT || 0,
      updateCount: updated.UPDATE_COUNT || 0,
      updatedAt: updated.UPDATED_AT,
    }
    
    return NextResponse.json(
      createSuccessResponse(responseData, '資料更新成功'),
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
