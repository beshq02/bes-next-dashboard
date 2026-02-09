/**
 * 批次 QR Code 產生 API
 * POST /api/shareholder/qrcode/batch
 * 
 * 批次產生多個股東的 QR Code
 */

import db from '@/lib/db'
import { NextResponse } from 'next/server'
import { generateQRCode } from '@/lib/qrcode'
import { getBaseUrlFromRequest } from '@/lib/url'
import { ERROR_CODES, createErrorByCode, createSuccessResponse } from '@/lib/errors'

/**
 * POST 請求處理器
 * @param {Request} request - Next.js Request 物件
 * @returns {Promise<NextResponse>} API 回應
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { shareholderCodes, printMode = false } = body
    
    // 驗證必填欄位（接受6位股東代號陣列）
    if (!shareholderCodes || !Array.isArray(shareholderCodes) || shareholderCodes.length === 0) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.MISSING_REQUIRED_FIELD, '股東代號陣列為必填欄位（6位數字）'),
        { status: 400 }
      )
    }
    
    // 驗證所有輸入都是6位數字
    const invalidCodes = shareholderCodes.filter(code => !/^\d{6}$/.test(code))
    if (invalidCodes.length > 0) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.INVALID_FORMAT, `股東代號格式錯誤，應為6位數字：${invalidCodes.join(', ')}`),
        { status: 400 }
      )
    }
    
    // 取得 base URL（使用共用函數）
    const baseUrl = getBaseUrlFromRequest(request)
    
    // 根據6位股東代號查詢所有股東資料（使用 UUID）
    // 使用參數化查詢，為每個值建立單獨的參數
    // SQL Server 的參數化查詢需要明確指定每個參數
    const placeholders = shareholderCodes.map((_, index) => `@code${index}`).join(', ')
    const query = `
      SELECT NAME, [SORT], UUID
      FROM [STAGE].[dbo].[SHAREHOLDER]
      WHERE [SORT] IN (${placeholders})
    `
    
    // 建立參數物件，確保參數名稱與 SQL 中的佔位符一致
    const params = {}
    shareholderCodes.forEach((code, index) => {
      // 參數名稱必須與 SQL 中的 @code0, @code1 等一致
      // 確保參數值是字串類型
      params[`code${index}`] = String(code)
    })
    
    let shareholders
    try {
      shareholders = await db.query(query, params)
    } catch (dbError) {
      console.error('批次查詢股東資料錯誤:', {
        message: dbError.message,
        stack: dbError.stack,
        code: dbError.code,
        originalError: dbError.originalError,
        query: query,
        params: params,
        placeholderCount: placeholders.split(',').length,
        codesCount: shareholderCodes.length
      })
      throw dbError
    }
    
    if (!shareholders || shareholders.length === 0) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.SHAREHOLDER_NOT_FOUND, '找不到指定的股東'),
        { status: 404 }
      )
    }
    
    // 批次產生 QR Code
    const qrCodeResults = await Promise.all(
      shareholders.map(async (shareholder) => {
        try {
          // 直接使用資料庫中的 UUID
          const qrCodeUUID = shareholder.UUID
          
          if (!qrCodeUUID) {
            throw new Error('UUID 不存在')
          }
          
          // 產生 QR Code（根據 printMode 參數決定解析度）
          const qrCodeData = await generateQRCode(
            qrCodeUUID,
            baseUrl,
            printMode, // 使用請求中的 printMode 參數
            true // 加入 Logo
          )
          
          return {
            shareholderCode: shareholder.SORT,
            name: shareholder.NAME,
            uuid: qrCodeUUID,
            qrCodeUrl: qrCodeData.qrCodeUrl,
            qrCodeDataUrl: qrCodeData.qrCodeDataUrl,
          }
        } catch (error) {
          console.error(`產生 QR Code 失敗 (股東代號: ${shareholder.SORT}):`, error)
          return {
            shareholderCode: shareholder.SORT,
            name: shareholder.NAME,
            error: error.message,
          }
        }
      })
    )
    
    return NextResponse.json(
      createSuccessResponse({
        qrCodes: qrCodeResults,
        total: qrCodeResults.length,
        successCount: qrCodeResults.filter((r) => !r.error).length,
        errorCount: qrCodeResults.filter((r) => r.error).length,
        baseUrl, // 回傳 baseUrl 供客戶端使用
      })
    )
  } catch (error) {
    console.error('批次 QR Code 產生錯誤:', error)
    
    return NextResponse.json(
      createErrorByCode(ERROR_CODES.INTERNAL_SERVER_ERROR),
      { status: 500 }
    )
  }
}
