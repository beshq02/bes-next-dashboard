/**
 * 股東列表查詢 API
 * GET /api/shareholder/list
 * 
 * 查詢所有股東資料列表（用於管理頁面顯示）
 * 從資料庫取得所有股東的基本資料
 */

import { NextResponse } from 'next/server'
import { createErrorByCode, createSuccessResponse, ERROR_CODES } from '@/lib/errors'
import db from '@/lib/db'

/**
 * GET 請求處理器 - 查詢所有股東列表
 * @param {Request} request - Next.js Request 物件
 * @returns {Promise<NextResponse>} API 回應
 */
export async function GET(request) {
  try {
    // 查詢所有股東資料（包含所有需要的欄位）
    const query = `
      SELECT 
        SHAREHOLDER_CODE, 
        ID_NUMBER, 
        NAME, 
        UUID,
        ORIGINAL_ADDRESS,
        UPDATED_ADDRESS,
        ORIGINAL_HOME_PHONE,
        UPDATED_HOME_PHONE,
        ORIGINAL_MOBILE_PHONE,
        UPDATED_MOBILE_PHONE,
        LOGIN_COUNT,
        UPDATE_COUNT
      FROM [STAGE].[dbo].[testrachel]
      ORDER BY SHAREHOLDER_CODE ASC
    `
    
    let shareholders
    try {
      // 明確傳遞空參數物件
      shareholders = await db.query(query, {})
    } catch (dbError) {
      console.error('資料庫查詢錯誤:', {
        message: dbError.message,
        stack: dbError.stack,
        code: dbError.code,
        originalError: dbError.originalError
      })
      throw dbError
    }
    
    // 轉換資料格式（大寫欄位名稱轉 camelCase）
    // 如果查詢結果為空陣列，也應該返回空陣列而不是錯誤
    const responseData = (shareholders || []).map((shareholder, index) => {
      // 處理空字串和 null 值
      const getValue = (value) => {
        if (value === null || value === undefined) return null
        const strValue = String(value).trim()
        return strValue === '' ? null : strValue
      }
      
      // 支援大小寫不敏感的欄位名稱讀取
      const getField = (obj, ...possibleKeys) => {
        for (const key of possibleKeys) {
          if (key in obj) return obj[key]
          // 嘗試大小寫不敏感匹配
          const lowerKey = key.toLowerCase()
          const upperKey = key.toUpperCase()
          for (const objKey of Object.keys(obj)) {
            if (objKey.toLowerCase() === lowerKey || objKey.toUpperCase() === upperKey) {
              return obj[objKey]
            }
          }
        }
        return null
      }
      
      // 調試：記錄第一筆資料的原始欄位
      if (index === 0) {
        console.log('第一筆原始資料:', {
          allKeys: Object.keys(shareholder),
          SHAREHOLDER_CODE: getField(shareholder, 'SHAREHOLDER_CODE', 'shareholder_code'),
          ORIGINAL_ADDRESS: getField(shareholder, 'ORIGINAL_ADDRESS', 'original_address'),
          UPDATED_ADDRESS: getField(shareholder, 'UPDATED_ADDRESS', 'updated_address'),
          ORIGINAL_HOME_PHONE: getField(shareholder, 'ORIGINAL_HOME_PHONE', 'original_home_phone'),
          UPDATED_HOME_PHONE: getField(shareholder, 'UPDATED_HOME_PHONE', 'updated_home_phone'),
          ORIGINAL_MOBILE_PHONE: getField(shareholder, 'ORIGINAL_MOBILE_PHONE', 'original_mobile_phone'),
          UPDATED_MOBILE_PHONE: getField(shareholder, 'UPDATED_MOBILE_PHONE', 'updated_mobile_phone'),
        })
      }
      
      const result = {
        shareholderCode: getField(shareholder, 'SHAREHOLDER_CODE', 'shareholder_code') || null,
        idNumber: getField(shareholder, 'ID_NUMBER', 'id_number') || null,
        name: getField(shareholder, 'NAME', 'name') || null,
        uuid: getField(shareholder, 'UUID', 'uuid') || null,
        originalAddress: getValue(getField(shareholder, 'ORIGINAL_ADDRESS', 'original_address')),
        updatedAddress: getValue(getField(shareholder, 'UPDATED_ADDRESS', 'updated_address')),
        originalHomePhone: getValue(getField(shareholder, 'ORIGINAL_HOME_PHONE', 'original_home_phone')),
        updatedHomePhone: getValue(getField(shareholder, 'UPDATED_HOME_PHONE', 'updated_home_phone')),
        originalMobilePhone: getValue(getField(shareholder, 'ORIGINAL_MOBILE_PHONE', 'original_mobile_phone')),
        updatedMobilePhone: getValue(getField(shareholder, 'UPDATED_MOBILE_PHONE', 'updated_mobile_phone')),
        loginCount: getField(shareholder, 'LOGIN_COUNT', 'login_count') != null ? Number(getField(shareholder, 'LOGIN_COUNT', 'login_count')) : 0,
        updateCount: getField(shareholder, 'UPDATE_COUNT', 'update_count') != null ? Number(getField(shareholder, 'UPDATE_COUNT', 'update_count')) : 0,
      }
      
      // 調試：記錄第一筆資料的轉換結果
      if (index === 0) {
        console.log('第一筆轉換後資料:', result)
      }
      
      return result
    })
    
    return NextResponse.json(createSuccessResponse(responseData))
  } catch (error) {
    console.error('查詢股東列表錯誤:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    })
    
    // 檢查是否是資料庫相關錯誤
    const errorMessage = error.message || ''
    if (errorMessage.includes('資料庫') || errorMessage.includes('資料庫查詢失敗') || errorMessage.includes('資料庫連接失敗') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('timeout')) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.DATABASE_ERROR, `資料庫查詢失敗: ${errorMessage}`),
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      createErrorByCode(ERROR_CODES.INTERNAL_SERVER_ERROR, `伺服器錯誤: ${errorMessage}`),
      { status: 500 }
    )
  }
}
