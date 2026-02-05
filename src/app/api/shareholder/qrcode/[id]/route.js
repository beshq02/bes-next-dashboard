/**
 * QR Code 產生 API
 * GET /api/shareholder/qrcode/[id]
 * 
 * 為指定股東產生 QR Code 圖片
 */

import { NextResponse } from 'next/server'
import { generateQRCode } from '@/lib/qrcode'
import { createErrorByCode, createSuccessResponse, ERROR_CODES } from '@/lib/errors'
import db from '@/lib/db'
import { getBaseUrlFromRequest } from '@/lib/url'

/**
 * GET 請求處理器
 * @param {Request} request - Next.js Request 物件
 * @param {object} params - 路由參數
 * @returns {Promise<NextResponse>} API 回應
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.MISSING_REQUIRED_FIELD, '股東識別碼為必填'),
        { status: 400 }
      )
    }
    
    // 判斷輸入是6位股東代號還是 UUID
    const isSixDigit = /^\d{6}$/.test(id)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    
    let shareholder = null
    let qrCodeUUID = id
    
    if (isSixDigit) {
      // 輸入6位股東代號，根據 SHAREHOLDER_CODE 查詢 UUID
      const query = `
        SELECT NAME, SHAREHOLDER_CODE, UUID
        FROM [STAGE].[dbo].[SHAREHOLDER]
        WHERE SHAREHOLDER_CODE = @shareholderCode
      `
      
      const shareholders = await db.query(query, { shareholderCode: id })
      
      if (!shareholders || shareholders.length === 0) {
        return NextResponse.json(
          createErrorByCode(ERROR_CODES.SHAREHOLDER_NOT_FOUND, '找不到指定的股東代號'),
          { status: 404 }
        )
      }
      
      shareholder = shareholders[0]
      
      // 使用資料庫中的 UUID
      if (shareholder.UUID) {
        qrCodeUUID = shareholder.UUID
      } else {
        return NextResponse.json(
          createErrorByCode(ERROR_CODES.SHAREHOLDER_NOT_FOUND, '找不到對應的 UUID'),
          { status: 404 }
        )
      }
    } else if (isUUID) {
      // 輸入 UUID，根據 UUID 查詢
      const query = `
        SELECT NAME, SHAREHOLDER_CODE, UUID
        FROM [STAGE].[dbo].[SHAREHOLDER]
        WHERE UUID = @uuid
      `
      
      const shareholders = await db.query(query, { uuid: id })
      
      if (!shareholders || shareholders.length === 0) {
        return NextResponse.json(
          createErrorByCode(ERROR_CODES.SHAREHOLDER_NOT_FOUND, '找不到指定的 QR Code'),
          { status: 404 }
        )
      }
      
      shareholder = shareholders[0]
      qrCodeUUID = id
    } else {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.INVALID_FORMAT, '股東識別碼格式錯誤，應為6位數字或 UUID'),
        { status: 400 }
      )
    }
    
    // 取得 base URL（使用共用函數）
    const baseUrl = getBaseUrlFromRequest(request)
    
    // 產生 QR Code（標準解析度，不使用印刷模式，含 Logo）
    const qrCodeData = await generateQRCode(qrCodeUUID, baseUrl, false, true)
    
    // 在回應中包含 baseUrl，供客戶端使用
    return NextResponse.json(createSuccessResponse({
      ...qrCodeData,
      baseUrl, // 回傳 baseUrl 供客戶端使用
    }))
  } catch (error) {
    console.error('QR Code 產生錯誤:', error)
    
    // 如果是 QR Code 產生錯誤
    if (error.message.includes('QR Code')) {
      return NextResponse.json(
        createErrorByCode(ERROR_CODES.QR_CODE_GENERATION_FAILED),
        { status: 500 }
      )
    }
    
    // 其他錯誤
    return NextResponse.json(
      createErrorByCode(ERROR_CODES.INTERNAL_SERVER_ERROR),
      { status: 500 }
    )
  }
}
