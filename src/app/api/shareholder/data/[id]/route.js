/**
 * 股東資料查詢與更新 API
 * GET /api/shareholder/data/[id] - 查詢股東資料
 * PUT /api/shareholder/data/[id] - 更新股東資料
 * 
 * 注意：路徑參數 [id] 為股東代號（6位數字），而非數字 ID
 */

import { NextResponse } from 'next/server'
import { validatePhone, validateAddress } from '@/lib/validation'
import { createErrorByCode, createSuccessResponse, ERROR_CODES } from '@/lib/errors'
import db from '@/lib/db'

/**
 * GET 請求處理器 - 查詢股東資料
 * @param {Request} request - Next.js Request 物件
 * @param {object} params - 路由參數（id 為股東代號，6位數字）
 * @returns {Promise<NextResponse>} API 回應
 */
export async function GET(request, { params }) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.MISSING_REQUIRED_FIELD, '股東代號為必填'),
        { status: 400 }
      )
    }
    
    // 驗證股東代號格式（6位數字）
    if (!/^\d{6}$/.test(id)) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.INVALID_FORMAT, '股東代號格式錯誤，應為6位數字'),
        { status: 400 }
      )
    }
    
    // 查詢股東資料（使用 SHAREHOLDER_CODE 作為主鍵）
    const query = `
      SELECT SHAREHOLDER_CODE, ID_NUMBER, BIRTH_DATE, NAME, UUID, 
             ORIGINAL_ADDRESS, ORIGINAL_HOME_PHONE, ORIGINAL_MOBILE_PHONE,
             UPDATED_ADDRESS, UPDATED_HOME_PHONE, UPDATED_MOBILE_PHONE,
             LOGIN_COUNT, UPDATE_COUNT,
             CREATED_AT, UPDATED_AT
      FROM [STAGE].[dbo].[testrachel]
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
      idNumber: shareholder.ID_NUMBER,
      birthDate: shareholder.BIRTH_DATE,
      name: shareholder.NAME,
      uuid: shareholder.UUID,
      originalAddress: shareholder.ORIGINAL_ADDRESS,
      originalHomePhone: shareholder.ORIGINAL_HOME_PHONE || null,
      originalMobilePhone: shareholder.ORIGINAL_MOBILE_PHONE || null,
      updatedAddress: shareholder.UPDATED_ADDRESS || null,
      updatedHomePhone: shareholder.UPDATED_HOME_PHONE || null,
      updatedMobilePhone: shareholder.UPDATED_MOBILE_PHONE || null,
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
 * @param {object} params - 路由參數（id 為股東代號，6位數字）
 * @returns {Promise<NextResponse>} API 回應
 */
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    const { updatedAddress, updatedHomePhone, updatedMobilePhone, logId } = body
    
    if (!id) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.MISSING_REQUIRED_FIELD, '股東代號為必填'),
        { status: 400 }
      )
    }
    
    // 驗證股東代號格式（6位數字）
    if (!/^\d{6}$/.test(id)) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.INVALID_FORMAT, '股東代號格式錯誤，應為6位數字'),
        { status: 400 }
      )
    }
    
    // 檢查是否有提供任何要更新的欄位
    if (updatedAddress === undefined && updatedHomePhone === undefined && updatedMobilePhone === undefined) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.MISSING_REQUIRED_FIELD, '至少需要提供一個要更新的欄位'),
        { status: 400 }
      )
    }
    
    // 先查詢現有資料（使用 SHAREHOLDER_CODE 作為主鍵）
    // 需要同時取得 ORIGINAL_* 和 UPDATED_* 欄位以計算預設值
    const selectQuery = `
      SELECT 
        ORIGINAL_ADDRESS, ORIGINAL_HOME_PHONE, ORIGINAL_MOBILE_PHONE,
        UPDATED_ADDRESS, UPDATED_HOME_PHONE, UPDATED_MOBILE_PHONE
      FROM [STAGE].[dbo].[testrachel]
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
    
    const defaultAddress = getDefaultValue(existing.UPDATED_ADDRESS, existing.ORIGINAL_ADDRESS)
    const defaultHomePhone = getDefaultValue(existing.UPDATED_HOME_PHONE, existing.ORIGINAL_HOME_PHONE) || null
    const defaultMobilePhone = getDefaultValue(existing.UPDATED_MOBILE_PHONE, existing.ORIGINAL_MOBILE_PHONE) || null
    
    // 處理有提供的欄位，比較前端值與預設值
    const updateFields = []
    const updateParams = { shareholderCode: id }
    const updatedParams = {} // 用於記錄實際更新的值（供日誌使用）
    
    if (updatedAddress !== undefined) {
      // 驗證地址格式
      const addressValidation = validateAddress(updatedAddress)
      if (!addressValidation.valid) {
        return NextResponse.json(
          createErrorByCode(ERROR_CODES.INVALID_FORMAT, addressValidation.error),
          { status: 400 }
        )
      }
      
      const trimmedAddress = updatedAddress.trim()
      // 比較前端值與預設值
      if (trimmedAddress !== defaultAddress) {
        // 有變更：覆蓋 UPDATED_ADDRESS
        updateFields.push('UPDATED_ADDRESS = @updatedAddress')
        updateParams.updatedAddress = trimmedAddress
        updatedParams.updatedAddress = trimmedAddress
      }
      // 如果相同，UPDATED_ADDRESS 保持不變
    }
    
    if (updatedHomePhone !== undefined) {
      // 驗證電話格式
      const phoneValidation = validatePhone(updatedHomePhone)
      if (!phoneValidation.valid) {
        return NextResponse.json(
          createErrorByCode(ERROR_CODES.INVALID_FORMAT, phoneValidation.error),
          { status: 400 }
        )
      }
      
      const trimmedPhone = updatedHomePhone.trim() || null
      // 比較前端值與預設值（處理 NULL 值的情況）
      const frontendPhone = trimmedPhone || null
      const defaultPhone = defaultHomePhone || null
      if (frontendPhone !== defaultPhone) {
        // 有變更：覆蓋 UPDATED_HOME_PHONE
        updateFields.push('UPDATED_HOME_PHONE = @updatedHomePhone')
        updateParams.updatedHomePhone = trimmedPhone
        updatedParams.updatedHomePhone = trimmedPhone
      }
      // 如果相同，UPDATED_HOME_PHONE 保持不變
    }
    
    if (updatedMobilePhone !== undefined) {
      // 驗證手機格式
      const phoneValidation = validatePhone(updatedMobilePhone)
      if (!phoneValidation.valid) {
        return NextResponse.json(
          createErrorByCode(ERROR_CODES.INVALID_FORMAT, phoneValidation.error),
          { status: 400 }
        )
      }
      
      const trimmedPhone = updatedMobilePhone.trim() || null
      // 比較前端值與預設值（處理 NULL 值的情況）
      const frontendPhone = trimmedPhone || null
      const defaultPhone = defaultMobilePhone || null
      if (frontendPhone !== defaultPhone) {
        // 有變更：覆蓋 UPDATED_MOBILE_PHONE
        updateFields.push('UPDATED_MOBILE_PHONE = @updatedMobilePhone')
        updateParams.updatedMobilePhone = trimmedPhone
        updatedParams.updatedMobilePhone = trimmedPhone
      }
      // 如果相同，UPDATED_MOBILE_PHONE 保持不變
    }
    
    // 檢查是否有任何欄位變更
    const hasDataChange = updateFields.length > 0

    // 更新資料：只更新有變更的 UPDATED_* 欄位，但總是記錄修改次數
    const updateQuery = `
      UPDATE [STAGE].[dbo].[testrachel]
      SET ${updateFields.length > 0 ? updateFields.join(', ') + ',' : ''}
          UPDATE_COUNT = UPDATE_COUNT + 1,
          UPDATED_AT = GETDATE()
      WHERE SHAREHOLDER_CODE = @shareholderCode
    `

    await db.query(updateQuery, updateParams)

    // 更新 testrachel_log 記錄（如果提供了 logId）
    if (logId) {
      const updateLogQuery = `
        UPDATE [STAGE].[dbo].[testrachel_log]
        SET HAS_UPDATED_DATA = @hasUpdatedData,
            UPDATED_ADDRESS = @updatedAddress,
            UPDATED_HOME_PHONE = @updatedHomePhone,
            UPDATED_MOBILE_PHONE = @updatedMobilePhone
        WHERE LOG_ID = @logId AND SHAREHOLDER_CODE = @shareholderCode
      `

      // 準備日誌更新參數
      const logUpdateParams = {
        logId,
        shareholderCode: id,
        hasUpdatedData: hasDataChange ? 1 : 0,
        updatedAddress: hasDataChange && updatedParams.updatedAddress !== undefined ? updatedParams.updatedAddress : null,
        updatedHomePhone: hasDataChange && updatedParams.updatedHomePhone !== undefined ? updatedParams.updatedHomePhone : null,
        updatedMobilePhone: hasDataChange && updatedParams.updatedMobilePhone !== undefined ? updatedParams.updatedMobilePhone : null,
      }

      await db.query(updateLogQuery, logUpdateParams)
    }
    
    // 查詢更新後的資料
    const updatedQuery = `
      SELECT SHAREHOLDER_CODE, ID_NUMBER, NAME, UPDATED_ADDRESS, UPDATED_HOME_PHONE, UPDATED_MOBILE_PHONE, 
             LOGIN_COUNT, UPDATE_COUNT, UPDATED_AT
      FROM [STAGE].[dbo].[testrachel]
      WHERE SHAREHOLDER_CODE = @shareholderCode
    `
    
    const updatedData = await db.query(updatedQuery, { shareholderCode: id })
    const updated = updatedData[0]
    
    const responseData = {
      shareholderCode: updated.SHAREHOLDER_CODE,
      idNumber: updated.ID_NUMBER,
      name: updated.NAME,
      updatedAddress: updated.UPDATED_ADDRESS || null,
      updatedHomePhone: updated.UPDATED_HOME_PHONE || null,
      updatedMobilePhone: updated.UPDATED_MOBILE_PHONE || null,
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
